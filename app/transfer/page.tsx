"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Define a structured layout for tracking active standby transfers
interface PendingTransfer {
  id: string;
  recipient_account: string;
  recipient_name: string;
  bank_name: string;
  amount: number;
  status: string;
}

export default function TransferPage() {
  // Form Field States
  const [recipient, setRecipient] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [amount, setAmount] = useState('');
  
  // Standby & Verification States
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [otpInputs, setOtpInputs] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch any transfers waiting for authorization when page loads
  useEffect(() => {
    fetchPendingTransfers();
  }, []);

  const fetchPendingTransfers = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'Waiting for OTP')
      .order('created_at', { ascending: false });

    if (data) setPendingTransfers(data);
  };

  // Phase 1: Route the Transfer into a Standby State
  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !recipientName || !bankName || !routingNumber || !amount) {
      setMessage({ type: 'error', text: 'Please complete all verification fields.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setMessage({ type: 'error', text: 'Authentication session expired.' });
      setLoading(false);
      return;
    }

    // Insert transaction explicitly tagged as 'Waiting for OTP'
    const { error } = await supabase
      .from('transactions')
      .insert([
        { 
          recipient_account: recipient, 
          recipient_name: recipientName,
          bank_name: bankName,
          routing_number: routingNumber,
          amount: parseFloat(amount),
          type: 'Domestic Transfer',
          status: 'Waiting for OTP', // Sets database status indicator
          user_id: user.id
        }
      ]);

    setLoading(false);

    if (error) {
      setMessage({ type: 'error', text: `Route initialization failed: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Transfer initialized. Please provide OTP authorization below.' });
      // Reset input fields
      setRecipient('');
      setRecipientName('');
      setBankName('');
      setRoutingNumber('');
      setAmount('');
      // Refresh standby view list
      fetchPendingTransfers();
    }
  };

  // Phase 2: Secure API Validation Handler
  const handleVerifyOtp = async (txId: string, e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otpInputs[txId];
    if (!enteredOtp) return;

    setLoading(true);
    setMessage(null);

    try {
      // Direct call to your backend authorization node route
      const response = await fetch('/api/transfer/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: txId,
          otpInput: enteredOtp
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification node rejected input.');
      }

      // SUCCESS: Set confirmation alert banner message
      setMessage({ 
        type: 'success', 
        text: 'Transaction Successful! Funds have been securely authorized and routed.' 
      });

      // Clear the specific row text input tracker field
      setOtpInputs(prev => { 
        const copy = { ...prev }; 
        delete copy[txId]; 
        return copy; 
      });

      // Reload array from database (Since it is now 'Completed', it drops out of the OTP list)
      await fetchPendingTransfers();

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (txId: string, value: string) => {
    setOtpInputs(prev => ({ ...prev, [txId]: value }));
  };

  return (
    <div className="space-y-8 max-w-4xl w-full text-white p-2">
      
      {/* Upper Grid Layout containing Core Form Entry */}
      <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold mb-2">Domestic Transfer Router</h2>
        <p className="text-slate-400 text-sm mb-6">Send funds instantly to domestic target endpoints securely.</p>
        
        {message && (
          <div className={`p-4 rounded-xl text-sm mb-4 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleInitiateTransfer} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Recipient Account Number</label>
              <input 
                type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-blue-500" 
                placeholder="e.g. 1234567890" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Recipient Full Name</label>
              <input 
                type="text" value={recipientName} onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-blue-500" 
                placeholder="John Doe" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Bank Name</label>
              <input 
                type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-blue-500" 
                placeholder="e.g. Chase Bank" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Routing Transit Number</label>
              <input 
                type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)}
                className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-blue-500" 
                placeholder="9-digit code" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount ($)</label>
            <input 
              type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-blue-500" 
              placeholder="0.00" 
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
          >
            {loading ? "Processing..." : "Initiate Transfer"}
          </button>
        </form>
      </div>

      {/* Persistent Inline Standby Container */}
      <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-800 shadow-xl">
        <h3 className="text-lg font-bold mb-1">Active Transfers Requiring Action</h3>
        <p className="text-slate-400 text-xs mb-4">Transactions held in verification standby queue awaiting secure tokens.</p>

        {pendingTransfers.length === 0 ? (
          <div className="text-center p-6 bg-[#111a36]/40 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
            No transfers are currently pending authentication.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTransfers.map((tx) => (
              <div key={tx.id} className="bg-[#111a36] border border-slate-700/60 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                
                {/* Left Side: Specific Row Data Details */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-100">${tx.amount.toLocaleString()}</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-medium">
                      {tx.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    To: <span className="text-slate-200 font-semibold">{tx.recipient_name}</span> ({tx.bank_name} - Acct: {tx.recipient_account})
                  </p>
                </div>

                {/* Right Side: Input Area Form */}
                <form onSubmit={(e) => handleVerifyOtp(tx.id, e)} className="flex items-center gap-2 min-w-[260px]">
                  <input 
                    type="text"
                    required
                    maxLength={6}
                    value={otpInputs[tx.id] || ''}
                    onChange={(e) => handleOtpChange(tx.id, e.target.value)}
                    className="bg-[#0b132b] border border-slate-700 rounded-lg p-2 text-sm text-center font-mono tracking-widest text-white placeholder-slate-600 focus:outline-amber-500 w-full"
                    placeholder="Enter 6-digit OTP" 
                  />
                  <button 
                    type="submit"
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {loading ? "Verifying..." : "Verify"}
                  </button>
                </form>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}