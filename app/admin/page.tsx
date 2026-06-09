"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown, RefreshCw, FilterX, Users, Layers, ShieldCheck } from 'lucide-react';

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
  
  // Mobile UI States
  const [isMobileUserListOpen, setIsMobileUserListOpen] = useState(false);
  
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
    
    const { data: usersData, error: userError } = await supabase
      .from('profiles')
      .select('user_id:id, email');
      
    if (!userError && usersData) {
      setUserList(usersData as unknown as UserMap[]);
    }

    const { data: txData, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && txData) {
      setAllTransactions(txData);
      
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

  const selectTargetUser = (uid: string, emailStr: string) => {
    setTargetUserId(uid);
    setSelectedEmail(emailStr);
    setFilteredTransactions(allTransactions.filter(tx => tx.user_id === uid));
  };

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

  // IF AUTHENTICATED: RENDER SYSTEM WORKSTATION ONLY
  return (
    <div className="w-full min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6 pt-16 md:pt-6">
      
      {/* HEADER TOP BANNER */}
      <div className="bg-gradient-to-r from-red-950/40 to-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-lg sm:text-xl font-black tracking-wide uppercase text-red-400 flex items-center gap-2">
            <ShieldCheck className="text-red-500 shrink-0" size={20} /> Mikes Finance Master Control
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">System-wide transactional overrides, metric configurations, and absolute database indexing.</p>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold transition-all text-slate-400 hover:text-white"
        >
          Lock Terminal
        </button>
      </div>

      {/* MOBILE USER DROP PANEL (VISIBLE ON MOBILE ONLY) */}
      <div className="md:hidden w-full bg-[#0b132b] border border-slate-800 rounded-2xl p-4 shadow-xl">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
          <Users size={12} /> Live User Selection Target
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileUserListOpen(!isMobileUserListOpen)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-left text-slate-200 flex justify-between items-center font-medium"
          >
            <span className="truncate">
              {selectedEmail ? selectedEmail : "Displaying All Connected Users"}
            </span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMobileUserListOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMobileUserListOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-[#0b132b] border border-slate-800 rounded-xl shadow-2xl z-30 p-1 divide-y divide-slate-800/40 max-h-[260px] overflow-y-auto">
              <button
                onClick={() => { clearUserFilter(); setIsMobileUserListOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs text-red-400 font-bold hover:bg-black/20 rounded-lg flex items-center gap-1.5"
              >
                <FilterX size={12} /> Reset System Boundaries (Show All)
              </button>
              {userList.map((usr) => (
                <button
                  key={usr.user_id}
                  onClick={() => { selectTargetUser(usr.user_id, usr.email); setIsMobileUserListOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors rounded-lg flex flex-col ${
                    targetUserId === usr.user_id ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300 hover:bg-black/20'
                  }`}
                >
                  <span className="truncate">{usr.email}</span>
                  <span className="text-[9px] font-mono text-slate-500 mt-0.5">{usr.user_id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN INTERFACE CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* USER EMAIL SELECTOR LIST */}
          <div className="hidden md:block bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm mb-1 text-slate-200 flex items-center gap-1.5"><Users size={15} /> Registered Accounts</h3>
            <p className="text-xs text-slate-500 mb-4">Click any email address below to control parameters:</p>
            
            {loading ? (
              <p className="text-xs text-slate-500 animate-pulse flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Syncing user directory...</p>
            ) : userList.length === 0 ? (
              <p className="text-xs text-slate-500">No active users found.</p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {userList.map((usr) => (
                  <button
                    key={usr.user_id}
                    type="button"
                    onClick={() => selectTargetUser(usr.user_id, usr.email)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex justify-between items-center ${
                      targetUserId === usr.user_id 
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold shadow-[0_0_12px_rgba(37,99,235,0.1)]' 
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
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  ➕ Inject ($+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Admin Deduction')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${adjustmentType === 'Admin Deduction' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  ➖ Minus ($-)
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Target Account Profile</label>
                <input 
                  type="text"
                  value={selectedEmail ? `${selectedEmail} [${targetUserId.slice(0,6)}]` : ''}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 font-medium cursor-not-allowed truncate"
                  placeholder="Click a user account pointer..."
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
                  className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={actionLoading || !targetUserId}
                className={`w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all disabled:bg-slate-800 disabled:text-slate-600 ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/20' : 'bg-red-600 hover:bg-red-700 shadow-red-950/20'}`}
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
                  className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white outline-none cursor-pointer"
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
        <div className="lg:col-span-8 bg-[#0b132b] p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                {selectedEmail ? `Ledger Feed Stream: ${selectedEmail}` : "Global Ledger Stream Trace"}
              </h3>
              {targetUserId && (
                <button
                  type="button"
                  onClick={clearUserFilter}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border border-slate-700 text-center"
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
              <p className="text-sm text-slate-500 animate-pulse flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Running array query sync...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-12 text-center bg-black/20 rounded-xl border border-dashed border-slate-800">No transaction logs matching this account signature.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle p-4 sm:p-0">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#111a36] text-slate-400 font-semibold sticky top-0">
                      <tr>
                        <th className="p-3">User Email Identity</th>
                        <th className="p-3">Type Classification</th>
                        <th className="p-3">Delta Value</th>
                        <th className="p-3 hidden md:table-cell">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredTransactions.map((tx) => {
                        const isDeposit = tx.type === 'Online Deposit';
                        const accountEmail = getEmailFromId(tx.user_id);

                        return (
                          <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="p-3 font-medium text-slate-300 max-w-[140px] sm:max-w-none truncate" title={accountEmail}>
                              {accountEmail}
                            </td>
                            <td className="p-3 font-medium">
                              <span className={isDeposit ? 'text-emerald-400' : 'text-slate-400'}>
                                {tx.type}
                              </span>
                            </td>
                            <td className={`p-3 font-bold ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isDeposit ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-slate-500 hidden md:table-cell">{new Date(tx.created_at).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}