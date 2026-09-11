import postgres from 'postgres';

const connectionString = 'postgresql://postgres.kiekmbxionrdegcazgez:HAALAND9d%23$@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

const sqlClient = postgres(connectionString, { max: 1 });

async function check() {
  try {
    const recipients = await sqlClient`SELECT * FROM recipients ORDER BY id DESC LIMIT 5`;
    console.log('Recipients in DB:', recipients);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sqlClient.end();
  }
}

check();