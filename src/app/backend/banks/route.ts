import { NextRequest, NextResponse } from 'next/server';
import { getBankAccounts, addBankAccount } from '@/lib/supabase-db';

export async function GET() {
  try {
    const accounts = await getBankAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Failed to fetch bank accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankName, accountNumber, accountName } = body;

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json(
        { error: 'Bank name, account number, and account name are required' },
        { status: 400 }
      );
    }

    const account = await addBankAccount(bankName, accountNumber, accountName);

    return NextResponse.json(
      {
        success: true,
        account,
        message: `Bank account ${accountName} added successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to add bank account:', error);
    return NextResponse.json(
      { error: 'Failed to add bank account' },
      { status: 500 }
    );
  }
}
