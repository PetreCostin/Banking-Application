import app from './app.js';
import env from './config/env.js';
import { run } from './db/client.js';
import { migrationStatements } from './db/migrations.js';

const bootstrap = async () => {
  for (const statement of migrationStatements) {
    await run(statement);
  }

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`banking-backend listening on port ${env.port}`);
  });
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
