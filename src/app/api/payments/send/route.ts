import { NextRequest, NextResponse } from 'next/server';
import { getBalance, setBalance, addTransaction } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount } = body;

    if (!name || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Name and amount are required' },
        { status: 400 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const currentBalance = await getBalance();
    
    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;
    await setBalance(newBalance);
    await addTransaction(name, amount, 'send');

    return NextResponse.json({
      success: true,
      message: `Successfully sent $${amount} to ${name}`,
      amount,
      recipient: name,
      newBalance,
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send payment' },
      { status: 500 }
    );
  }
}
