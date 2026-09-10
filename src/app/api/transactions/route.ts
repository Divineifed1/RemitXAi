import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/supabase-db';

export async function GET() {
  try {
    const transactions = await getTransactions(50);
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('[Transactions API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
