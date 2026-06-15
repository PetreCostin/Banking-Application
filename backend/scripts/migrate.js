import { run } from '../src/db/client.js';
import { migrationStatements } from '../src/db/migrations.js';

const migrate = async () => {
  for (const statement of migrationStatements) {
    await run(statement);
  }
  // eslint-disable-next-line no-console
  console.log('Migrations applied successfully');
};

migrate().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
