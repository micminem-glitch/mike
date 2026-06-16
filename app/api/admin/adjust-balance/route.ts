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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}