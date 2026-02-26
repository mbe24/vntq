import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/vntq';
const sql = postgres(connectionString, { max: 1 });

async function run() {
  await sql`
    CREATE TABLE IF NOT EXISTS _vntq_migrations (
      name text PRIMARY KEY,
      executed_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  const folder = join(process.cwd(), 'drizzle');
  const files = (await readdir(folder)).filter((name) => name.endsWith('.sql')).sort();

  for (const file of files) {
    const applied = await sql<{ name: string }[]>`SELECT name FROM _vntq_migrations WHERE name = ${file} LIMIT 1`;
    if (applied.length > 0) {
      continue;
    }

    const query = await readFile(join(folder, file), 'utf8');
    await sql.begin(async (tx) => {
      await tx.unsafe(query);
      await tx`INSERT INTO _vntq_migrations (name) VALUES (${file})`;
    });
  }
}

run()
  .then(async () => {
    await sql.end();
    console.log('Migrations applied successfully.');
  })
  .catch(async (error) => {
    console.error('Migration failed:', error);
    await sql.end();
    process.exit(1);
  });

