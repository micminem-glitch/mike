import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // MUST use service role key
);

export async function POST(req: Request) {
  const { targetUserId, amount, adjustmentType, recipientAccount } = await req.json();

  // 1. Double check the user exists first
  const { data: user, error: userError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', targetUserId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // 2. Perform the insert
  const { error: txError } = await supabaseAdmin
    .from('transactions')
    .insert([{
      user_id: targetUserId,
      type: adjustmentType,
      amount: parseFloat(amount),
      recipient_account: recipientAccount,
      status: 'completed'
    }]);

  if (txError) return NextResponse.json({ error: txError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}