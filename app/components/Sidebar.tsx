"use client";

import React from 'react';
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
  User 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
  { icon: <LayoutDashboard size={20} />, label: "Overview", href: "/" },
  { icon: <ArrowUpRight size={20} />, label: "Online Deposit", href: "/deposit" },
  { icon: <ArrowDownLeft size={20} />, label: "Domestic Transfer", href: "/transfer" },
  { icon: <CreditCard size={20} />, label: "Virtual Card", href: "/cards" },
  { icon: <Briefcase size={20} />, label: "Loan & Mortgages", href: "/loans" },
  { icon: <History size={20} />, label: "Transaction Logs", href: "/logs" },
  { icon: <Download size={20} />, label: "Withdrawal", href: "/withdrawal" },
  { icon: <User size={20} />, label: "Account Manager", href: "/account" },
];

  return (
    <aside className="w-64 bg-[#0d1b2a] text-slate-300 flex flex-col hidden md:flex h-screen sticky top-0">
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
  );
}