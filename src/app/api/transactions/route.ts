import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/redis';

export async function GET() {
  try {
    console.log('[Transactions API] Fetching transactions...');
    const transactions = await getTransactions(50);
    console.log('[Transactions API] Found:', transactions.length, 'transactions');
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[Transactions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}