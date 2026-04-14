import { NextResponse } from 'next/server';
import { getTransactions } from '@/lib/backend/wallet';

export async function GET() {
  try {
    const transactions = getTransactions(50);
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}