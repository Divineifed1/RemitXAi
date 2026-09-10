import { supabaseAdmin, hasSupabaseConfig } from './supabase';

export interface WalletRow {
  id: number;
  balance: number;
}

export interface RecipientRow {
  id: number;
  name: string;
  wallet: string;
}

export interface TransactionRow {
  id: number;
  recipient: string;
  amount: number;
  type: 'send' | 'receive';
  created_at: string;
}

let useInMemory = false;
let inMemoryWallet = { balance: 500 };
let inMemoryTransactions: TransactionRow[] = [];
let inMemoryRecipients: { name: string; wallet: string }[] = [
  { name: 'john', wallet: 'GCFX123456789' },
  { name: 'sarah', wallet: 'GABCD456789' },
  { name: 'david', wallet: 'GXYZW789012' },
  { name: 'divine', wallet: 'GCFX2983746510' },
];

if (!hasSupabaseConfig) {
  console.log('Supabase not configured, using in-memory demo mode');
  useInMemory = true;
}

export async function getBalance(): Promise<number> {
  if (useInMemory || !supabaseAdmin) return inMemoryWallet.balance;

  const { data, error } = await supabaseAdmin
    .from('wallet')
    .select('balance')
    .eq('id', 1)
    .single();

  if (error || !data) return inMemoryWallet.balance;
  return data.balance;
}

export async function getTransactions(limit = 20): Promise<TransactionRow[]> {
  if (useInMemory || !supabaseAdmin) return inMemoryTransactions.slice(0, limit);

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return inMemoryTransactions.slice(0, limit);
  return data as TransactionRow[];
}

export async function deduct(amount: number): Promise<boolean> {
  if (useInMemory || !supabaseAdmin) {
    if (amount > inMemoryWallet.balance) return false;
    inMemoryWallet.balance -= amount;
    return true;
  }

  const { data: wallet, error: fetchError } = await supabaseAdmin
    .from('wallet')
    .select('balance')
    .eq('id', 1)
    .single();

  if (fetchError || !wallet || amount > wallet.balance) return false;

  const { error: updateError } = await supabaseAdmin
    .from('wallet')
    .update({ balance: wallet.balance - amount })
    .eq('id', 1);

  return !updateError;
}

export async function add(amount: number, description: string): Promise<void> {
  if (useInMemory || !supabaseAdmin) {
    inMemoryWallet.balance += amount;
    inMemoryTransactions.push({
      id: Date.now(),
      recipient: description,
      amount,
      type: 'receive',
      created_at: new Date().toISOString(),
    });
    return;
  }

  const { data: wallet } = await supabaseAdmin
    .from('wallet')
    .select('balance')
    .eq('id', 1)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from('wallet')
      .update({ balance: wallet.balance + amount })
      .eq('id', 1);
  }

  await supabaseAdmin.from('transactions').insert({
    recipient: description,
    amount,
    type: 'receive',
  });
}

export async function recordTransaction(recipient: string, amount: number, type: 'send' | 'receive'): Promise<void> {
  if (useInMemory || !supabaseAdmin) {
    inMemoryTransactions.push({
      id: Date.now(),
      recipient,
      amount,
      type,
      created_at: new Date().toISOString(),
    });
    return;
  }

  await supabaseAdmin.from('transactions').insert({
    recipient,
    amount,
    type,
  });
}

export async function getRecipients(): Promise<{ name: string; wallet: string }[]> {
  if (useInMemory || !supabaseAdmin) return inMemoryRecipients;

  const { data, error } = await supabaseAdmin
    .from('recipients')
    .select('name, wallet');

  if (error || !data) return inMemoryRecipients;
  return data.map((row) => ({
    name: row.name,
    wallet: row.wallet,
  }));
}

export async function addRecipient(name: string, wallet: string): Promise<{ name: string; wallet: string }> {
  const newRecipient = { name: name.toLowerCase(), wallet };

  if (useInMemory || !supabaseAdmin) {
    inMemoryRecipients.push(newRecipient);
    return newRecipient;
  }

  const { error } = await supabaseAdmin.from('recipients').insert({
    name: name.toLowerCase(),
    wallet,
  });

  if (error) {
    throw new Error(error.message);
  }

  return newRecipient;
}

export async function findRecipientByName(name: string): Promise<{ name: string; wallet: string } | undefined> {
  if (useInMemory || !supabaseAdmin) {
    return inMemoryRecipients.find(r => r.name.toLowerCase() === name.toLowerCase());
  }

  const { data, error } = await supabaseAdmin
    .from('recipients')
    .select('name, wallet')
    .ilike('name', name.toLowerCase())
    .single();

  if (error || !data) return undefined;
  return { name: data.name, wallet: data.wallet };
}

export { useInMemory };
