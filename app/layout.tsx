"use client";

import "./globals.css";
import Sidebar from "./components/Sidebar";
import { usePathname } from "next/navigation";
import { Search, Bell, Settings } from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 1. Identify public or administrative routes where the default user sidebar SHOULD NOT render
  const isPublicPage = pathname === "/" || pathname === "/login";
  const isAdminPage = pathname.startsWith("/admin");
  
  // 2. Only activate dashboard structures if it's an authentic user dashboard subroute
  const showUserSidebar = !isPublicPage && !isAdminPage;

  return (
    <html lang="en">
      <body className="bg-slate-950 font-sans antialiased text-slate-200 min-h-screen">
        
        <div className="flex min-h-screen w-full relative">
          
          {/* Render the user sidebar only when authorized */}
          {showUserSidebar && <Sidebar />}

          {/* MAIN CONTAINER CONTENT FRAME
            FIX: The padding `md:pl-64` now completely collapses to `pl-0` 
            whenever `showUserSidebar` is false. No more random black spaces!
          */}
          <div className={`flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 w-full ${showUserSidebar ? 'pl-0 md:pl-64' : 'pl-0'}`}>
            
            {/* Main Header navigation element — only shows on regular user dashboard pages */}
            {showUserSidebar && (
              <header className="h-16 bg-[#0d1b2a] border-b border-slate-700/40 flex items-center justify-between pl-16 pr-6 md:px-6 z-10 sticky top-0">
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

            {/* Application Main Content Body Container */}
            <main className="w-full mx-auto flex-1 bg-slate-950 min-h-screen">
              {children}
            </main>
          </div>

        </div>
      </body>
    </html>
  );
}