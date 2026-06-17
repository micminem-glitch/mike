import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { transactionId, otpInput } = await request.json();

    if (!transactionId || !otpInput) {
      return NextResponse.json({ error: "Missing transaction ID or OTP." }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Fetch the transaction record to get the amount, user_id, and expected OTP
    const { data: tx, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !tx) {
      return NextResponse.json({ error: "Transaction routing log not found." }, { status: 404 });
    }

    // 2. Validate the user submitted OTP against the database record
    if (tx.generated_otp !== otpInput) {
      return NextResponse.json({ error: "Invalid Authorization Code. Verification failed." }, { status: 400 });
    }

    // 3. Fetch the target user's current profile balance
    // (Assuming your column name is 'balance' inside your 'profiles' table)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('balance')
      .eq('id', tx.user_id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Failed to resolve user balance nodes." }, { status: 404 });
    }

    const currentBalance = Number(profile.balance || 0);
    const transferAmount = Number(tx.amount || 0);
    
    // Calculate the deduction
    const updatedBalance = currentBalance - transferAmount;

    // 4. Update the user's master profile balance ledger
    const { error: balanceError } = await supabaseAdmin
      .from('profiles')
      .update({ balance: updatedBalance })
      .eq('id', tx.user_id);

    if (balanceError) {
      throw new Error(`Balance adjustment settlement rejected: ${balanceError.message}`);
    }

    // 5. Finalize transaction status state to 'Completed' and wipe the spent OTP token
    const { error: updateTxError } = await supabaseAdmin
      .from('transactions')
      .update({ 
        status: 'Completed', 
        generated_otp: null 
      })
      .eq('id', transactionId);

    if (updateTxError) throw updateTxError;

    return NextResponse.json({ 
      success: true, 
      message: "Transfer settled successfully. Account balance deducted." 
    });

  } catch (error: any) {
    console.error("OTP Settlement Failure:", error);
    return NextResponse.json({ error: error.message || "Internal system fault during settlement." }, { status: 500 });
  }
}