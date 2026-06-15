import { all, get, run } from '../db/client.js';
import { AppError } from '../lib/errors.js';
import { writeAuditLog } from './auditService.js';

export const getAccountsForUser = async (actor) => {
  if (actor.role === 'admin') {
    return all(
      `SELECT a.id, a.account_number AS accountNumber, a.currency, a.balance, a.user_id AS userId,
              u.full_name AS ownerName, u.email AS ownerEmail
       FROM accounts a JOIN users u ON u.id = a.user_id
       ORDER BY a.id`,
    );
  }

  return all(
    `SELECT id, account_number AS accountNumber, currency, balance, user_id AS userId
     FROM accounts WHERE user_id = ? ORDER BY id`,
    [actor.id],
  );
};

export const getAccountById = async (actor, accountId) => {
  const account = await get(
    `SELECT a.id, a.account_number AS accountNumber, a.currency, a.balance, a.user_id AS userId,
            u.full_name AS ownerName, u.email AS ownerEmail
     FROM accounts a JOIN users u ON u.id = a.user_id WHERE a.id = ?`,
    [accountId],
  );

  if (!account) throw new AppError(404, 'Account not found');
  if (actor.role !== 'admin' && account.userId !== actor.id) throw new AppError(403, 'Forbidden');

  return account;
};

export const getTransactions = async (actor, accountId = null) => {
  if (actor.role === 'admin') {
    if (!accountId) {
      return all(
        `SELECT id, account_id AS accountId, related_account_id AS relatedAccountId, type, amount, description, created_at AS createdAt
         FROM transactions ORDER BY id DESC LIMIT 200`,
      );
    }

    return all(
      `SELECT id, account_id AS accountId, related_account_id AS relatedAccountId, type, amount, description, created_at AS createdAt
       FROM transactions WHERE account_id = ? ORDER BY id DESC`,
      [accountId],
    );
  }

  const ownedAccounts = await all('SELECT id FROM accounts WHERE user_id = ?', [actor.id]);
  const ownedSet = new Set(ownedAccounts.map((item) => item.id));

  if (accountId && !ownedSet.has(Number(accountId))) throw new AppError(403, 'Forbidden');

  const ids = accountId ? [Number(accountId)] : [...ownedSet];
  if (ids.length === 0) return [];

  const placeholders = ids.map(() => '?').join(',');
  return all(
    `SELECT id, account_id AS accountId, related_account_id AS relatedAccountId, type, amount, description, created_at AS createdAt
     FROM transactions WHERE account_id IN (${placeholders}) ORDER BY id DESC LIMIT 200`,
    ids,
  );
};

export const transferFunds = async ({ actor, fromAccountId, toAccountNumber, amount, description = '' }) => {
  const fromAccount = await get(
    `SELECT id, user_id AS userId, account_number AS accountNumber, balance, currency
     FROM accounts WHERE id = ?`,
    [fromAccountId],
  );

  if (!fromAccount) throw new AppError(404, 'Source account not found');
  if (actor.role !== 'admin' && fromAccount.userId !== actor.id) throw new AppError(403, 'Forbidden');

  const toAccount = await get(
    `SELECT id, user_id AS userId, account_number AS accountNumber, balance, currency
     FROM accounts WHERE account_number = ?`,
    [toAccountNumber],
  );

  if (!toAccount) throw new AppError(404, 'Destination account not found');
  if (fromAccount.id === toAccount.id) throw new AppError(400, 'Cannot transfer to same account');
  if (fromAccount.currency !== toAccount.currency) throw new AppError(400, 'Cross-currency transfer is not supported');
  if (fromAccount.balance < amount) throw new AppError(400, 'Insufficient funds');

  await run('BEGIN TRANSACTION');
  try {
    await run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, fromAccount.id]);
    await run('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toAccount.id]);

    await run(
      `INSERT INTO transactions (account_id, related_account_id, type, amount, description, created_by)
       VALUES (?, ?, 'debit', ?, ?, ?)`,
      [fromAccount.id, toAccount.id, amount, description || `Transfer to ${toAccount.accountNumber}`, actor.id],
    );

    await run(
      `INSERT INTO transactions (account_id, related_account_id, type, amount, description, created_by)
       VALUES (?, ?, 'credit', ?, ?, ?)`,
      [toAccount.id, fromAccount.id, amount, description || `Transfer from ${fromAccount.accountNumber}`, actor.id],
    );

    await run('COMMIT');
  } catch (error) {
    await run('ROLLBACK');
    throw error;
  }

  await writeAuditLog({
    actorUserId: actor.id,
    action: 'TRANSFER_FUNDS',
    resourceType: 'account',
    resourceId: String(fromAccount.id),
    details: { fromAccountId, toAccountId: toAccount.id, amount },
  });

  return {
    message: 'Transfer completed',
    fromAccountId: fromAccount.id,
    toAccountId: toAccount.id,
    amount,
  };
};
