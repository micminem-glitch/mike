"use client";

import "./globals.css";
import Sidebar from "./components/Sidebar";
import { usePathname } from "next/navigation";
import { Search, Bell, Settings } from "lucide-react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide internal dashboard panels on public/auth layouts
  const isPublicPage = pathname === "/" || pathname === "/login";

  return (
    <html lang="en">
      <body className="bg-slate-950 font-sans antialiased text-slate-200 min-h-screen">
        
        <div className="flex min-h-screen w-full relative">
          
          {/* Responsive Navigation Sidebar */}
          {!isPublicPage && <Sidebar />}

          {/* MAIN CONTAINER CONTENT FRAME */}
          <div className={`flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 w-full ${!isPublicPage ? 'pl-0 md:pl-64' : ''}`}>
            
            {!isPublicPage && (
              /* FIX: Switched background from 'bg-white' to a dark scheme 'bg-[#0d1b2a]' 
                with updated slate-700/40 border separators so it blends flawlessly.
              */
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

            {/* Application Main Content Body */}
            <main className={`p-4 sm:p-6 w-full mx-auto flex-1 bg-slate-950 min-h-screen ${!isPublicPage ? 'max-w-[1600px]' : ''}`}>
              {children}
            </main>
          </div>

        </div>
      </body>
    </html>
  );
}