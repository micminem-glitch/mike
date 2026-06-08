import "./globals.css";
import Sidebar from "./components/Sidebar";
import { Search, Bell, Settings } from "lucide-react";

export const metadata = {
  title: "Hexafox United Trust",
  description: "Fintech Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-100 font-sans antialiased text-slate-800 flex min-h-screen">
        
        {/* Persistent Sidebar across all pages */}
        <Sidebar />

        {/* Main Window */}
        <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
          
          {/* Persistent Header across all pages */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0">
            <div className="flex items-center gap-4 bg-slate-100 px-3 py-1.5 rounded-md w-72">
              <Search size={18} className="text-slate-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full" />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <Settings size={20} />
              </button>
            </div>
          </header>

          {/* Dynamic Page Content goes here */}
          <main className="p-6 max-w-[1600px] w-full mx-auto flex-1">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}