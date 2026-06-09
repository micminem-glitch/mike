import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin'; // Ensure this points to your admin client

export async function POST(request: Request) {
  try {
    const { targetUserId, amount, adjustmentType, recipientAccount } = await request.json();

    if (!targetUserId || !amount || !adjustmentType) {
      return NextResponse.json({ error: 'Missing parameters.' }, { status: 400 });
    }

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
      ]);

    if (error) {
      console.error("Supabase Admin Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}