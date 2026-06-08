"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define what a transaction looks like
interface Transaction {
  id: string;
  created_at: string;
  type: string;
  recipient_account: string;
  amount: number;
  status: string;
}

export default function LogsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    async function fetchLogs() {
      // 1. Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // 2. Fetch only transactions belonging to this user
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id) // <--- Filter by matching account ID
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTransactions(data);
      }
      setLoading(false);
    }

    fetchLogs();
  }, []);

  return (
    <div className="bg-[#0b132b] text-white p-6 rounded-2xl border border-slate-800 shadow-xl w-full">
      <h2 className="text-xl font-bold mb-1">Transaction History Logs</h2>
      <p className="text-slate-400 text-sm mb-6">Real-time audit log of domestic and wire funds routing events.</p>
      
      {loading ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading secure ledger logs...</p>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-slate-500">No transactions recorded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#111a36] text-slate-400 text-xs uppercase font-semibold">
              <tr>
                <th className="p-3 rounded-l-lg">ID Reference</th>
                <th className="p-3">Type</th>
                <th className="p-3">Recipient/Target</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-lg">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 font-mono text-xs text-slate-500">...{tx.id.slice(-8)}</td>
                  <td className="p-3 font-medium text-slate-200">{tx.type}</td>
                  <td className="p-3 font-mono text-xs text-slate-400">{tx.recipient_account}</td>
                  <td className="p-3 font-semibold text-red-400">-${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="p-3">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}