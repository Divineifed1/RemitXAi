import { NextRequest, NextResponse } from 'next/server';
import { getBalance, deduct, recordTransaction } from '@/lib/supabase-db';

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

    console.log('[Payment API] Received payment request:', { name, amount });

    const currentBalance = await getBalance();
    console.log('[Payment API] Current balance:', currentBalance);

    if (currentBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - amount;
    await deduct(amount);
    await recordTransaction(name, amount, 'send');

    console.log('[Payment API] Payment complete. New balance:', newBalance);

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
