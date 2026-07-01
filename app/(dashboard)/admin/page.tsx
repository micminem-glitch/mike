"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; 
import { 
  RefreshCw, 
  Users, 
  Layers, 
  ShieldCheck, 
  KeyRound, 
  MessageSquare, 
  Send, 
  MessageCircle,
  LogOut,
  HelpCircle
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

interface ChatRoomRecord {
  id: string;
  user_id: string;
  created_at: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); 

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [userList, setUserList] = useState<UserMap[]>([]);
  const [chatRoomsList, setChatRoomsList] = useState<ChatRoomRecord[]>([]);
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

  // Helper check: True if selected target is an anonymous guest session (not in registered user array)
  const isTargetGuest = targetUserId ? !userList.some(u => u.user_id === targetUserId) : false;

  // 1. SECURITY GATE: Validate active session status
  useEffect(() => {
    async function verifyAdminSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAdminUserId(user.id);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch (err) {
        console.error("Global auth validation fault:", err);
        setIsAuthenticated(false);
        router.push('/login');
      }
    }
    verifyAdminSession();
  }, [router]);

  // 2. LIVE ANONYMOUS ROOM TRACKING: Synchronizes global support signals instantly
  useEffect(() => {
    if (isAuthenticated !== true) return;

    let globalRoomChannel: any;

    async function syncAllActiveRooms() {
      const { data: rooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true });
      if (rooms) setChatRoomsList(rooms as ChatRoomRecord[]);
    }

    syncAllActiveRooms();

    // Subscribe to new rooms appearing when anonymous guests chat the landing page
    globalRoomChannel = supabase
      .channel('admin-global-rooms-monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => {
        syncAllActiveRooms();
      })
      .subscribe();

    return () => {
      if (globalRoomChannel) supabase.removeChannel(globalRoomChannel);
    };
  }, [isAuthenticated]);

  // Unified Chat Syncing & Live Capture Engine
  useEffect(() => {
    let messageChannel: any;

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
        }
      } catch (err) {
        console.error("Failed to safely resolve communications stream:", err);
      }
    }

    if (isAuthenticated === true) syncChatContext();

    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
    };
  }, [targetUserId, isAuthenticated]);

  async function loadMasterLedger() {
    setLoading(true);
    setAdminMessage(null); 
    try {
      const response = await fetch('/api/admin/ledger');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Secure ledger server rejected request.');
      }

      if (data.users) {
        setUserList(data.users as UserMap[]);
        
        const currentId = targetUserRef.current;
        if (currentId) {
          const updatedUser = (data.users as UserMap[]).find(u => u.user_id === currentId);
          if (updatedUser) {
            setCustomLimit(updatedUser.account_limit?.toString() || '2000000.00');
            setCustomLoan(updatedUser.loan_balance?.toString() || '0.00');
            setCustomStatus(updatedUser.node_status || 'Active / Enforced Tunnel');
          }
        }
      }

      if (data.transactions) {
        const txData = data.transactions as Transaction[];
        setAllTransactions(txData);
        
        const currentFilterId = targetUserRef.current;
        if (currentFilterId) {
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
    if (isAuthenticated === true) {
      loadMasterLedger();
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push('/login');
    } catch (err) {
      console.error("Administrative logout failure:", err);
    }
  };

  const selectTargetUser = (usr: UserMap) => {
    if (!usr.user_id) return;
    setTargetUserId(usr.user_id);
    setSelectedEmail(usr.email);
    setFilteredTransactions(allTransactions.filter(tx => tx.user_id === usr.user_id));
    
    setCustomLimit(usr.account_limit?.toString() || '2000000.00');
    setCustomLoan(usr.loan_balance?.toString() || '0.00');
    setCustomStatus(usr.node_status || 'Active / Enforced Tunnel');
  };

  const selectAnonymousGuest = (guestId: string, customLabel: string) => {
    setTargetUserId(guestId);
    setSelectedEmail(customLabel);
    setFilteredTransactions([]); 
    setCustomLimit('0.00');
    setCustomLoan('0.00');
    setCustomStatus('Anonymous Live Session');
  };

  const clearUserFilter = () => {
    targetUserRef.current = '';
    setTargetUserId('');
    setSelectedEmail('');
    setFilteredTransactions(allTransactions);
  };

  // Filters any active room that is NOT associated with an account inside userList
  const anonymousRooms = chatRoomsList.filter(room => !userList.some(u => u.user_id === room.user_id));

  const getEmailFromId = (uid: string | null | undefined) => {
    if (!uid) return "Anonymous Guest";

    const match = userList.find(u => u.user_id === uid);
    if (match) return match.email;

    // Filter chatRoomsList to only count anonymous configurations
    const chronologicalIndex = chatRoomsList
      ?.filter(room => !userList.some(u => u.user_id === room.user_id))
      ?.findIndex(room => room.user_id === uid);

    const guestNumber = chronologicalIndex !== undefined && chronologicalIndex !== -1 
      ? chronologicalIndex + 1 
      : 1;

    return `Anonymous Guest ${guestNumber}`;
  };

  const handleBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || isTargetGuest) return;

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

      setAdminMessage({ type: 'success', text: `Adjustment successfully written to ${selectedEmail}` });
      setAdjustmentAmount('');
      await loadMasterLedger();
    } catch (error: any) {
      setAdminMessage({ type: 'error', text: `Adjustment failure: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveProfileOverrides = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId || isTargetGuest) return;

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
      if (!response.ok) throw new Error(result.error || 'Failed to apply configurations.');

      setAdminMessage({ type: 'success', text: `Overrode dashboard settings for: ${selectedEmail}` });
      await loadMasterLedger();
    } catch (error: any) {
      setAdminMessage({ type: 'error', text: `Override save fault: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !chatRoomId || !adminUserId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([
          {
            room_id: chatRoomId,
            message: replyText.trim(),
            sender_id: adminUserId, 
          }
        ]);

      if (error) {
        setAdminMessage({ type: 'error', text: `Message delivery error: ${error.message}` });
      } else {
        setReplyText('');
      }
    } catch (err: any) {
      console.error("Unexpected error routing outgoing transmission:", err);
    }
  };

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <RefreshCw className="animate-spin text-red-500 mb-4" size={28} />
        <p className="text-xs text-slate-400 tracking-wider uppercase font-semibold">Verifying Secure Admin Session...</p>
      </div>
    );
  }

  if (isAuthenticated === false) return null;

  return (
    <div className="w-full min-h-screen bg-slate-950 text-white p-4 sm:p-6 space-y-6 font-sans antialiased">
      
      {/* HEADER CONTROLS BAR */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex justify-between items-center shadow-xl">
        <h2 className="text-xl font-black text-red-400 flex items-center gap-2">
          <ShieldCheck size={20} /> Mikes Finance Master Control
        </h2>
        <button onClick={handleLogout} className="bg-red-955/40 hover:bg-red-900/40 text-red-400 font-bold border border-red-900/40 px-4 py-2 rounded-xl text-xs transition-colors flex items-center gap-2">
          <LogOut size={14} /> Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT CONTROL SIDEBAR ROW */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* COMBINED USER MATRIX INTERFACE */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-3 text-slate-200">
                <Users size={16} className="text-blue-400" />
                <h3 className="font-bold text-sm">Registered Accounts</h3>
              </div>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {userList.map((usr) => (
                  <button key={usr.user_id} onClick={() => selectTargetUser(usr)} 
                    className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium tracking-wide transition-all ${targetUserId === usr.user_id ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                    {usr.email}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2 mb-3 text-slate-200">
                <HelpCircle size={16} className="text-emerald-400" />
                <h3 className="font-bold text-sm">Landing Page Guests</h3>
              </div>
              {anonymousRooms.length === 0 ? (
                <p className="text-[11px] text-slate-600 font-medium italic pl-1">No active visitor sessions.</p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {anonymousRooms.map((room) => {
                    const customLabel = getEmailFromId(room.user_id);
                    return (
                      <button key={room.id} onClick={() => selectAnonymousGuest(room.user_id, customLabel)} 
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium tracking-wide transition-all ${targetUserId === room.user_id ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-black/30 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                        {targetUserId === room.user_id ? '🟢' : '⚪'} {customLabel} <span className="text-[9px] text-slate-600 font-mono block mt-0.5">ID: {room.user_id}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* Adjustment Modifier Form Component */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Modify Balance Parameters</h3>
            {isTargetGuest ? (
              <p className="text-xs text-slate-500 italic bg-black/20 p-3 border border-slate-800 rounded-xl">
                Balance mutations cannot be applied to unregistered anonymous visitor entities.
              </p>
            ) : (
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
                  <input type="text" value={selectedEmail || ''} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-500 font-mono cursor-not-allowed truncate" placeholder="Select a user address..." disabled />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Adjustment Value ($)</label>
                  <input type="number" value={adjustmentAmount} onChange={(e) => setAdjustmentAmount(e.target.value)} className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-slate-700" placeholder="0.00" required />
                </div>

                <button type="submit" disabled={actionLoading || !targetUserId} className={`w-full py-3 rounded-xl font-bold text-xs uppercase text-white transition-all disabled:bg-slate-800 disabled:text-slate-600 ${adjustmentType === 'Online Deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  {actionLoading ? 'Executing Override...' : 'Execute Balance Shift'}
                </button>
              </form>
            )}
          </div>

          {/* Configuration Property Node Settings */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <h3 className="font-bold text-sm mb-4 text-slate-200">Edit Node Properties</h3>
            {isTargetGuest ? (
              <p className="text-xs text-slate-500 italic bg-black/20 p-3 border border-slate-800 rounded-xl">
                Profile metrics override rules are locked for anonymous landing page sessions.
              </p>
            ) : (
              <form onSubmit={handleSaveProfileOverrides} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Account Custom Limit</label>
                  <input type="text" value={customLimit} onChange={(e) => setCustomLimit(e.target.value)} className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-slate-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Assigned Loan Balance</label>
                  <input type="text" value={customLoan} onChange={(e) => setCustomLoan(e.target.value)} className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-slate-700" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Node Status Level</label>
                  <select value={customStatus} onChange={(e) => setCustomStatus(e.target.value)} className="w-full bg-[#111a36] border border-slate-800 rounded-xl p-3 text-xs text-white outline-none cursor-pointer border focus:border-slate-700">
                    <option value="Active / Enforced Tunnel">🟢 Active / Enforced Tunnel</option>
                    <option value="Verification Hold">🟡 Verification Hold</option>
                    <option value="Terminated / Locked Node">🔴 Terminated / Locked Node</option>
                  </select>
                </div>
                <button type="submit" disabled={actionLoading || !targetUserId} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all">
                  {actionLoading ? 'Saving Metrics...' : 'Save Account Updates'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT OPERATIONS SCREEN PANELS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* OTP Authorization monitor table module */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-amber-400 flex items-center gap-1.5">
                <KeyRound size={16} /> Live OTP Authorization Monitor
              </h3>
              <button onClick={loadMasterLedger} className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 border border-slate-700">
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
                      <th className="p-2.5">User Link Identity</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5 text-center">Active OTP Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-black/10">
                    {otpStandbyQueue.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-2.5 font-medium text-slate-200">{getEmailFromId(tx.user_id)}</td>
                        <td className="p-2.5 font-bold text-slate-200">${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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

          {/* LIVE SUPPORT DESK REPLIES SCREEN */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl flex flex-col h-[400px]">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-200">
                  {selectedEmail ? `Secure Support Link: ${selectedEmail}` : "System Support Desk Terminal"}
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 border rounded font-mono uppercase bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {chatRoomId ? "Session Wired" : "Standby Mode"}
              </span>
            </div>

            {/* Chat dialog feed screen container logs */}
            <div className="flex-1 min-h-0 bg-slate-950/50 border border-slate-900/80 rounded-xl p-4 overflow-y-auto space-y-3">
              {!targetUserId ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <MessageCircle size={28} className="text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 max-w-sm">
                    Select a registered user profile or a dynamic landing page guest session to link communications.
                  </p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                  <p className="text-xs text-slate-600 font-medium">No messages transmitted inside this link. Send a direct ping to open conversation.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isUserMessage = msg.sender_id === targetUserId;
                  return (
                    <div key={msg.id} className={`flex ${isUserMessage ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] p-3 rounded-xl text-xs shadow-sm break-words ${
                        isUserMessage ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/40' : 'bg-blue-600 text-white rounded-br-none'
                      }`}>
                        <div className="text-[9px] font-bold uppercase tracking-wider mb-0.5 opacity-60">
                          {isUserMessage ? 'Client Console User' : 'Desk Admin Override'}
                        </div>
                        <p className="font-medium">{msg.message}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Outbound reply tracking console form element */}
            <form onSubmit={handleSendAdminReply} className="mt-3 flex gap-2 pt-1">
              <input 
                type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} disabled={!targetUserId}
                placeholder={targetUserId ? "Transmit reply directive down active channel line..." : "Select a session account profile to unlock chat window..."}
                className="flex-1 bg-slate-950 text-xs text-slate-100 border border-slate-800 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 disabled:cursor-not-allowed"
              />
              <button type="submit" disabled={!replyText.trim() || !targetUserId} className="px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-500 disabled:bg-slate-800 flex items-center justify-center"><Send size={14} /></button>
            </form>
          </div>

          {/* Master Global Ledger System Stream logs table */}
          <div className="bg-[#0b132b] p-6 rounded-2xl border border-slate-900 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                {selectedEmail ? `Ledger Feed Stream: ${selectedEmail}` : "Global Ledger Stream Trace"}
              </h3>
              {targetUserId && <button onClick={clearUserFilter} className="bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300">Reset Feed Filter</button>}
            </div>

            {adminMessage && (
              <div className={`p-3 rounded-xl text-xs mb-4 ${adminMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {adminMessage.text}
              </div>
            )}

            {loading ? (
              <p className="text-sm text-slate-500 animate-pulse flex items-center gap-2"><RefreshCw size={14} className="animate-spin" /> Syncing data...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-12 text-center bg-black/20 rounded-xl border border-dashed border-slate-800/60">No matching account signature records found inside ledger arrays.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#111a36] text-slate-400 font-semibold border-b border-slate-800/80">
                    <tr>
                      <th className="p-3">User Link Identity</th>
                      <th className="p-3">Type</th>
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