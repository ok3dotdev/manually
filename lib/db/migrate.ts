import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: './lib/db/migrations' });
  console.log('Migrations applied');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
