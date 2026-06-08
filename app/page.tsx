import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="bg-black text-white min-h-[90vh] flex flex-col justify-between px-4 sm:px-8 md:px-16 lg:px-24 py-8">
      
      {/* BRAND HEADER NAVIGATION */}
      <header className="flex justify-between items-center py-6 border-b border-slate-950">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-wider text-blue-500 uppercase">Hexafox United</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20">
            Open Account
          </Link>
        </div>
      </header>

      {/* HERO SECTION CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 my-auto items-center py-12">
        
        {/* LEFT MARKETING SIDE */}
        <div className="lg:col-span-7 space-y-6">
          <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest inline-block">
            Next-Gen Sovereign Asset Liquidity
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-none text-white max-w-2xl">
            The Decentralized Treasury Interface for Global Capital.
          </h1>
          <p className="text-slate-400 text-base md:text-lg max-w-xl font-light leading-relaxed">
            Manage tier-one ledger accounts, domestic multi-point clearance routing, and high-yield asset nodes within a fully sandboxed cryptographic institutional framework.
          </p>
          
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Link href="/login" className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold px-8 py-4 rounded-xl shadow-xl shadow-blue-600/10 transition-all text-center min-w-[180px]">
              Initialize Portal
            </Link>
            <a href="#features" className="bg-[#0b132b] border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 font-semibold px-8 py-4 rounded-xl transition-all text-center min-w-[180px]">
              Explore Node Ecosystem
            </a>
          </div>
        </div>

        {/* RIGHT DECORATIVE TELEMETRY PREVIEW PANEL */}
        <div className="lg:col-span-5 bg-[#0b132b] border border-slate-800/80 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Live Node Engine v4.8</span>
          </div>

          <div className="space-y-4">
            <div className="bg-black/40 p-4 rounded-xl border border-slate-900 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Secure Escrow Core Balance</span>
                <span className="text-emerald-400 font-mono font-bold">ONLINE</span>
              </div>
              <div className="text-2xl font-black font-mono">$0.00</div>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-slate-900 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Cryptographic Clearance Speed</span>
                <span className="text-blue-400 font-mono font-bold">128 ms</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-full w-[94%]"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER MATRIX METRICS */}
      <footer className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-950 text-center md:text-left">
        <div>
          <div className="text-xl font-bold font-mono text-white">99.99%</div>
          <div className="text-xs text-slate-500 uppercase font-medium tracking-wide">Tunnel Uptime Ensure</div>
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-white">256-Bit</div>
          <div className="text-xs text-slate-500 uppercase font-medium tracking-wide">AES Vault Hardening</div>
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-white">Instant</div>
          <div className="text-xs text-slate-500 uppercase font-medium tracking-wide">Delta Routing Logs</div>
        </div>
        <div>
          <div className="text-xl font-bold font-mono text-white">Zero-Fee</div>
          <div className="text-xs text-slate-500 uppercase font-medium tracking-wide">Internal Asset Drops</div>
        </div>
      </footer>

    </div>
  );
}