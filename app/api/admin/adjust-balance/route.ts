import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure this is set in your .env
);

export async function POST(req: Request) {
  try {
    const { targetUserId, amount, adjustmentType, recipientAccount } = await req.json();

    // 1. Get current user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', targetUserId)
      .single();

    if (profileError || !profile) throw new Error('User not found');

    // 2. Calculate New Balance
    const currentBalance = Number(profile.balance);
    const change = Number(amount);
    const newBalance = adjustmentType === 'Online Deposit' 
      ? currentBalance + change 
      : currentBalance - change;

    // 3. Update Profile Balance
    await supabaseAdmin
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', targetUserId);

    // 4. Log Transaction
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: targetUserId,
        amount: change,
        type: adjustmentType,
        recipient_account: recipientAccount,
        status: 'Completed'
      });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}