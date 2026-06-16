"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase'; // Double check your relative path to your supabase client config
import { Mail, Lock, ShieldCheck, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';

export default function LoginTerminalPage() {
  const router = useRouter();
  
  // Form Fields State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Authenticate with Supabase Auth Engine
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Terminal gateway rejected authorization handshake.");

      setSuccessMessage("Identity verified. Decrypting personal ledger stream...");
      
      // 2. Route straight into the user gateway / dashboard
      setTimeout(() => {
        router.push('/overview'); // Change this path if your user page lives elsewhere (e.g., '/')
      }, 1500);

    } catch (error: any) {
      console.error("Authentication gate failure:", error);
      setErrorMessage(error.message || "Invalid access credentials or severed database connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-blue-600/30">
      <div className="w-full max-w-md bg-[#0b132b] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Decorative Top Accent Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center space-y-1">
          <h1 className="text-xl font-black tracking-tight uppercase flex items-center justify-center gap-2">
            <ShieldCheck className="text-white animate-pulse" size={22} /> Hexafox Login Node
          </h1>
          <p className="text-xs text-blue-100 font-medium tracking-wide">Sync authorization key with master network</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
          
          {/* Diagnostic Messages Reporting */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div><span className="font-bold">Access Denied:</span> {errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5 animate-fadeIn">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Form Fields Container */}
          <div className="space-y-4">
            
            {/* Field: Email Identity */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-[#111a36] border border-slate-700/60 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all placeholder:text-slate-600 font-medium" 
                  placeholder="name@network.com" />
              </div>
            </div>

            {/* Field: Passcode Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Key Passcode</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  className="w-full bg-[#111a36] border border-slate-700/60 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all placeholder:text-slate-600 font-medium" 
                  placeholder="••••••••" />
              </div>
            </div>

          </div>

          {/* Action Trigger Block */}
          <div className="pt-2 space-y-4">
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-600 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.99]">
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={14} /> decrypting handshake...
                </>
              ) : (
                <>
                  Establish Terminal Session <ArrowRight size={14} />
                </>
              )}
            </button>

            <div className="flex justify-between items-center px-1 text-xs text-slate-500 font-medium">
              <p>
                New profile node?{' '}
                <span onClick={() => router.push('/register')} className="text-blue-400 hover:underline cursor-pointer transition-all">
                  Register Securely
                </span>
              </p>
              
              <span onClick={() => router.push('/admin')} className="text-red-400/70 hover:text-red-400 cursor-pointer text-[11px] font-semibold transition-all uppercase tracking-wider">
                Admin Terminal
              </span>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}