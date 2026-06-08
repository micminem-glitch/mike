import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// This server-only key completely bypasses RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; 

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});