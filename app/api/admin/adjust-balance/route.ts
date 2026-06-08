import { NextResponse } from 'next/server';
// 🔵 FIXED: Uses absolute pathing alias so it never breaks regardless of file depth
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { targetUserId, amount, adjustmentType, recipientAccount } = await request.json();

    if (!targetUserId || !amount || !adjustmentType) {
      return NextResponse.json({ error: 'Missing required parameters.' }, { status: 400 });
    }

    // Connects with the database bypass client to inject/deduct balance metrics
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .insert([
        {
          user_id: targetUserId,
          amount: parseFloat(amount),
          type: adjustmentType,
          recipient_account: recipientAccount,
          status: 'Settled'
        }
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}