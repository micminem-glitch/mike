import React from 'react';

export default function Dashboard() {
  const accountInfo = {
    name: "Kwon Soon-hee",
    balance: "2,000,000.00",
    pending: "0.00",
    myLoan: "0",
    accountLimit: "2000000",
    recentTransaction: "2000000",
    lastLoginIp: "94.59.104.73",
    lastLoginDate: "2026-05-11 14:48:07"
  };

  const chartData = [60, 40, 70, 50, 90, 30, 80];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      
      {/* LEFT COLUMN: HERO BALANCE CARD & DETAILS */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* MAIN CARD */}
        <div className="bg-gradient-to-b from-blue-600 to-blue-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                KS
              </div>
              <div>
                <h2 className="font-semibold text-lg">{accountInfo.name}</h2>
                <span className="text-xs text-blue-200">Savings</span>
              </div>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 text-xl font-bold">+</button>
          </div>

          <div className="my-6">
            <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Balance</p>
            <p className="text-4xl font-bold">${accountInfo.balance}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 bg-black/10 p-3 rounded-xl border border-white/10">
            <div>
              <label className="text-xs text-blue-200 flex items-center gap-1">Pending ▾</label>
              <p className="text-lg font-semibold">${accountInfo.pending}</p>
            </div>
            <div className="border-l border-white/10 pl-4">
              <label className="text-xs text-red-300">My Loan</label>
              <p className="text-lg font-semibold text-red-300">${accountInfo.myLoan}</p>
            </div>
          </div>
        </div>

        {/* METRICS & STATUS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-center">
            <span className="bg-[#2ec4b6] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
              Active
            </span>
          </div>

          <div className="space-y-3 text-sm pt-2">
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-slate-500">Account Limit</span>
              <span className="font-semibold text-slate-700">${accountInfo.accountLimit}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-slate-500">Recent Transaction</span>
              <span className="font-semibold text-slate-700">${accountInfo.recentTransaction}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
              <span className="text-slate-500">Last Login IP</span>
              <span className="font-mono text-red-500 font-semibold">{accountInfo.lastLoginIp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last Login Date</span>
              <span className="text-red-400 font-medium">{accountInfo.lastLoginDate}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-colors">
              Domestic Transfer
            </button>
            <button className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold py-2.5 px-4 rounded-xl text-center text-sm transition-colors">
              Wire Transfer
            </button>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: STATS CHART & SUMMARY */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* DAILY STATS CARD */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Daily Stats</h3>
              <p className="text-xs text-blue-600 hover:underline cursor-pointer font-medium mt-0.5">Go to Transaction for details.</p>
            </div>
            <div className="text-slate-400 font-bold text-xl cursor-pointer hover:text-slate-600">···</div>
          </div>

          {/* Simple Mock Bar Chart */}
          <div className="h-48 flex items-end justify-between gap-3 px-4 pt-4 border-b border-slate-100">
            {chartData.map((height, idx) => (
              <div key={idx} className="w-full flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-slate-300 rounded-t-md transition-all duration-300 group-hover:bg-blue-600" 
                  style={{ height: `${height}%` }}
                />
                <span className="w-full h-1.5 bg-orange-400 rounded-full opacity-60"></span>
              </div>
            ))}
          </div>
        </div>

        {/* SUMMARY PILLS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Summary</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-purple-600 flex items-center gap-1">🟣 Limit</span>
                <span>$</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[85%]"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-teal-600 flex items-center gap-1">🟢 Loan Balance</span>
                <span>$0</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-teal-500 h-full w-0"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-orange-500 flex items-center gap-1">🟠 Expenses</span>
                <span>$</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full w-[40%]"></div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}