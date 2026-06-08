"use client";

import React, { useState } from 'react';
import { supabase } from '../lib/supabase'; // This connects to your database file

export default function TransferPage() {
  // These variables keep track of what the user is typing
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount) {
      setMessage({ type: 'error', text: 'Please fill in all fields.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    // 1. Get the currently logged-in user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage({ type: 'error', text: 'Authentication session expired. Please log in again.' });
      setLoading(false);
      return;
    }

    // 2. Insert the transaction tagged explicitly with this user's ID
    const { error } = await supabase
      .from('transactions')
      .insert([
        { 
          recipient_account: recipient, 
          amount: parseFloat(amount),
          type: 'Domestic Transfer',
          status: 'Settled',
          user_id: user.id // <--- This matches the transaction to this exact account
        }
      ]);

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: `Transfer failed: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: `Successfully routed $${amount} to account ${recipient}!` });
      setRecipient('');
      setAmount('');
    }
  };

  return (
    <div className="bg-[#0b132b] text-white p-6 rounded-2xl border border-slate-800 shadow-xl max-w-2xl w-full">
      <h2 className="text-xl font-bold mb-2">Domestic Transfer Router</h2>
      <p className="text-slate-400 text-sm mb-6">Send funds instantly to domestic target endpoints.</p>
      
      {/* Show success or error messages here */}
      {message && (
        <div className={`p-4 rounded-xl text-sm mb-4 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleTransfer} className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Recipient Account Number</label>
          <input 
            type="text" 
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)} // Updates the recipient variable when you type
            className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-blue-500 text-white placeholder-slate-500" 
            placeholder="e.g. 1234567890" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount ($)</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)} // Updates the amount variable when you type
            className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-blue-500 text-white placeholder-slate-500" 
            placeholder="0.00" 
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-blue-600/10"
        >
          {loading ? "Routing Transaction..." : "Initiate Transfer"}
        </button>
      </form>
    </div>
  );
}