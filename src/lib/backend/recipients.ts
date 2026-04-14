import { db, RecipientRow } from '@/lib/db';

export interface Recipient {
  name: string;
  wallet: string;
}

export function getRecipients(): Recipient[] {
  const rows = db.prepare('SELECT name, wallet FROM recipients').all() as RecipientRow[];
  return rows.map((row) => ({
    name: row.name,
    wallet: row.wallet,
  }));
}

export function addRecipient(name: string, wallet: string): Recipient {
  const stmt = db.prepare('INSERT INTO recipients (name, wallet) VALUES (?, ?)');
  stmt.run(name.toLowerCase(), wallet);
  return { name: name.toLowerCase(), wallet };
}

export function findRecipientByName(name: string): Recipient | undefined {
  const row = db
    .prepare('SELECT name, wallet FROM recipients WHERE LOWER(name) = LOWER(?)')
    .get(name.toLowerCase()) as RecipientRow | undefined;
  if (!row) return undefined;
  return { name: row.name, wallet: row.wallet };
}