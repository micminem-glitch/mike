import React from 'react';

export default function TransferPage() {
  return (
    <div className="bg-[#0b132b] text-white p-6 rounded-2xl border border-slate-800 shadow-xl max-w-2xl w-full">
      <h2 className="text-xl font-bold mb-2">Domestic Transfer</h2>
      <p className="text-slate-400 text-sm mb-6">Send funds instantly to domestic bank accounts.</p>
      
      {/* Form Layout */}
      <form className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Recipient Account Number</label>
          <input 
            type="text" 
            className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-blue-500 text-white placeholder-slate-500" 
            placeholder="e.g. 1234567890" 
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Amount ($)</label>
          <input 
            type="number" 
            className="w-full bg-[#111a36] border border-slate-700/50 rounded-xl p-3 text-sm focus:outline-blue-500 text-white placeholder-slate-500" 
            placeholder="0.00" 
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-blue-600/10">
          Initiate Transfer
        </button>
      </form>
    </div>
  );
}