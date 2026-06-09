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

  async function loadMasterLedger() {
    setLoading(true);
    const { data: usersData } = await supabase.from('profiles').select('user_id:id, email');
    if (usersData) setUserList(usersData as unknown as UserMap[]);

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (txData) {
      setAllTransactions(txData);
      if (targetUserId) {
        setFilteredTransactions(txData.filter(tx => tx.user_id === targetUserId));
      } else {
        setFilteredTransactions(txData);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) loadMasterLedger();
  }, [isAuthenticated]);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === "HexafoxAdmin2026!") {
      setIsAuthenticated(true);
    } else {
      setGatekeeperError('Invalid Administrative Authorization Credentials.');
    }
  };

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          amount: adjustmentAmount,
          adjustmentType,
          recipientAccount: adjustmentType === 'Online Deposit' ? 'ADMIN CREDIT INJECTION' : 'ADMIN DEBIT OVERRIDE',
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to complete adjustment.');

      setAdminMessage({ type: 'success', text: `Successfully applied adjustment to ${selectedEmail}` });
      setAdjustmentAmount('');
      await loadMasterLedger();
    } catch (error: any) {
      setAdminMessage({ type: 'error', text: `Adjustment failed: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfileOverrides = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      setAdminMessage({ type: 'error', text: 'Please select a user account first.' });
      return;
    }
    setAdminMessage({ type: 'success', text: `Saved properties for: ${selectedEmail}` });
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-md bg-[#0b132b] border border-red-900/40 p-8 rounded-2xl shadow-2xl space-y-6">
          <h1 className="text-xl font-bold text-center text-white">Executive Master Terminal</h1>
          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <input type="password" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)}
              className="w-full bg-[#111a36] border border-slate-700 rounded-xl p-3 text-center" placeholder="••••••••••••••••" />
            <button type="submit" className="w-full bg-red-600 py-3 rounded-xl font-bold uppercase text-xs">Verify Credentials</button>
          </form>
          {gatekeeperError && <p className="text-red-400 text-xs text-center">{gatekeeperError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950 text-white p-4 sm:p-6 space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center">
        <h2 className="text-xl font-black text-red-400 flex items-center gap-2"><ShieldCheck size={20} /> Mikes Finance Master Control</h2>
        <button onClick={() => setIsAuthenticated(false)} className="bg-slate-800 px-4 py-2 rounded-xl text-xs">Lock Terminal</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          {/* User Selector */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-sm mb-4">Registered Accounts</h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {userList.map((usr) => (
                <button key={usr.user_id} onClick={() => selectTargetUser(usr.user_id, usr.email)} 
                  className={`w-full text-left p-3 rounded-xl border ${targetUserId === usr.user_id ? 'bg-blue-600/20 border-blue-500' : 'bg-black/30 border-slate-800'}`}>
                  {usr.email}
                </button>
              ))}
            </div>
          </div>
          
          {/* Adjustment Form */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800">
            <form onSubmit={handleBalanceAdjustment} className="space-y-4">
              <input type="number" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs" placeholder="Amount ($)" />
              <button type="submit" disabled={actionLoading} className="w-full bg-emerald-600 py-3 rounded-xl font-bold text-xs uppercase">Execute Shift</button>
            </form>
          </div>
        </div>

        {/* Ledger */}
        <div className="lg:col-span-8 bg-[#0b132b] p-6 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold">{selectedEmail ? `Ledger: ${selectedEmail}` : "Global Ledger Stream"}</h3>
            {targetUserId && <button onClick={clearUserFilter} className="bg-slate-800 px-3 py-1 rounded-lg text-xs">Reset</button>}
          </div>
          <table className="w-full text-left text-xs">
            <thead><tr className="text-slate-400"><th className="p-3">User</th><th className="p-3">Type</th><th className="p-3">Delta</th></tr></thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-t border-slate-800">
                  <td className="p-3">{getEmailFromId(tx.user_id)}</td>
                  <td className="p-3">{tx.type}</td>
                  <td className={`p-3 font-bold ${tx.type === 'Online Deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'Online Deposit' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}