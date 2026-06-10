import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// 🚨 CRITICAL: We use the SERVICE_ROLE_KEY here to bypass RLS and get ALL data
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export const dynamic = 'force-dynamic'; // Prevents Next.js from aggressively caching this route

export async function GET() {
  try {
    // 1. Fetch all registered users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email');

    if (usersError) throw usersError;

    // 2. Fetch all transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    // 3. Send the master data back to the admin dashboard
    return NextResponse.json({ users, transactions });

  } catch (error: any) {
    console.error("Admin Ledger Fetch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}