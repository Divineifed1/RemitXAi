import { NextRequest, NextResponse } from 'next/server';
import { getRecipients, addRecipient, findRecipientByName } from '@/lib/supabase-db';
import { getBalance, add } from '@/lib/supabase-db';

export async function GET() {
  try {
    const recipients = await getRecipients();
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

    const existing = await findRecipientByName(name);
    if (existing) {
      return NextResponse.json(
        { error: 'Recipient already exists' },
        { status: 409 }
      );
    }

    const recipient = await addRecipient(name, wallet);

    const bonusAmount = 50;
    await add(bonusAmount, `Welcome bonus for adding ${name}`);

    const balance = await getBalance();

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
