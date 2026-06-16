"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { User, Phone, Hash, Wallet, ShieldAlert } from "lucide-react";

let supabaseInstance: any = null;
const getSupabase = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://hkbsaokjumjmvkwzweug.supabase.co";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

export default function AccountManager() {
  const [profile, setProfile] = useState<any>(null);
  const [calculatedBalance, setCalculatedBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchAccountAndLedgerDetails() {
      const supabase = getSupabase();
      try {
        setLoading(true);
        
        // 1. Get current authenticated user session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setErrorMessage("Authentication session missing. Please log in.");
          return;
        }

        // 2. Fetch the profile details (Name, Phone, Acc Number)
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          setErrorMessage(`Profile Database Error: ${profileError.message}`);
          return;
        }
        setProfile(profileData);

        // 3. Fetch all completed admin transactions for this specific user
        const { data: txData, error: txError } = await supabase
          .from("transactions")
          .select("type, amount")
          .eq("user_id", user.id)
          .eq("status", "completed");

        if (txError) {
          setErrorMessage(`Ledger Database Error: ${txError.message}`);
          return;
        }

        // 4. Calculate the real-time balance based on ledger rules
        let dynamicTotal = 0;
        if (txData) {
          txData.forEach((tx: any) => {
            const txAmount = Number(tx.amount) || 0;
            
            // Deposits increase the balance, while withdrawals/transfers lower it
            if (tx.type?.toLowerCase() === "deposit") {
              dynamicTotal += txAmount;
            } else if (tx.type?.toLowerCase() === "withdrawal" || tx.type?.toLowerCase() === "transfer") {
              dynamicTotal -= txAmount;
            } else {
              // Fallback default catch-all in case you save adjustments under alternative names
              dynamicTotal += txAmount;
            }
          });
        }
        
        setCalculatedBalance(dynamicTotal);

      } catch (err: any) {
        setErrorMessage(`System Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountAndLedgerDetails();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 max-w-xl mx-auto mt-10 bg-red-950/20 border border-red-900/50 rounded-2xl flex items-start gap-3 text-red-400">
        <ShieldAlert className="shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-sm">System Halt</h4>
          <p className="text-xs font-mono bg-black/30 p-3 rounded-lg border border-red-900/30 text-red-300 mt-2">
            {errorMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Account Manager</h1>
        <p className="text-sm text-slate-400 mt-1">Manage and audit your structural credential parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Personal Details Fields */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-[#0d1b2a]/40 border border-slate-800 p-6 rounded-2xl space-y-5 backdrop-blur-sm">
            <h3 className="text-sm font-semibold text-white tracking-wide border-b border-slate-800 pb-3">
              Secure Ledger Ownership Identity
            </h3>

            {/* Field 1: Full Name */}
            <div className="flex items-center gap-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-800/60">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
                <User size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Account Legal Name</p>
                <p className="text-sm font-medium text-slate-200 mt-0.5">
                  {profile?.full_name || profile?.name || "No name registered"}
                </p>
              </div>
            </div>

            {/* Field 2: Phone Number */}
            <div className="flex items-center gap-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-800/60">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg">
                <Phone size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Verified Mobile Link</p>
                <p className="text-sm font-medium text-slate-200 mt-0.5">
                  {profile?.phone || profile?.phone_number || "No telephone linked"}
                </p>
              </div>
            </div>

            {/* Field 3: Account Number */}
            <div className="flex items-center gap-4 p-3.5 bg-slate-900/50 rounded-xl border border-slate-800/60">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Hash size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">System Assigned Account ID</p>
                <p className="text-sm font-mono font-semibold tracking-lg text-emerald-400 mt-0.5">
                  {profile?.account_number || "Awaiting calculation..."}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Dynamic Balance Vault Card */}
        <div className="space-y-4">
          <div className="bg-[#0d1b2a]/60 border border-slate-700/50 p-6 rounded-2xl relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Vault Asset Holding</span>
              <Wallet size={16} className="text-blue-400" />
            </div>

            <div className="mt-6">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                ${calculatedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase tracking-wide">Liquidity pool clearing active</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Security Access Clear:</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">L3 Level</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}