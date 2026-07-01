"use client";

import React from 'react';
import Link from 'next/link';

// 👇 FIX 1: If your components folder is INSIDE the app folder
import LandingChat from './components/LandingChat'; 

// 💡 TROUBLESHOOTING NOTE: 
// If the above line still errors out, look at your file tree and swap it with one of these:
// import LandingChat from '../../components/LandingChat'; // (Use this if you are using a src/ directory setup)
// import LandingChat from '../components/LandingChat';    // (Use this if components is at the absolute root outside app)

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans antialiased selection:bg-blue-600/30 relative">
      
      {/* TOP HEADER NAVIGATION */}
      <header className="max-w-7xl w-full mx-auto px-6 sm:px-12 h-24 flex items-center justify-between relative z-10">
        <div className="text-xl font-black tracking-wider uppercase text-blue-500">
          Hexafox United
        </div>
        
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
            Sign In
          </Link>
          
          <Link href="/register" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all">
            Open Account
          </Link>
        </div>
      </header>

      {/* HERO SECTION CONTAINER */}
      <main className="max-w-7xl w-full mx-auto flex-1 px-6 sm:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pb-16 relative z-10">
        
        {/* Left Content Column */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-block bg-blue-950/40 border border-blue-900/50 text-[10px] font-bold uppercase tracking-widest text-blue-400 px-3 py-1 rounded-full">
            Next-Gen Sovereign Asset Liquidity
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-white">
            The Decentralized <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Treasury Interface
            </span> <br />
            for Global Capital.
          </h1>
          
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl font-medium">
            Manage tier-one ledger accounts, domestic multi-point clearance routing, and high-yield asset nodes within a fully sandboxed cryptographic institutional framework.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-7 py-4 rounded-xl shadow-xl shadow-blue-600/20 active:scale-[0.98] transition-all">
              Initialize Portal
            </Link>
            
            <button className="bg-[#111a36] hover:bg-[#162246] border border-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider px-7 py-4 rounded-xl active:scale-[0.98] transition-all">
              Explore Node Ecosystem
            </button>
          </div>
        </div>

        {/* Right Graphical Live Node Display Panel */}
        <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-[#0b132b]/60 border border-slate-800/80 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
            
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-600 uppercase">Live Node Engine V4.8</span>
            </div>

            <div className="bg-[#090f22] border border-slate-800/40 rounded-xl p-5 space-y-2 relative">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Secure Escrow Core Balance</span>
                <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase tracking-wider animate-pulse">Online</span>
              </div>
              <div className="text-3xl font-black text-white tracking-tight">$0.00</div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                <span className="text-slate-500">Cryptographic Clearance Speed</span>
                <span className="text-blue-400 font-mono">128 ms</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/50">
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full w-[88%] rounded-full" />
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* --- LIVE ANONYMOUS GUEST CHAT ENGINE WIDGET --- */}
      <LandingChat />
      
    </div>
  );
}