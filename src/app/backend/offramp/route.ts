import { NextRequest, NextResponse } from 'next/server';
import { getOfframpTransactions, createOfframpTransaction } from '@/lib/supabase-db';

export async function GET() {
  try {
    const transactions = await getOfframpTransactions();
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Failed to fetch off-ramp transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch off-ramp transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankAccountId, amount, nairaAmount, rate } = body;

    if (!bankAccountId || !amount || !nairaAmount || !rate) {
      return NextResponse.json(
        { error: 'Bank account ID, amount, Naira amount, and rate are required' },
        { status: 400 }
      );
    }

    if (amount <= 0 || nairaAmount <= 0 || rate <= 0) {
      return NextResponse.json(
        { error: 'Amounts and rate must be positive' },
        { status: 400 }
      );
    }

    const transaction = await createOfframpTransaction(bankAccountId, amount, nairaAmount, rate);

    return NextResponse.json(
      {
        success: true,
        transaction,
        message: `Off-ramp of $${amount} to ₦${nairaAmount} initiated successfully. Reference: ${transaction.reference}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create off-ramp transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create off-ramp transaction' },
      { status: 500 }
    );
  }
}
