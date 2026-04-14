import { NextRequest, NextResponse } from 'next/server';
import { getRecipients, addRecipient, findRecipientByName } from '@/lib/backend/recipients';
import { getBalance, add as addFunds } from '@/lib/backend/wallet';

export async function GET() {
  try {
    const recipients = getRecipients();
    return NextResponse.json({ recipients });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, wallet } = body;

    if (!name || !wallet) {
      return NextResponse.json(
        { error: 'Name and wallet are required' },
        { status: 400 }
      );
    }

    const existing = findRecipientByName(name);
    if (existing) {
      return NextResponse.json(
        { error: 'Recipient already exists' },
        { status: 409 }
      );
    }

    const recipient = addRecipient(name, wallet);

    const bonusAmount = 50;
    addFunds(bonusAmount, `Welcome bonus for adding ${name}`);

    const balance = getBalance();

    return NextResponse.json(
      {
        success: true,
        recipient,
        balance,
        message: `Added ${name} and received $${bonusAmount} welcome bonus!`,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to add recipient' },
      { status: 500 }
    );
  }
}