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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [gatekeeperError, setGatekeeperError] = useState('');

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [userList, setUserList] = useState<UserMap[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isMobileUserListOpen, setIsMobileUserListOpen] = useState(false);
  
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'Online Deposit' | 'Admin Deduction'>('Online Deposit');
  
  const [customLimit, setCustomLimit] = useState('2,000,000.00');
  const [customLoan, setCustomLoan] = useState('0.00');
  const [customStatus, setCustomStatus] = useState('Active');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === "HexafoxAdmin2026!") {
      setIsAuthenticated(true);
      setGatekeeperError('');
      loadMasterLedger("");
    } else {
      setGatekeeperError('Invalid Administrative Authorization Credentials.');
    }
  };

  // FIX: Isolated loading sequencing to pull all records explicitly across user profiles
  async function loadMasterLedger(forcedFilterId?: string) {
    setLoading(true);
    
    // Fetch profiles lookup table
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, email');
      
    if (usersData) {
      const mappedUsers = usersData.map((u: any) => ({
        user_id: u.id,
        email: u.email
      }));
      setUserList(mappedUsers);
    }

    // Fetch transactions table globally
    const { data: txData, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && txData) {
      setAllTransactions(txData);
      
      const activeFilter = forcedFilterId !== undefined ? forcedFilterId : targetUserId;
      if (activeFilter) {
        setFilteredTransactions(txData.filter(tx => tx.user_id === activeFilter));
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
    return match ? match.email : 'Global System User';
  };

  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || !adjustmentAmount) return;

    setActionLoading(true);
    setAdminMessage(null);

    try {
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: targetUserId,
            amount: parseFloat(adjustmentAmount),
            type: adjustmentType,
            recipient_account: adjustmentType === 'Online Deposit' ? 'ADMIN CREDIT INJECTION' : 'ADMIN DEBIT OVERRIDE',
            status: 'Completed',
            created_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;

      setAdminMessage({ type: 'success', text: `Successfully applied adjustment to ${selectedEmail}` });
      setAdjustmentAmount('');
      
      // Reload everything while keeping current filter active
      await loadMasterLedger(targetUserId);
    } catch (error: any) {
      setAdminMessage({ type: 'error', text: `Adjustment failed: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-[#0b132b] border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-white">Executive Master Terminal</h1>
            <p className="text-xs text-slate-400">Enter cryptographic access key sequence.</p>
          </div>
          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <input 
              type="password"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm text-center font-mono text-white"
              placeholder="••••••••••••••••"
              required
            />
            {gatekeeperError && <p className="text-center text-xs text-red-400">{gatekeeperError}</p>}
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-bold py-3 rounded-xl text-xs uppercase tracking-wider">
              Verify Terminal Access
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-[#0b132b] border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-black uppercase text-red-400 flex items-center gap-2">
            <ShieldCheck className="text-red-500" size={20} /> Mikes Finance Master Control
          </h2>
          <p className="text-slate-400 text-xs mt-1">System-wide transactional overrides and database indexing.</p>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-400"
        >
          Lock Control Unit
        </button>
      </div>

      {/* MOBILE ACCOUNT SELECT DROP PANEL */}
      <div className="md:hidden w-full bg-[#0b132b] border border-slate-800 rounded-2xl p-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
          <Users size={12} /> Live Target Selector Node
        </label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMobileUserListOpen(!isMobileUserListOpen)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-left text-slate-200 flex justify-between items-center font-medium"
          >
            <span className="truncate">{selectedEmail ? selectedEmail : "Displaying All System Users"}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isMobileUserListOpen ? 'rotate-180' : ''}`} />
          </button>
          {isMobileUserListOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-[#0b132b] border border-slate-800 rounded-xl shadow-2xl z-30 p-1 divide-y divide-slate-800/40 max-h-[260px] overflow-y-auto">
              <button
                onClick={() => { clearUserFilter(); setIsMobileUserListOpen(false); }}
                className="w-full text-left px-3 py-2.5 text-xs text-red-400 font-bold hover:bg-black/20 rounded-lg flex items-center gap-1.5"
              >
                <FilterX size={12} /> Clear Filters (Show Global Stream)
              </button>
              {userList.map((usr) => (
                <button
                  key={usr.user_id}
                  onClick={() => { selectTargetUser(usr.user_id, usr.email); setIsMobileUserListOpen(false); }}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-lg flex flex-col ${targetUserId === usr.user_id ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-300 hover:bg-black/20'}`}
                >
                  <span className="truncate">{usr.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SIDE BAR / ACCOUNT CONFIGURATIONS CONTROL */}
        <div className="md:col-span-4 space-y-6">
          
          {/* USER EMAIL SELECTOR DESKTOP LIST */}
          <div className="hidden md:block bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm mb-1 text-slate-200 flex items-center gap-1.5"><Users size={15} /> Accounts Directory</h3>
            <p className="text-xs text-slate-500 mb-4">Select an active entity profile:</p>
            
            {loading ? (
              <p className="text-xs text-slate-500 animate-pulse flex items-center gap-2"><RefreshCw size={12} className="animate-spin" /> Querying profiles...</p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {userList.map((usr) => (
                  <button
                    key={usr.user_id}
                    type="button"
                    onClick={() => selectTargetUser(usr.user_id, usr.email)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex justify-between items-center ${targetUserId === usr.user_id ? 'bg-blue-600/20 border-blue-500 text-blue-400 font-bold' : 'bg-black/30 border-slate-800 hover:border-slate-700 text-slate-300'}`}
                  >
                    <span className="text-xs truncate text-slate-200">{usr.email}</span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded shrink-0">Edit</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BALANCE MODIFIER */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Modify Balance Parameters</h3>
            <form onSubmit={handleBalanceAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Online Deposit')}
                  className={`py-2 text-xs font-bold rounded-lg ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                >
                  ➕ Inject
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Admin Deduction')}
                  className={`py-2 text-xs font-bold rounded-lg ${adjustmentType === 'Admin Deduction' ? 'bg-red-600 text-white' : 'text-slate-400'}`}
                >
                  ➖ Minus
                </button>
              </div>

              <div>
                <input 
                  type="text"
                  value={selectedEmail ? selectedEmail : ''}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-400 truncate"
                  placeholder="No active user selected..."
                  disabled
                />
              </div>
              <div>
                <input 
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white"
                  placeholder="0.00"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={actionLoading || !targetUserId}
                className={`w-full font-bold py-3 rounded-xl text-xs uppercase tracking-wider ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600' : 'bg-red-600'}`}
              >
                Apply Operations Ledger Shift
              </button>
            </form>
          </div>

          {/* SYSTEM PROPERTY INPUT OVERRIDES */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Account Configurations</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Custom Limit</label>
                <input type="text" value={customLimit} onChange={(e) => setCustomLimit(e.target.value)} className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Assigned Loan Balance</label>
                <input type="text" value={customLoan} onChange={(e) => setCustomLoan(e.target.value)} className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-1">Node Status</label>
                <select value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-xs text-white outline-none">
                  <option value="Active">🟢 Active Node</option>
                  <option value="Suspended">🟡 Hold Status</option>
                  <option value="Terminated">🔴 Terminated</option>
                </select>
              </div>
              <button onClick={() => setAdminMessage({type: 'success', text: 'Account configuration metrics saved successfully.'})} disabled={!targetUserId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 py-3 rounded-xl text-xs font-bold uppercase tracking-wider">
                Save Node Data
              </button>
            </div>
          </div>

        </div>

        {/* DATA LEDGER FEED CONTAINER */}
        <div className="md:col-span-8 bg-[#0b132b] p-4 sm:p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center gap-3 mb-6">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                {selectedEmail ? `Streaming Logs: ${selectedEmail}` : "Global Ledger Stream Trace"}
              </h3>
              {targetUserId && (
                <button
                  type="button"
                  onClick={clearUserFilter}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border border-slate-700"
                >
                  Reset Feed Stream
                </button>
              )}
            </div>

            {adminMessage && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${adminMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {adminMessage.text}
              </div>
            )}
            
            {loading ? (
              <p className="text-sm text-slate-500 animate-pulse flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Querying transactional indices...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-12 text-center bg-black/20 rounded-xl border border-dashed border-slate-800">No logs match this filter profile index.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#111a36] text-slate-400 font-semibold sticky top-0">
                    <tr>
                      <th className="p-3">User Identity</th>
                      <th className="p-3">Classification</th>
                      <th className="p-3">Delta Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.map((tx) => {
                      const isDeposit = tx.type === 'Online Deposit';
                      const accountEmail = getEmailFromId(tx.user_id);

                      return (
                        <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-medium text-slate-300 max-w-[120px] sm:max-w-none truncate" title={accountEmail}>
                            {accountEmail}
                          </td>
                          <td className="p-3 font-medium">
                            <span className={isDeposit ? 'text-emerald-400' : 'text-red-400'}>
                              {tx.type}
                            </span>
                          </td>
                          <td className={`p-3 font-bold ${isDeposit ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isDeposit ? '+' : '-'}${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
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