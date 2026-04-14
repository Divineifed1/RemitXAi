import { NextRequest, NextResponse } from 'next/server';
import { getBalance, add, getTransactions } from '@/lib/backend/wallet';

export async function GET() {
  try {
    const balance = getBalance();
    const transactions = getTransactions();
    return NextResponse.json({ balance, transactions });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const desc = description || 'Wallet top-up';
    add(amount, desc);

    const balance = getBalance();
    return NextResponse.json({
      success: true,
      message: `Added $${amount} to wallet`,
      balance,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add funds' },
      { status: 500 }
    );
  }
}