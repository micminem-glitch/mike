"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [balance, setBalance] = useState(0.00);
  const [accountNumber, setAccountNumber] = useState('Loading...');
  const [fullName, setFullName] = useState('Loading...');
  const [recentTxAmount, setRecentTxAmount] = useState(0.00);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('Loading...');
  const [copied, setCopied] = useState(false);
  
  // Dynamic Node Configuration States
  const [accountLimit, setAccountLimit] = useState(2000000.00);
  const [loanBalance, setLoanBalance] = useState(0.00);
  const [nodeStatus, setNodeStatus] = useState('Active / Enforced Tunnel');

  // Retained static metadata tracking parameters
  const accountMetrics = {
    pending: "0.00",
    lastLoginIp: "192.168.1.1", 
    lastLoginDate: "2026-06-08 08:25:11"
  };

  const chartData = [60, 40, 70, 50, 90, 30, 80];
  const router = useRouter();

  // Helper function to resolve dynamic greeting based on client system time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Helper function to extract initials from full name dynamically
  const getInitials = (nameString: string) => {
    if (!nameString || nameString === 'Loading...') return 'HX';
    return nameString
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    let profileChannel: any;

    async function loadDashboardDetails() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email || 'Secure Vault Account');

      const hydrateProfileStates = (profileData: any) => {
        if (profileData.balance !== undefined) setBalance(Number(profileData.balance || 0));
        if (profileData.account_number) setAccountNumber(profileData.account_number || 'CH-0049281-X');
        if (profileData.full_name) setFullName(profileData.full_name || 'Valued Client');
        
        if (profileData.account_limit !== undefined && profileData.account_limit !== null) {
          setAccountLimit(Number(profileData.account_limit));
        }
        if (profileData.loan_balance !== undefined && profileData.loan_balance !== null) {
          setLoanBalance(Number(profileData.loan_balance));
        }
        if (profileData.node_status) {
          setNodeStatus(profileData.node_status);
        }
      };

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('balance, account_number, account_limit, loan_balance, node_status, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("CRITICAL: RLS Policy or Query Issue fetching profile data:", profileError);
        } else if (profile) {
          hydrateProfileStates(profile);
        }

        profileChannel = supabase
          .channel(`live-profile-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`
            },
            (payload) => {
              console.log("Realtime admin overwrite detected on ledger:", payload.new);
              hydrateProfileStates(payload.new);
            }
          )
          .subscribe();

        const { data: tx } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (tx && tx.length > 0) {
          setRecentTxAmount(Number(tx[0].amount));
        }
      } catch (err) {
        console.error("Dashboard metric resolution fault:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardDetails();

    return () => {
      if (profileChannel) {
        supabase.removeChannel(profileChannel);
      }
    };
  }, [router]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 p-4 sm:p-8 text-white font-sans antialiased">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOP BAR / WELCOME ROW */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0b132b] p-5 rounded-2xl border border-slate-900 gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold shadow-lg text-sm tracking-wider">
              {loading ? "..." : getInitials(fullName)}
            </div>
            <div className="space-y-1">
              {/* Added Time-based Dynamic Greeting block */}
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest leading-none">
                {getGreeting()}
              </p>
              
              <h2 className="font-bold text-xl leading-tight text-slate-50">
                {loading ? "Loading..." : fullName}
              </h2>
              
              {/* Account copy block */}
              <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-lg px-2.5 py-1 w-fit group/top-acc">
                <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Acc:</span>
                <span className="text-xs font-mono font-medium text-slate-200 tracking-wider">
                  {loading ? "Fetching ID..." : accountNumber}
                </span>
                <button
                  onClick={handleCopyAccount}
                  className="ml-1 text-[10px] font-bold text-blue-400 hover:text-emerald-400 border border-slate-800 bg-slate-900/80 px-2 py-0.5 rounded transition-all duration-150"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
            <button 
              onClick={handleLogout}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 hover:border-red-500/30 text-xs font-semibold tracking-wide transition-all duration-200"
            >
              Sign Out Securely
            </button>
            <div className="flex items-center gap-1.5 self-start sm:self-auto mr-1">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${nodeStatus.toLowerCase().includes('active') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">Secure Link Enforced</span>
            </div>
          </div>
        </div>

        {/* MAIN CORE DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: VISUAL BALANCE CARD & PARAMETERS */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* HERO ACCOUNT CARD */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 border border-slate-800/80 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Available Capital Account</p>
                  <p className="text-4xl font-extrabold tracking-tight mt-1 font-mono text-slate-50">
                    {loading ? "$..." : `$${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg font-bold uppercase">
                    Primary Ledger
                  </span>
                </div>
              </div>

              {/* INTEGRATED ACCOUNT NUMBER DISPLAY */}
              <div className="bg-slate-950/60 backdrop-blur-md p-3.5 rounded-xl border border-slate-800/60 flex justify-between items-center group/btn">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Routing Identifier</p>
                  <p className="text-sm font-mono text-slate-300 tracking-wider mt-0.5 font-semibold">
                    {loading ? "Fetching ID..." : accountNumber}
                  </p>
                </div>
                <button 
                  onClick={handleCopyAccount}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[11px] font-medium transition-all border border-slate-800 flex items-center gap-1.5"
                >
                  {copied ? (
                    <span className="text-emerald-400 font-bold">✓ Copied</span>
                  ) : (
                    <span>Copy</span>
                  )}
                </button>
              </div>

              {/* DYNAMIC FINANCING STATS ROW */}
              <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">Held Pending ▾</span>
                  <p className="text-base font-bold text-slate-200 mt-0.5">${accountMetrics.pending}</p>
                </div>
                <div className="border-l border-slate-800/80 pl-4">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active Financing Liabilities</span>
                  <p className="text-base font-bold text-red-400 mt-0.5">
                    ${loanBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* SECURE TECHNICAL TELEMETRY LOGS */}
            <div className="bg-[#0b132b] border border-slate-900 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{nodeStatus}</span>
                <span className={`w-2 h-2 rounded-full ${nodeStatus.toLowerCase().includes('active') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                  <span className="text-slate-400">Total Account Limit Threshold</span>
                  <span className="font-semibold text-slate-200">
                    ${accountLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                  <span className="text-slate-400">Delta Transfer Velocity Vector</span>
                  <span className="font-bold text-red-400">
                    {loading ? "$..." : `-$${recentTxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                  <span className="text-slate-400">Last Verified Ingress IP</span>
                  <span className="font-mono text-slate-300 font-semibold bg-slate-950 px-2 py-0.5 rounded border border-slate-900">{accountMetrics.lastLoginIp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Handshake Frame Timestamp</span>
                  <span className="text-slate-300 font-mono font-medium">{accountMetrics.lastLoginDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: REVENUE ENGINE VISUALIZATIONS & ALLOCATIONS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* VOLATILITY ENGINE BAR GRAPH TIMELINE */}
            <div className="bg-[#0b132b] border border-slate-900 rounded-2xl p-6 shadow-xl">
              <div className="mb-6">
                <h3 className="font-bold text-base tracking-wide">Daily Allocation Telemetry Engine</h3>
                <p className="text-xs text-blue-400 font-medium mt-0.5">Real-time cryptographic pipeline validation history active.</p>
              </div>
              
              <div className="h-44 flex items-end justify-between gap-2.5 px-2 pt-2 border-b border-slate-800/80">
                {chartData.map((height, idx) => (
                  <div key={idx} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                    <div className="w-full bg-slate-800 group-hover:bg-gradient-to-t group-hover:from-blue-600 group-hover:to-indigo-500 rounded-t-lg h-0 transition-all duration-500 shadow-md" style={{ height: `${height}%` }} />
                    <span className="w-full h-1 bg-slate-800 group-hover:bg-indigo-400 rounded-full transition-colors duration-200"></span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase font-mono tracking-widest mt-2 px-1">
                <span>Seq_01</span>
                <span>Seq_02</span>
                <span>Seq_03</span>
                <span>Seq_04</span>
                <span>Seq_05</span>
                <span>Seq_06</span>
                <span>Seq_07</span>
              </div>
            </div>

            {/* MARGIN PERFORMANCE METRIC ALLOCATION PILLS */}
            <div className="bg-[#0b132b] border border-slate-900 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-base tracking-wide mb-4">Pipeline Allocation Parameters</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-purple-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Transaction Cap Remaining
                    </span>
                    <span className="font-mono">85%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-900">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-teal-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> Collateral Validation Threshold
                    </span>
                    <span className="font-mono">$0.00</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-900">
                    <div className="bg-gradient-to-r from-teal-600 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: '0%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-orange-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span> Expense Operational Burn Metric
                    </span>
                    <span className="font-mono">40%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden p-0.5 border border-slate-900">
                    <div className="bg-gradient-to-r from-orange-600 to-orange-400 h-full rounded-full transition-all duration-500" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}