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
      {/* Removed the raw "flex" layout class from the body tag so it doesn't break document item flow */}
      <body className="bg-slate-100 font-sans antialiased text-slate-800 min-h-screen">
        
        <div className="flex min-h-screen w-full relative">
          
          {/* Sidebar will sit statically on desktop, and absolutely overlay on mobile without breaking content width */}
          {!isPublicPage && <Sidebar />}

          {/* MAIN CONTAINER FRAME:
            - pl-0 on mobile so everything fills up 100% of the screen space.
            - md:pl-64 on desktop screens so it drops perfectly into position alongside the sidebar space.
          */}
          <div className={`flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 w-full ${!isPublicPage ? 'pl-0 md:pl-64' : ''}`}>
            
            {!isPublicPage && (
              /* Adjusted header padding (pl-16 md:px-6) so the mobile hamburger icon fits cleanly */
              <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between pl-16 pr-6 md:px-6 z-10 sticky top-0">
                <div className="flex items-center gap-4 bg-slate-100 px-3 py-1.5 rounded-md w-40 sm:w-72">
                  <Search size={18} className="text-slate-400" />
                  <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full" />
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Bell size={20} /></button>
                  <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"><Settings size={20} /></button>
                </div>
              </header>
            )}

            {/* If it's a public page, make it span the whole viewport beautifully */}
            <main className={`p-4 sm:p-6 w-full mx-auto flex-1 bg-black min-h-screen ${!isPublicPage ? 'max-w-[1600px]' : ''}`}>
              {children}
            </main>
          </div>

        </div>
      </body>
    </html>
  );
}