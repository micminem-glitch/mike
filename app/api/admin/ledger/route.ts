import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Guard clause to catch missing environment configurations on Vercel hosting
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "CRITICAL CONFIG ERROR: 'SUPABASE_SERVICE_ROLE_KEY' is missing from your production environment variables. Add it to your Vercel project settings." },
      { status: 500 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Fetch users from profiles table
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('id, email');

    if (usersError) throw usersError;

    // Normalize output format so both 'id' and 'user_id' exist simultaneously
    const normalizedUsers = users?.map((u: any) => ({
      id: u.id,
      user_id: u.id,
      email: u.email
    })) || [];

    // Fetch all transaction logs bypassing RLS constraints securely
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txError) throw txError;

    return NextResponse.json({ users: normalizedUsers, transactions });
  } catch (error: any) {
    console.error("Admin Ledger Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}