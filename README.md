# Banking Application

This repository now contains a secure full-stack baseline:

- `mobile/`: React Native client with authenticated API integration and secure token storage.
- `backend/`: Node.js + Express API with SQLite, migrations, seed data, auth, authorization, rate limiting, and audit logging.

## Product scope covered

- Authentication: register, login, refresh, logout, session revocation.
- Accounts: list own accounts, account detail with role-based access.
- Transactions: list transactions and transfer funds.
- Roles: `customer` and `admin` with resource-level authorization.

## Backend quick start

1. `cd /home/runner/work/Banking-Application/Banking-Application/PetreCostin/Banking-Application/backend`
2. `cp .env.example .env`
3. Configure strong JWT secrets in `.env`.
4. `npm install`
5. `npm run db:migrate`
6. `npm run db:seed`
7. `npm start`

Backend API base URL: `http://localhost:4000/api`

### Demo credentials (seed)

- Admin: `admin@bank.local` / `AdminPassword123!`
- Customer: `customer@bank.local` / `CustomerPassword123!`

## Mobile quick start

1. `cd /home/runner/work/Banking-Application/Banking-Application/PetreCostin/Banking-Application/mobile`
2. Ensure `mobile/src/config/apiConfig.js` points to your backend URL.
3. `npm install`
4. `npm start` (then run iOS/Android as needed)

## Security baseline

- Password hashing with bcrypt.
- JWT access + refresh token lifecycle with refresh-token revocation.
- Secure header hardening via `helmet`.
- CORS allowlist via environment configuration.
- API rate limiting (global + auth-specific).
- Input validation with Zod.
- Resource-level authorization for account and transaction data.
- Structured request logging with sensitive-field redaction.
- Audit logs for authentication and transfer actions.
- CI checks: lint, tests, dependency audit, and secret scanning.

## Operational hardening included

- Environment-specific config through `.env`.
- Health endpoint: `GET /api/health`.
- Data schema and migration entrypoint.

## Remaining production hardening recommendations

- Move from SQLite to managed production database.
- Store JWT secrets in cloud secret manager.
- Add centralized monitoring/alerting and immutable audit exports.
- Add encrypted backups and retention policy automation.
- Add WAF and API gateway with TLS termination.
