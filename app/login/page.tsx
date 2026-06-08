"use client";

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isRegistering) {
      // Sign Up new user
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Registration successful! Check your email for a confirmation link.' });
      }
    } else {
      // Log In existing user
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        // CHANGED: Route users explicitly to internal overview instead of root homepage
        router.push('/overview'); 
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full">
      <div className="bg-[#0b132b] text-white p-8 rounded-2xl border border-slate-800 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-2 text-center">Hexafox United Vault</h2>
        <p className="text-slate-400 text-sm mb-6 text-center">
          {isRegistering ? 'Create a secure access credential profile' : 'Sign in to access your platform portal'}
        </p>

        {message && (
          <div className={`p-4 rounded-xl text-sm mb-4 ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-blue-500 text-white placeholder-slate-500" 
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-blue-500 text-white placeholder-slate-500" 
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-blue-600/10"
          >
            {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button 
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-blue-400 hover:underline bg-transparent border-none outline-none cursor-pointer"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
}