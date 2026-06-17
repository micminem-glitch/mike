"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Briefcase, 
  History, 
  Download, 
  Menu,
  X 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  // State to track mobile drawer open/close sequence
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", href: "/overview" },
    { icon: <ArrowUpRight size={20} />, label: "Online Deposit", href: "/deposit" },
    { icon: <ArrowDownLeft size={20} />, label: "Domestic Transfer", href: "/transfer" },
    { icon: <CreditCard size={20} />, label: "Virtual Card", href: "/cards" },
    { icon: <Briefcase size={20} />, label: "Loan & Mortgages", href: "/loans" },
    { icon: <History size={20} />, label: "Transaction Logs", href: "/logs" },
    { icon: <Download size={20} />, label: "Withdrawal", href: "/withdrawal" },
  ];

  return (
    <>
      {/* 1. FLOATING MOBILE HAMBURGER TOGGLE BUTTON */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 rounded-xl bg-[#0d1b2a] border border-slate-700/50 text-slate-300 hover:text-white shadow-xl focus:outline-none"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* 2. MOBILE DARK BACKGROUND OVERLAY CLIPPING PROTECTION */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 3. DYNAMIC SIDEBAR (FIXED ABSOLUTE POSITIONING OVERLAY ON MOBILE, STICKY ROW FLOW ON DESKTOP) */}
      <aside className={`
        fixed md:sticky top-0 bottom-0 left-0
        w-64 bg-[#0d1b2a] text-slate-300 flex flex-col h-screen z-40
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-700/50">
          <h1 className="text-xl font-bold text-white tracking-wide">Hexafox United</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item, idx) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={idx} 
                href={item.href}
                onClick={() => setIsMobileOpen(false)} // Closes menu when link is clicked on mobile
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}