import { supabaseAdmin } from '../../../lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 Incoming Admin Operation Payload:", body);

    const { 
      targetUserId, 
      amount, 
      adjustmentType, 
      recipientAccount,
      accountLimit, 
      loanBalance, 
      nodeStatus 
    } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target User ID string is required.' }, { status: 400 });
    }

    // This object accumulates all column mutations for a single database write call
    const profileUpdates: Record<string, any> = {};

    // ==========================================
    // 1. STAGE PROFILE NODE PROPERTY UPDATES
    // ==========================================
    if (accountLimit !== undefined && accountLimit !== null) {
      const cleanLimit = typeof accountLimit === 'string' ? parseFloat(accountLimit.replace(/,/g, '')) : accountLimit;
      profileUpdates.account_limit = isNaN(cleanLimit) ? 2000000.00 : cleanLimit;
    }

    if (loanBalance !== undefined && loanBalance !== null) {
      const cleanLoan = typeof loanBalance === 'string' ? parseFloat(loanBalance.replace(/,/g, '')) : loanBalance;
      profileUpdates.loan_balance = isNaN(cleanLoan) ? 0.00 : cleanLoan;
    }

    if (nodeStatus !== undefined && nodeStatus !== null) {
      profileUpdates.node_status = nodeStatus;
    }

    // ==========================================
    // 2. STAGE LEDGER BALANCE CALCULATION
    // ==========================================
    let shouldInsertTransactionLog = false;

    if (amount !== undefined && amount !== null && adjustmentType) {
      const parsedAmount = parseFloat(String(amount).replace(/,/g, ''));
      
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        // Fetch current active ledger standing via RLS-bypassing admin instance
        const { data: currentProfile, error: profileFetchError } = await supabaseAdmin
          .from('profiles')
          .select('balance')
          .eq('id', targetUserId)
          .single();

        if (profileFetchError || !currentProfile) {
          console.error("❌ Profile retrieval lookup error:", profileFetchError);
          return NextResponse.json({ error: 'Target user profile record could not be resolved.' }, { status: 404 });
        }

        const standardBalance = Number(currentProfile.balance || 0);
        const typeLower = adjustmentType.toLowerCase();

        const isAdditionOperation = 
          typeLower.includes('deposit') || 
          typeLower.includes('inject') || 
          typeLower.includes('add') || 
          typeLower.includes('credit');

        const updatedFinalBalance = isAdditionOperation 
          ? standardBalance + parsedAmount 
          : standardBalance - parsedAmount;

        // Stage calculated value to update queue
        profileUpdates.balance = updatedFinalBalance;
        shouldInsertTransactionLog = true;

        console.log(`⚙️ Math Check: ${standardBalance} ${isAdditionOperation ? '+' : '-'} ${parsedAmount} = ${updatedFinalBalance}`);
      }
    }

    // ==========================================
    // 3. EXECUTE COMBINED ATOMIC WRITE 
    // ==========================================
    if (Object.keys(profileUpdates).length > 0) {
      console.log("💾 Committing updates to profiles table row:", profileUpdates);
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', targetUserId);

      if (profileUpdateError) {
        console.error("❌ Supabase Profile Commit Error:", profileUpdateError);
        return NextResponse.json({ error: profileUpdateError.message }, { status: 500 });
      }
    }

    // ==========================================
    // 4. WRITE HISTORICAL TRANSACTION AUDIT LOG
    // ==========================================
    if (shouldInsertTransactionLog) {
      const finalParsedAmount = parseFloat(String(amount).replace(/,/g, ''));
      console.log("📝 Writing entry log into transactions table...");
      const { error: transactionLogError } = await supabaseAdmin
        .from('transactions')
        .insert([{
          user_id: targetUserId,
          type: adjustmentType,
          amount: finalParsedAmount,
          recipient_account: recipientAccount || 'ADMIN CORE ADJUSTMENT',
          status: 'Completed',
          created_at: new Date().toISOString()
        }]);

      if (transactionLogError) {
        console.error("❌ Non-fatal Transaction Logging Warning:", transactionLogError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Ledger mutations synchronized completely across dependencies.' 
    });

  } catch (globalCatchError: any) {
    console.error("❌ Global override route failure:", globalCatchError);
    return NextResponse.json({ error: globalCatchError.message }, { status: 500 });
  }
}