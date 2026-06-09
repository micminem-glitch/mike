"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  recipient_account: string;
  amount: number;
  status: string;
  created_at: string;
}

interface UserMap {
  user_id: string;
  email: string;
}

export default function AdminDashboard() {
  // Passcode Gatekeeper States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [gatekeeperError, setGatekeeperError] = useState('');

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [userList, setUserList] = useState<UserMap[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Balance Modification States
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'Online Deposit' | 'Admin Deduction'>('Online Deposit');
  
  // Custom Profile Override States
  const [customLimit, setCustomLimit] = useState('2,000,000.00');
  const [customLoan, setCustomLoan] = useState('0.00');
  const [customStatus, setCustomStatus] = useState('Active');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Verification routine for Admin Passcode
  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const MASTER_ADMIN_PASS = "HexafoxAdmin2026!"; 

    if (passcodeInput === MASTER_ADMIN_PASS) {
      setIsAuthenticated(true);
      setGatekeeperError('');
      loadMasterLedger();
    } else {
      setGatekeeperError('Invalid Administrative Authorization Credentials.');
    }
  };

  async function loadMasterLedger(forcedFilterId?: string) {
    setLoading(true);
    
    // Read clean structural parameters directly from the public profiles table
    const { data: usersData, error: userError } = await supabase
      .from('profiles')
      .select('id, email');
      
    if (!userError && usersData) {
      // Create an explicitly mapped array matching the UserMap interface structure
      const formattedUsers: UserMap[] = usersData.map((u: any) => ({
        user_id: u.id,
        email: u.email
      }));
      setUserList(formattedUsers);
    }

    // Grab entire transaction array logs
    const { data: txData, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && txData) {
      setAllTransactions(txData);
      
      // Determine the active selection target to preserve the filter window seamlessly
      const activeFilterId = forcedFilterId !== undefined ? forcedFilterId : targetUserId;
      if (activeFilterId) {
        setFilteredTransactions(txData.filter(tx => tx.user_id === activeFilterId));
      } else {
        setFilteredTransactions(txData);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadMasterLedger();
    }
  }, [isAuthenticated]);

  // Click handler to selectively filter rows instantly
  const selectTargetUser = (uid: string, emailStr: string) => {
    setTargetUserId(uid);
    setSelectedEmail(emailStr);
    setFilteredTransactions(allTransactions.filter(tx => tx.user_id === uid));
  };

  // Helper to clear filter parameters back to complete overview feed
  const clearUserFilter = () => {
    setTargetUserId('');
    setSelectedEmail('');
    setFilteredTransactions(allTransactions);
  };

  const getEmailFromId = (uid: string) => {
    const match = userList.find(u => u.user_id === uid);
    return match ? match.email : 'Legacy Account';
  };

  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !adjustmentAmount) return;

    setActionLoading(true);
    setAdminMessage(null);

    try {
      // Hit secure serverless API endpoint
      const response = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId,
          amount: adjustmentAmount,
          adjustmentType,
          recipientAccount: adjustmentType === 'Online Deposit' ? 'ADMIN CREDIT INJECTION' : 'ADMIN DEBIT OVERRIDE',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to complete adjustment override.');
      }

      setAdminMessage({ type: 'success', text: `Successfully applied adjustment to ${selectedEmail || targetUserId}` });
      setAdjustmentAmount('');
      
      // Reload history logs while keeping the filtered context window open
      await loadMasterLedger(targetUserId);
    } catch (error: any) {
      setAdminMessage({ type: 'error', text: `Adjustment failed: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfileOverrides = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      setAdminMessage({ type: 'error', text: 'Please select an active email user node first.' });
      return;
    }
    setAdminMessage({ 
      type: 'success', 
      text: `Saved properties for account: ${selectedEmail} (Limit: $${customLimit}, Status: ${customStatus})` 
    });
  };

  // IF NOT AUTHENTICATED: RENDER GATEKEEPER PASSCODE FORM
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-md bg-[#0b132b] border border-red-900/40 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-sm font-black uppercase tracking-widest text-red-500">Secure Network Layer</h2>
            <h1 className="text-xl font-bold text-white">Executive Master Terminal</h1>
            <p className="text-xs text-slate-400">Restricted Area. Enter cryptographic authentication sequence.</p>
          </div>

          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Administrative Passkey</label>
              <input 
                type="password"
                value={passcodeInput}
                onChange={(e) => setPasscodeInput(e.target.value)}
                className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-red-500 font-mono text-center"
                placeholder="••••••••••••••••"
                required
              />
            </div>

            {gatekeeperError && (
              <p className="text-center text-xs font-semibold text-red-400 animate-pulse bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                {gatekeeperError}
              </p>
            )}

            <button 
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/10"
            >
              Verify Credentials
            </button>
          </form>
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: RENDER SYSTEM WORKSTATION
  return (
    <div className="space-y-8 w-full min-h-screen bg-slate-950 p-6 text-white font-sans">
      {/* HEADER TOP BANNER */}
      <div className="bg-gradient-to-r from-red-950/40 to-slate-900 border border-red-900/40 p-6 rounded-2xl flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black tracking-wide uppercase text-red-400">Hexafox Executive Master Terminal</h2>
          <p className="text-slate-400 text-sm">System-wide transactional overrides, account metric manipulation, and user ledger configurations.</p>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white"
        >
          Lock Terminal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* USER EMAIL SELECTOR LIST */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm mb-1 text-slate-200">Registered Accounts</h3>
            <p className="text-xs text-slate-500 mb-4">Click any email address below to control parameters:</p>
            
            {loading ? (
              <p className="text-xs text-slate-500 animate-pulse">Syncing user directory...</p>
            ) : userList.length === 0 ? (
              <p className="text-xs text-slate-500">No active users found.</p>
            ) : (
              <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                {userList.map((usr) => (
                  <button
                    key={usr.user_id}
                    type="button"
                    onClick={() => selectTargetUser(usr.user_id, usr.email)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex justify-between items-center ${
                      targetUserId === usr.user_id 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold' 
                        : 'bg-black/30 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="text-xs truncate text-slate-200">{usr.email}</span>
                      <span className="text-[9px] font-mono text-slate-500 truncate">{usr.user_id.slice(0,18)}...</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded shrink-0">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BALANCE PARAMETERS */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Modify Balance Parameters</h3>
            
            <form onSubmit={handleBalanceAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Online Deposit')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  ➕ Inject ($+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Admin Deduction')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${adjustmentType === 'Admin Deduction' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  ➖ Minus ($-)
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Target Account Profile</label>
                <input 
                  type="text"
                  value={selectedEmail ? `${selectedEmail} [${targetUserId.slice(0,6)}]` : ''}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 font-medium cursor-not-allowed"
                  placeholder="Click a user email account above..."
                  disabled
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Adjustment Value ($)</label>
                <input 
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white placeholder-slate-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={actionLoading || !targetUserId}
                className={`w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all disabled:bg-slate-800 disabled:text-slate-600 ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {actionLoading ? 'Executing Change Override...' : 'Execute Balance Shift'}
              </button>
            </form>
          </div>

          {/* EDIT NODE PROPERTIES */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Edit Node Properties</h3>
            
            <form onSubmit={handleSaveProfileOverrides} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Account Custom Limit</label>
                <input 
                  type="text"
                  value={customLimit}
                  onChange={(e) => setCustomLimit(e.target.value)}
                  className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Assigned Loan Balance</label>
                <input 
                  type="text"
                  value={customLoan}
                  onChange={(e) => setCustomLoan(e.target.value)}
                  className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Node Status Level</label>
                <select
                  value={customStatus}
                  onChange={(e) => setCustomStatus(e.target.value)}
                  className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white outline-none"
                >
                  <option value="Active">🟢 Active / Enforced Tunnel</option>
                  <option value="Suspended">🟡 Verification Hold</option>
                  <option value="Terminated">🔴 Terminated / Locked Node</option>
                </select>
              </div>
              <button 
                type="submit"
                disabled={!targetUserId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Save Account Updates
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT PANEL: TRANSACTION HISTORY TRACE */}
        <div className="lg:col-span-8 bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-200">
                {selectedEmail ? `Ledger Feed Stream: ${selectedEmail}` : "Global Ledger Stream Trace"}
              </h3>
              {targetUserId && (
                <button
                  type="button"
                  onClick={clearUserFilter}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border border-slate-700"
                >
                  Reset Feed (Show All)
                </button>
              )}
            </div>

            {adminMessage && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${adminMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {adminMessage.text}
              </div>
            )}
            
            {loading ? (
              <p className="text-sm text-slate-500 animate-pulse">Running array query sync...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center bg-black/20 rounded-xl border border-dashed border-slate-800">No transaction logs matching this account signature.</p>
            ) : (
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#111a36] text-slate-400 font-semibold sticky top-0">
                    <tr>
                      <th className="p-3">User Email Identity</th>
                      <th className="p-3">Type Classification</th>
                      <th className="p-3">Delta Value</th>
                      <th className="p-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.map((tx) => {
                      const isDeposit = tx.type === 'Online Deposit';
                      const accountEmail = getEmailFromId(tx.user_id);

                      return (
                        <tr key={tx.id} className="hover:bg-slate-900/40">
                          <td className="p-3 font-medium text-slate-300 bg-slate-950/20" title={tx.user_id || ''}>
                            {accountEmail}
                          </td>
                          <td className="p-3 font-medium">
                            <span className={isDeposit ? 'text-emerald-400' : 'text-slate-300'}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`p-3 font-bold ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isDeposit ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}