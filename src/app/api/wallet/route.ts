import { NextRequest, NextResponse } from 'next/server';
import { getBalance, setBalance, getTransactions, addTransaction } from '@/lib/redis';

export async function GET() {
  try {
    const balance = await getBalance();
    const transactions = await getTransactions(20);

    return NextResponse.json({ 
      balance, 
      transactions 
    });
  } catch (error) {
    console.error('Failed to fetch wallet data:', error);
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

    const currentBalance = await getBalance();
    const newBalance = currentBalance + amount;
    
    await setBalance(newBalance);
    await addTransaction(description || 'Deposit', amount, 'receive');

    return NextResponse.json({
      success: true,
      message: `Added $${amount} to wallet`,
      balance: newBalance,
    });
  } catch (error) {
    console.error('Failed to add funds:', error);
    return NextResponse.json(
      { error: 'Failed to add funds' },
      { status: 500 }
    );
  }
}
