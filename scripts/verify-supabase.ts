process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://kiekmbxionrdegcazgez.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWttYnhpb25yZGVnY2F6Z2V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTE3MTQsImV4cCI6MjEwNDYyNzcxNH0.04Tkor4ZlRrqoNvGELmfZdnPLXf1TlF7fE-JuY5jVNI';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpZWttYnhpb25yZGVnY2F6Z2V6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTA1MTcxNCwiZXhwIjoyMTA0NjI3NzE0fQ.gajpHULUk6b3X1lj80s84tp3kS5tlw-9MXE-2_DfqL4';

import { getBalance, getRecipients, getTransactions } from '../src/lib/supabase-db';

async function verify() {
  try {
    const balance = await getBalance();
    console.log('Balance:', balance);

    const recipients = await getRecipients();
    console.log('Recipients count:', recipients.length);

    const transactions = await getTransactions(5);
    console.log('Transactions count:', transactions.length);

    console.log('Supabase connection verified successfully');
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  }
}

verify();
