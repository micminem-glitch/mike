"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [balance, setBalance] = useState(0.00);
  const [recentTxAmount, setRecentTxAmount] = useState(0.00);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('Loading...');
  const router = useRouter();

  const accountMetrics = {
    pending: "0.00",
    myLoan: "0",
    accountLimit: "2,000,000.00",
    lastLoginIp: "94.59.104.73",
    lastLoginDate: "2026-06-08 08:25:11"
  };

  const chartData = [60, 40, 70, 50, 90, 30, 80];

  useEffect(() => {
    async function calculateRealBalance() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || 'Secure Vault Account');

      const { data, error } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id);

      if (!error && data) {
        let currentBalance = 0.00; 
        let lastAmount = 0.00;

        data.forEach((tx) => {
          const amt = Number(tx.amount);
          lastAmount = amt;
          
          if (tx.type === 'Online Deposit') {
            currentBalance += amt; 
          } else {
            currentBalance -= amt; 
          }
        });
        
        setBalance(currentBalance);
        if (data.length > 0) {
          setRecentTxAmount(lastAmount);
        }
      }
      setLoading(false);
    }

    calculateRealBalance();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    /* MASTER LAYOUT CONTAINER WRAPPER
       FIX: Changed padding layout properties so it fits beautifully underneath the layout navbar header.
    */
    <div className="w-full min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
        
        {/* LEFT COLUMN: HERO BALANCE CARD & DETAILS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* MAIN CARD */}
          <div className="bg-gradient-to-b from-blue-600 to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shrink-0">VX</div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm truncate" title={userEmail}>{userEmail}</h2>
                  <span className="text-xs text-blue-200 block">Active Asset Node</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/40 text-xs font-semibold transition-all shrink-0"
              >
                Disconnect
              </button>
            </div>

            <div className="my-6">
              <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Available Ledger Balance</p>
              <p className="text-4xl font-bold tracking-tight">
                {loading ? "$..." : `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 bg-black/10 p-3 rounded-xl border border-white/10">
              <div>
                <label className="text-xs text-blue-200 flex items-center gap-1">Pending ▾</label>
                <p className="text-lg font-semibold">${accountMetrics.pending}</p>
              </div>
              <div className="border-l border-white/10 pl-4">
                <label className="text-xs text-red-300">My Loan</label>
                <p className="text-lg font-semibold text-red-300">${accountMetrics.myLoan}</p>
              </div>
            </div>
          </div>

          {/* METRICS & STATUS */}
          <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-4 text-white">
            <div className="flex justify-center">
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                Enforced Encrypted Tunnel
              </span>
            </div>

            <div className="space-y-3 text-sm pt-2 text-slate-300">
              <div className="flex justify-between border-b border-dashed border-slate-800 pb-2 gap-2">
                <span className="text-slate-400">Account Limit Mapping</span>
                <span className="font-semibold text-white">${accountMetrics.accountLimit}</span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-800 pb-2 gap-2">
                <span className="text-slate-400">Delta Routing Target</span>
                <span className="font-semibold text-red-400">
                  {loading ? "$..." : `-$${recentTxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-dashed border-slate-800 pb-2 gap-2">
                <span className="text-slate-400">Last Secure IP Access</span>
                <span className="font-mono text-slate-400 font-semibold">{accountMetrics.lastLoginIp}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Handshake Timestamp</span>
                <span className="text-slate-400 font-medium whitespace-nowrap">{accountMetrics.lastLoginDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STATS CHART & SUMMARY */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* DAILY STATS CARD */}
          <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-sm text-white">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-lg">Daily Volatility Engine</h3>
                <p className="text-xs text-blue-400 font-medium mt-0.5">Telemetry log sequence processing active.</p>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-3 px-4 pt-4 border-b border-slate-800">
              {chartData.map((height, idx) => (
                <div key={idx} className="w-full flex flex-col items-center gap-2 group">
                  <div className="w-full bg-slate-700 rounded-t-md transition-all duration-300 group-hover:bg-blue-600" style={{ height: `${height}%` }} />
                  <span className="w-full h-1.5 bg-orange-500 rounded-full opacity-60"></span>
                </div>
              ))}
            </div>
          </div>

          {/* SUMMARY PILLS */}
          <div className="bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-sm text-white">
            <h3 className="font-bold text-lg mb-4">Allocation Summary</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-purple-400">🟣 Transaction Cap Margin</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[85%]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-teal-400">🟢 Collateral Threshold</span>
                  <span>$0</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-teal-500 h-full w-0"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-orange-400">🟠 Expense Burn Metric</span>
                  <span>40%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full w-[40%]"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}