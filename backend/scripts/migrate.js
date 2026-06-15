import { run } from '../src/db/client.js';
import { migrationStatements } from '../src/db/migrations.js';

const migrate = async () => {
  for (const statement of migrationStatements) {
    await run(statement);
  }
    console.warn('Migrations applied successfully');
};

migrate().catch((error) => {
    console.error(error);
  process.exit(1);
});
