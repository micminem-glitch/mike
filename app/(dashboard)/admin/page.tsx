"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase'; 
import { 
  ChevronDown, 
  RefreshCw, 
  FilterX, 
  Users, 
  Layers, 
  ShieldCheck, 
  KeyRound, 
  MessageSquare, 
  Send, 
  MessageCircle,
  AlertTriangle
} from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  recipient_account: string;
  amount: number;
  status: string;
  generated_otp?: string; 
  created_at: string;
}

interface UserMap {
  user_id: string;
  email: string;
  account_limit?: number;
  loan_balance?: number;
  node_status?: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [gatekeeperError, setGatekeeperError] = useState('');

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [userList, setUserList] = useState<UserMap[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [targetUserId, setTargetUserId] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'Online Deposit' | 'Admin Deduction'>('Online Deposit');
  
  const [customLimit, setCustomLimit] = useState('2000000.00');
  const [customLoan, setCustomLoan] = useState('0.00');
  const [customStatus, setCustomStatus] = useState('Active / Enforced Tunnel');
  
  const [actionLoading, setActionLoading] = useState(false);
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Support Desk Subsystem States ---
  const [chatRoomId, setChatRoomId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const targetUserRef = useRef(targetUserId);
  useEffect(() => {
    targetUserRef.current = targetUserId;
  }, [targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const otpStandbyQueue = allTransactions.filter(tx => tx.status === 'Waiting for OTP');

  // Unified Chat Syncing & Live Capture Engine
  useEffect(() => {
    let messageChannel: any;
    let roomChannel: any;

    async function syncChatContext() {
      if (!targetUserId) {
        setChatRoomId(null);
        setChatMessages([]);
        return;
      }

      try {
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (room) {
          setChatRoomId(room.id);

          const { data: historicMessages } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: true });

          if (historicMessages) setChatMessages(historicMessages as ChatMessage[]);

          // Listen to new incoming messages inside this active room
          messageChannel = supabase
            .channel(`admin-room-${room.id}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
              (payload) => {
                setChatMessages((prev) => {
                  if (prev.some(msg => msg.id === payload.new.id)) return prev;
                  return [...prev, payload.new as ChatMessage];
                });
              }
            )
            .subscribe();
        } else {
          setChatRoomId(null);
          setChatMessages([]);

          // Auto-bind streaming session if client constructs room after selection setup
          roomChannel = supabase
            .channel(`admin-room-wait-${targetUserId}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'chat_rooms', filter: `user_id=eq.${targetUserId}` },
              () => {
                syncChatContext();
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Failed to safely resolve real-time communications stream:", err);
      }
    }

    if (isAuthenticated) syncChatContext();

    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
      if (roomChannel) supabase.removeChannel(roomChannel);
    };
  }, [targetUserId, isAuthenticated]);

  async function loadMasterLedger() {
    setLoading(true);
    setAdminMessage(null); 
    try {
      const response = await fetch('/api/admin/ledger');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Secure tracking node rejected connection request.');
      }

      if (data.users) {
        setUserList(data.users as UserMap[]);
        
        const currentId = targetUserRef.current;
        if (currentId) {
          const updatedUser = (data.users as UserMap[]).find(u => u.user_id === currentId);
          if (updatedUser) {
            setCustomLimit(updatedUser.account_limit !== undefined && updatedUser.account_limit !== null ? updatedUser.account_limit.toString() : '2000000.00');
            setCustomLoan(updatedUser.loan_balance !== undefined && updatedUser.loan_balance !== null ? updatedUser.loan_balance.toString() : '0.00');
            setCustomStatus(updatedUser.node_status || 'Active / Enforced Tunnel');
          }
        }
      }

      if (data.transactions) {
        const txData = data.transactions as Transaction[];
        setAllTransactions(txData);
        
        const currentFilterId = targetUserRef.current;
        if (currentFilterId && currentFilterId !== '') {
          setFilteredTransactions(txData.filter(tx => tx.user_id === currentFilterId));
        } else {
          setFilteredTransactions(txData);
        }
      }
    } catch (error: any) {
      console.error("Failed to load master ledger:", error);
      setAdminMessage({ type: 'error', text: `Synchronization loss: ${error.message}` });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadMasterLedger();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) setAdminUserId(user.id);
      });
    }
  }, [isAuthenticated]);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcodeInput === "HexafoxAdmin2026!") {
      setIsAuthenticated(true);
    } else {
      setGatekeeperError('Invalid Administrative Authorization Credentials.');
    }
  };

  const selectTargetUser = (usr: UserMap) => {
    if (!usr.user_id) return;
    setTargetUserId(usr.user_id);
    setSelectedEmail(usr.email);
    setFilteredTransactions(allTransactions.filter(tx => tx.user_id === usr.user_id));
    
    setCustomLimit(usr.account_limit !== undefined && usr.account_limit !== null ? usr.account_limit.toString() : '2000000.00');
    setCustomLoan(usr.loan_balance !== undefined && usr.loan_balance !== null ? usr.loan_balance.toString() : '0.00');
    setCustomStatus(usr.node_status || 'Active / Enforced Tunnel');
  };

  const clearUserFilter = () => {
    targetUserRef.current = '';
    setTargetUserId('');
    setSelectedEmail('');
    setFilteredTransactions(allTransactions);
    setCustomLimit('2000000.00');
    setCustomLoan('0.00');
    setCustomStatus('Active / Enforced Tunnel');
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

  const handleSaveProfileOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) {
      setAdminMessage({ type: 'error', text: 'Please select a user account first.' });
      return;
    }

    setActionLoading(true);
    setAdminMessage(null);

    try {
      const response = await fetch('/api/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          accountLimit: customLimit,
          loanBalance: customLoan,
          nodeStatus: customStatus
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to write configurations to database.');

      setAdminMessage({ type: 'success', text: `Successfully rewritten profile override metrics for: ${selectedEmail}` });
      await loadMasterLedger();
    } catch (error: any) {
      setAdminMessage({ type: 'error', text: `Override save fault: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !targetUserId) return;

    try {
      let activeRoomId = chatRoomId;

      if (!activeRoomId) {
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert([{ user_id: targetUserId }])
          .select('id')
          .single();

        if (roomError) throw roomError;
        if (newRoom) {
          activeRoomId = newRoom.id;
          setChatRoomId(newRoom.id);
        }
      }

      if (!activeRoomId) throw new Error("Unable to establish communication room link.");

      // Use active session identity, or fall back to system bypass identity context
      const systemSenderId = adminUserId || '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase.from('messages').insert([
        {
          room_id: activeRoomId,
          sender_id: systemSenderId,
          message: replyText.trim()
        }
      ]);

      if (error) throw error;
      setReplyText('');
    } catch (err: any) {
      console.error("Disruption delivering outbound messaging frame:", err);
      setAdminMessage({ type: 'error', text: `Chat delivery failure: ${err.message}` });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-md bg-[#0b132b] border border-red-900/40 p-8 rounded-2xl shadow-2xl space-y-6">
          <h1 className="text-xl font-bold text-center text-white">Executive Master Terminal</h1>
          <form onSubmit={handleVerifyPasscode} className="space-y-4">
            <input type="password" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)}
              className="w-full bg-[#111a36] border border-slate-700 rounded-xl p-3 text-center transition-colors focus:border-red-500 focus:outline-none" placeholder="••••••••••••••••" />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold uppercase text-xs transition-colors">Verify Credentials</button>
          </form>
          {gatekeeperError && <p className="text-red-400 text-xs text-center">{gatekeeperError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6 font-sans antialiased">
      
      {/* HEADER CONTROLS BAR */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-xl">
        <h2 className="text-xl font-black text-red-400 flex items-center gap-2">
          <ShieldCheck size={20} /> Mikes Finance Master Control
        </h2>
        <button onClick={() => setIsAuthenticated(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 px-4 py-2 rounded-xl text-xs transition-colors">
          Lock Terminal
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CONTROL COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* User Selector Selection Box */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <div className="flex items-center gap-2 mb-4 text-slate-200">
              <Users size={16} className="text-blue-400" />
              <h3 className="font-bold text-sm">Registered Accounts</h3>
            </div>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {userList.map((usr) => (
                <button key={usr.user_id} onClick={() => selectTargetUser(usr)} 
                  className={`w-full text-left p-3 rounded-xl border text-xs font-medium tracking-wide transition-all ${targetUserId === usr.user_id ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                  {usr.email}
                </button>
              ))}
            </div>
          </div>
          
          {/* Adjustment Modifier Form */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Modify Balance Parameters</h3>
            <form onSubmit={handleBalanceAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Online Deposit')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  ➕ Inject ($+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('Admin Deduction')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${adjustmentType === 'Admin Deduction' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  ➖ Minus ($-)
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Target Account Profile</label>
                <input 
                  type="text" 
                  value={selectedEmail ? `${selectedEmail}` : ''} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-500 font-mono cursor-not-allowed truncate" 
                  placeholder="Select a user account address pointer..." 
                  disabled 
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Adjustment Value ($)</label>
                <input type="number" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} 
                  className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-slate-700" placeholder="0.00" required />
              </div>

              <button type="submit" disabled={actionLoading || !targetUserId} className={`w-full py-3 rounded-xl font-bold text-xs uppercase text-white transition-all disabled:bg-slate-800 disabled:text-slate-600 ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {actionLoading ? 'Executing Change Override...' : 'Execute Balance Shift'}
              </button>
            </form>
          </div>

          {/* Node Properties Dynamic Config Form */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Edit Node Properties</h3>
            <form onSubmit={handleSaveProfileOverrides} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Account Custom Limit</label>
                <input type="text" value={customLimit} onChange={(e) => setCustomLimit(e.target.value)} className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-slate-700" placeholder="2000000.00" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Assigned Loan Balance</label>
                <input type="text" value={customLoan} onChange={(e) => setCustomLoan(e.target.value)} className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-slate-700" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Node Status Level</label>
                <select value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none cursor-pointer focus:border-slate-700 border">
                  <option value="Active / Enforced Tunnel">🟢 Active / Enforced Tunnel</option>
                  <option value="Verification Hold">🟡 Verification Hold</option>
                  <option value="Terminated / Locked Node">🔴 Terminated / Locked Node</option>
                </select>
              </div>
              <button type="submit" disabled={actionLoading || !targetUserId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md">
                {actionLoading ? 'Saving Metrics...' : 'Save Account Updates'}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT MONITOR & OPERATIONS COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dedicated Live OTP Clearance Queue Table */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <KeyRound size={16} /> Live OTP Authorization Monitor
              </h3>
              <button 
                onClick={loadMasterLedger}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors text-slate-400 hover:text-white"
                title="Refresh Live Data"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {otpStandbyQueue.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-6 text-center bg-black/20 rounded-xl border border-dashed border-slate-800/60">
                No users are currently awaiting an OTP verification code.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#1a1f36] text-amber-400/90 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-2.5">User Email</th>
                      <th className="p-2.5">User ID String</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5 text-center">Active OTP Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-black/10">
                    {otpStandbyQueue.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-2.5 font-medium text-slate-200">{getEmailFromId(tx.user_id)}</td>
                        <td className="p-2.5 font-mono text-[10px] text-slate-500 max-w-[120px] truncate" title={tx.user_id}>
                          {tx.user_id}
                        </td>
                        <td className="p-2.5 font-bold text-slate-200">
                          ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-center">
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md font-mono font-black tracking-widest text-xs select-all">
                            {tx.generated_otp || '------'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* --- ADMINISTRATIVE LIVE CHAT SUPPORT INTERFACE PANEL --- */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl flex flex-col h-[400px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-200">
                  {selectedEmail ? `Secure Support Link: ${selectedEmail}` : "System Support Desk Terminal"}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 border rounded font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {chatRoomId ? "Session Wired" : "Standby Mode"}
              </span>
            </div>

            {/* Chat Dialog Feed Container */}
            <div className="flex-1 min-h-0 bg-slate-950/50 border border-slate-900/80 rounded-xl p-4 overflow-y-auto space-y-3">
              {!targetUserId ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <MessageCircle size={28} className="text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select a registered user account from the profile sidebar matrix to bind communications tunnels and manage inquiries.
                  </p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <p className="text-xs text-slate-600 font-medium">
                    No active messages transmitted inside this link. Send an initial ping if assistance is required.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isUserMessage = msg.sender_id === targetUserId;
                  return (
                    <div key={msg.id} className={`flex ${isUserMessage ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed shadow-sm break-words ${
                        isUserMessage 
                          ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/40' 
                          : 'bg-blue-600 text-white rounded-br-none'
                      }`}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5 opacity-60">
                          {isUserMessage ? 'Client User' : 'Desk Admin Override'}
                        </div>
                        <p className="font-medium">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Outbound Messaging Form */}
            <form onSubmit={handleSendAdminReply} className="mt-3 flex gap-2 pt-1">
              <input 
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={!targetUserId}
                placeholder={targetUserId ? "Transmit directive down line..." : "Select a user profile to begin typing..."}
                className="flex-1 bg-slate-950 text-xs text-slate-100 placeholder:text-slate-600 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors disabled:cursor-not-allowed"
              />
              <button 
                type="submit" 
                disabled={!replyText.trim() || !targetUserId}
                className="px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 transition-colors flex items-center justify-center shadow-md"
              >
                <Send size={14} />
              </button>
            </form>
          </div>

          {/* Master Global Transaction Ledger Stream */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                {selectedEmail ? `Ledger Feed Stream: ${selectedEmail}` : "Global Ledger Stream Trace"}
              </h3>
              {targetUserId && <button onClick={clearUserFilter} className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 transition-all">Reset Feed (Show All)</button>}
            </div>

            {adminMessage && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${adminMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {adminMessage.text}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-slate-500 animate-pulse flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Running array query sync...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-12 text-center bg-black/20 rounded-xl border border-dashed border-slate-800/60">No transaction logs matching this account signature.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#111a36] text-slate-400 font-semibold border-b border-slate-800/80">
                    <tr>
                      <th className="p-3">User Email Identity</th>
                      <th className="p-3">Type Classification</th>
                      <th className="p-3">Delta Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-black/5">
                    {filteredTransactions.map((tx) => {
                      const isDeposit = tx.type === 'Online Deposit';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-medium text-slate-300">{getEmailFromId(tx.user_id)}</td>
                          <td className="p-3 font-medium">
                            <span className={isDeposit ? 'text-emerald-400' : 'text-slate-400'}>{tx.type}</span>
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