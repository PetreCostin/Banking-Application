import bcrypt from 'bcryptjs';
import { get, run } from '../src/db/client.js';

const seed = async () => {
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);
  const customerPasswordHash = await bcrypt.hash('CustomerPassword123!', 12);

  const admin = await get('SELECT id FROM users WHERE email = ?', ['admin@bank.local']);
  if (!admin) {
    await run('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)', [
      'admin@bank.local',
      adminPasswordHash,
      'Bank Admin',
      'admin',
    ]);
  }

  const customer = await get('SELECT id FROM users WHERE email = ?', ['customer@bank.local']);
  let customerId = customer?.id;

  if (!customer) {
    const result = await run('INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)', [
      'customer@bank.local',
      customerPasswordHash,
      'Demo Customer',
      'customer',
    ]);
    customerId = result.id;
  }

  const demoAccount = await get('SELECT id FROM accounts WHERE account_number = ?', ['ACC000002']);
  if (!demoAccount) {
    await run('INSERT INTO accounts (user_id, account_number, currency, balance) VALUES (?, ?, ?, ?)', [
      customerId,
      'ACC000002',
      'USD',
      1500,
    ]);
  }

    console.warn('Seed data applied successfully');
};

seed().catch((error) => {
    console.error(error);
  process.exit(1);
});
