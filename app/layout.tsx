"use client";

import "./globals.css";
import Sidebar from "./components/Sidebar";
import { usePathname } from "next/navigation";
import { Search, Bell, Settings } from "lucide-react";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // FIXED: Added "/register" to the exclusion list so it renders completely full-screen
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";
  const showDashboardLayout = !isPublicPage;

  return (
    <html lang="en">
      <body className="bg-slate-950 font-sans antialiased text-slate-200 min-h-screen">
        
        {/* Outer container centers and scales panels naturally */}
        <div className="flex min-h-screen w-full relative bg-slate-950">
          
          {/* 1. Sidebar renders side-by-side with main views if not a public page */}
          {showDashboardLayout && <Sidebar />}

          {/* 2. Main content block fills the rest of the available screen space */}
          <div className="flex-1 flex flex-col min-h-screen min-w-0 w-full">
            
            {/* 3. Top Navbar — Visible on dashboard paths, hidden on login/register */}
            {showDashboardLayout && (
              <header className="h-16 bg-[#0d1b2a] border-b border-slate-700/40 flex items-center justify-between px-6 z-10 sticky top-0">
                <div className="flex items-center gap-4 bg-slate-900/60 px-3 py-1.5 rounded-xl w-40 sm:w-72 border border-slate-800">
                  <Search size={18} className="text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    className="bg-transparent border-none outline-none text-sm w-full text-slate-200 placeholder-slate-500" 
                  />
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
                    <Bell size={20} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-all">
                    <Settings size={20} />
                  </button>
                </div>
              </header>
            )}

            {/* 4. Display Page Content injection target */}
            <main className="w-full flex-1 bg-slate-950">
              {children}
            </main>
          </div>

        </div>
      </body>
    </html>
  );
}