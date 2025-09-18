import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL;

async function main() {
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Please export it before running migrations.');
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1, idle_timeout: 0 });
  const migrationsDir = resolve('supabase', 'migrations');
  const entries = await readdir(migrationsDir);
  const migrationFiles = entries.filter((file) => file.endsWith('.sql')).sort();

  console.log(`Applying ${migrationFiles.length} migration(s) to ${maskDatabaseUrl(databaseUrl)}...`);

  try {
    for (const file of migrationFiles) {
      const filePath = join(migrationsDir, file);
      const sqlText = await readFile(filePath, 'utf8');
      console.log(`
▶ ${file}`);
      await sql.unsafe(sqlText);
    }
    console.log('
✅ Migrations complete');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function maskDatabaseUrl(url: string) {
  const [base, params] = url.split('@');
  if (!params) return url;
  const masked = base.replace(/:(.*)$/u, ':********');
  return `${masked}@${params}`;
}

main().catch((error) => {
  console.error('
❌ Migration failed');
  console.error(error);
  process.exit(1);
});
