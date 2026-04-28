import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    user: process.env.DATABASE_USER || 'obulus',
    password: process.env.DATABASE_PASSWORD || 'obulus_dev',
    database: process.env.DATABASE_NAME || 'd025d88e',
    multipleStatements: true,
  });

  // __dirname is src/database/ (dev) or dist/database/ (prod)
  // migrations/ lives two levels up at the package root
  const migrationsDir = path.resolve(__dirname, '../../migrations');

  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`→ ${file}`);
    await connection.query(sql);
    console.log(`  ✓ done`);
  }

  await connection.end();
  console.log('Migrations complete.');
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
