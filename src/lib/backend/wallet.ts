import { db, WalletRow, TransactionRow } from '@/lib/db';

export function getBalance(): number {
  const wallet = db.prepare('SELECT balance FROM wallet WHERE id = 1').get() as WalletRow;
  return wallet?.balance ?? 0;
}

export function getTransactions(limit = 20): TransactionRow[] {
  return db
    .prepare('SELECT * FROM transactions ORDER BY created_at DESC LIMIT ?')
    .all(limit) as TransactionRow[];
}

export function deduct(amount: number): boolean {
  const wallet = db.prepare('SELECT balance FROM wallet WHERE id = 1').get() as WalletRow;
  if (!wallet || amount > wallet.balance) {
    return false;
  }
  db.prepare('UPDATE wallet SET balance = balance - ? WHERE id = 1').run(amount);
  return true;
}

export function add(amount: number, description: string): void {
  db.prepare('UPDATE wallet SET balance = balance + ? WHERE id = 1').run(amount);
  db.prepare('INSERT INTO transactions (recipient, amount, type) VALUES (?, ?, ?)').run(
    description,
    amount,
    'receive'
  );
}

export function recordTransaction(recipient: string, amount: number, type: 'send' | 'receive'): void {
  db.prepare('INSERT INTO transactions (recipient, amount, type) VALUES (?, ?, ?)').run(
    recipient,
    amount,
    type
  );
}