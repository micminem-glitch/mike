"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { User, Mail, Globe, Lock, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';

export default function CreateAccountPage() {
  const router = useRouter();
  
  // Updated State: Removed phone and idNumber
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Security mismatch: Passwords do not match.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password strength failure: Must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            country: formData.country,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Authentication node failed to initialize safe instance.");

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.fullName,
            country: formData.country,
            account_status: 'Active',
            custom_limit: '2000000.00',
            loan_balance: '0.00'
          }
        ]);

      if (profileError) console.error("Profile sync error details:", profileError);

      setSuccessMessage("Secure identity initialized successfully! Redirecting to secure gateway...");
      setTimeout(() => {
        router.push('/login'); 
      }, 2500);

    } catch (error: any) {
      console.error("Registration engine crash:", error);
      setErrorMessage(error.message || "An unresolved network exception occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl bg-[#0b132b] border border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center space-y-1">
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center justify-center gap-2">
            <ShieldCheck className="text-white animate-pulse" size={24} /> Hexafox Security Gateway
          </h1>
          <p className="text-xs text-blue-100 font-medium tracking-wide">Establish a cryptographic personal financial node</p>
        </div>

        <form onSubmit={handleRegister} className="p-6 sm:p-10 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <div><span className="font-bold">System Halt:</span> {errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-start gap-2.5">
              <ShieldCheck size={16} className="shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Legal Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} required className="w-full bg-[#111a36] border border-slate-700/60 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all" placeholder="Johnathan Doe" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Secure Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full bg-[#111a36] border border-slate-700/60 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all" placeholder="j.doe@network.com" />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jurisdiction (Country)</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <select name="country" value={formData.country} onChange={handleInputChange} required className="w-full bg-[#111a36] border border-slate-700/60 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all appearance-none cursor-pointer text-slate-300">
                  <option value="" disabled>Select Region...</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="South Korea">South Korea</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Germany">Germany</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Access Key Passcode</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required className="w-full bg-[#111a36] border border-slate-700/60 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Re-verify Access Key</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required className="w-full bg-[#111a36] border border-slate-700/60 focus:border-blue-500 rounded-xl pl-10 pr-4 py-3 text-xs outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 py-3.5 rounded-xl font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2">
              {loading ? <><RefreshCw className="animate-spin" size={14} /> Completing Handshake...</> : "Authorize Account Generation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}