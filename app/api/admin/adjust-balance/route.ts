import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 1. Tell Next.js to treat this as a dynamic server route (Prevents build-time evaluation)
export const dynamic = "force-dynamic";

// 2. Fallback strings ensure the Next.js compiler doesn't panic during 'npm run build'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hkbsaokjumjmvkwzweug.supabase.co";

// Prioritizes service role key, falls back to your anon key, falls back to placeholder to prevent crashing
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  "build_placeholder_key";

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      targetUserId, 
      amount, 
      adjustmentType, 
      recipientAccount,
      // New Node Properties Parameters
      accountLimit,
      loanBalance,
      nodeStatus 
    } = body;

    // 1. Double check that the target account exists first
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', targetUserId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User configuration node not found' }, { status: 404 });
    }

    // 2. CONDITION A: Handle Ledger Shift / Balance Injection (If amount is provided)
    if (amount !== undefined && adjustmentType) {
      const { error: txError } = await supabaseAdmin
        .from('transactions')
        .insert([{
          user_id: targetUserId,
          type: adjustmentType,
          amount: parseFloat(amount),
          recipient_account: recipientAccount || null,
          status: 'completed'
        }]);

      if (txError) return NextResponse.json({ error: `Ledger execution fault: ${txError.message}` }, { status: 500 });
    }

    // 3. CONDITION B: Handle Node Properties Update (If fields are passed from the second form)
    if (accountLimit !== undefined || loanBalance !== undefined || nodeStatus !== undefined) {
      const updatePayload: any = {};
      
      if (accountLimit !== undefined) updatePayload.account_limit = parseFloat(accountLimit);
      if (loanBalance !== undefined) updatePayload.loan_balance = parseFloat(loanBalance);
      if (nodeStatus !== undefined) updatePayload.node_status = nodeStatus;

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(updatePayload)
        .eq('id', targetUserId);

      if (profileError) return NextResponse.json({ error: `Node adjustment fault: ${profileError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "System pipeline modifications written successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}