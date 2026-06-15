import fs from 'node:fs';
import path from 'node:path';

const testDbPath = path.resolve(process.cwd(), 'data/test.db');
if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

process.env.DB_PATH = testDbPath;
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { run, all } = await import('../src/db/client.js');
const { migrationStatements } = await import('../src/db/migrations.js');
const request = (await import('supertest')).default;

describe('Auth and authorization', () => {
  let customerToken;
  let adminToken;
  let customerAccountId;

  beforeAll(async () => {
    for (const statement of migrationStatements) {
      await run(statement);
    }

    await request(app).post('/api/auth/register').send({
      email: 'customer-test@bank.local',
      password: 'CustomerPassword123!',
      fullName: 'Customer Test',
    });

    const adminRegister = await request(app).post('/api/auth/register').send({
      email: 'admin-test@bank.local',
      password: 'AdminPassword123!',
      fullName: 'Admin Test',
    });

    await run("UPDATE users SET role = 'admin' WHERE id = ?", [adminRegister.body.user.id]);

    const customerLogin = await request(app).post('/api/auth/login').send({
      email: 'customer-test@bank.local',
      password: 'CustomerPassword123!',
    });

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin-test@bank.local',
      password: 'AdminPassword123!',
    });

    customerToken = customerLogin.body.accessToken;
    adminToken = adminLogin.body.accessToken;

    const customerAccount = await all('SELECT id FROM accounts WHERE user_id = ?', [customerLogin.body.user.id]);
    customerAccountId = customerAccount[0].id;
  });

  test('returns user profile for valid token', async () => {
    const response = await request(app).get('/api/users/me').auth(customerToken, { type: 'bearer' }).expect(200);
    expect(response.body.email).toBe('customer-test@bank.local');
  });

  test('blocks customer from accessing another account', async () => {
    const allAccounts = await all('SELECT id FROM accounts');
    const forbiddenAccount = allAccounts.find((account) => account.id !== customerAccountId);

    await request(app)
      .get(`/api/accounts/${forbiddenAccount.id}`)
      .auth(customerToken, { type: 'bearer' })
      .expect(403);
  });

  test('allows admin to access any account', async () => {
    const allAccounts = await all('SELECT id FROM accounts');

    const response = await request(app)
      .get(`/api/accounts/${allAccounts[0].id}`)
      .auth(adminToken, { type: 'bearer' })
      .expect(200);

    expect(response.body.id).toBe(allAccounts[0].id);
  });
});
