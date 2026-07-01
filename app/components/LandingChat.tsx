"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase'; // Adjust path if necessary
import { MessageSquare, X, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export default function LandingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize or retrieve anonymous Guest ID session using structural UUIDs
  useEffect(() => {
    let localId = localStorage.getItem('mikes_finance_guest_id');
    if (!localId) {
      // Generates a native web-crypto UUID to satisfy database strict structural constraints
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        localId = window.crypto.randomUUID();
      } else {
        // Fallback programmatic compliance algorithm if environment limits native crypto access
        localId = '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
          (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
      }
      localStorage.setItem('mikes_finance_guest_id', localId);
    }
    setGuestId(localId);
  }, []);

  // 2. Auto-scroll chat window to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Sync existing chat room and listen for real-time admin replies
  useEffect(() => {
    if (!guestId || !isOpen) return;

    let messageChannel: any;

    async function initializeAnonymousStream() {
      try {
        // Look for an existing room assigned to this anonymous token
        let { data: room, error: syncError } = await supabase
          .from('chat_rooms')
          .select('id')
          .eq('user_id', guestId)
          .maybeSingle();

        if (syncError) throw syncError;

        if (room) {
          setRoomId(room.id);

          // Pull past message logs
          const { data: history, error: historyError } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', room.id)
            .order('created_at', { ascending: true });

          if (historyError) throw historyError;
          if (history) setMessages(history as ChatMessage[]);

          // Listen live for incoming admin replies
          messageChannel = supabase
            .channel(`guest-room-${room.id}`)
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
              (payload) => {
                setMessages((prev) => {
                  if (prev.some(m => m.id === payload.new.id)) return prev;
                  return [...prev, payload.new as ChatMessage];
                });
              }
            )
            .subscribe();
        }
      } catch (err: any) {
        console.error("Anonymous stream sync error diagnostic payload:", {
          message: err?.message || err,
          details: err?.details,
          hint: err?.hint,
          code: err?.code
        });
      }
    }

    initializeAnonymousStream();

    return () => {
      if (messageChannel) supabase.removeChannel(messageChannel);
    };
  }, [guestId, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !guestId) return;

    let currentRoomId = roomId;

    try {
      // If this is their very first message, provision a brand new room dynamically
      if (!currentRoomId) {
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert([{ user_id: guestId }])
          .select()
          .single();

        if (roomError) throw roomError;
        currentRoomId = newRoom.id;
        setRoomId(currentRoomId);
      }

      // Route outbound message up to the administrative hub
      const { error: msgError } = await supabase
        .from('messages')
        .insert([
          {
            room_id: currentRoomId,
            message: inputText.trim(),
            sender_id: guestId,
          }
        ]);

      if (msgError) throw msgError;
      setInputText('');

      // Local update toggle to instantly activate real-time operational streams
      if (!roomId) {
        setIsOpen(false);
        setTimeout(() => setIsOpen(true), 50);
      }

    } catch (err: any) {
      // UNPACKED EXPLICIT ERROR PAYLOAD LOGGING
      console.error("Detailed Message Routing Failure:", {
        message: err?.message || err,
        details: err?.details,
        hint: err?.hint,
        code: err?.code
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans antialiased">
      {/* FLOATING ACTION ICON CONTROLLER */}
      {!isOpen ? (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-105 flex items-center justify-center border border-blue-500/30"
        >
          <MessageSquare size={24} />
        </button>
      ) : (
        /* ACTIVE CHAT WIDGET POPUP */
        <div className="w-[340px] h-[440px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
          
          {/* Header */}
          <div className="bg-slate-850 p-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h4 className="text-xs font-black tracking-wide text-blue-400 uppercase">Live Support Desk</h4>
              <p className="text-[10px] text-slate-400">Our team typically responds in minutes</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Dialogue Feed Window */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Have a question about security updates, nodes, or limits? Send a message to connect with an admin instantly.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === guestId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-2.5 rounded-xl text-xs ${
                      isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/40'
                    }`}>
                      <p className="font-medium">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Action Controls input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim()}
              className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl transition-colors disabled:opacity-40"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}