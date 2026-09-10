import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

const connectionString = 'postgresql://postgres.kiekmbxionrdegcazgez:HAALAND9d%23$@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

const schemaPath = path.join(process.cwd(), 'supabase', 'schema.sql');
const sql = fs.readFileSync(schemaPath, 'utf8');

const sqlClient = postgres(connectionString, { max: 1 });

async function migrate() {
  try {
    await sqlClient.unsafe(sql);
    console.log('Schema applied successfully');
  } catch (error) {
    console.error('Error applying schema:', error);
  } finally {
    await sqlClient.end();
  }
}

migrate();
