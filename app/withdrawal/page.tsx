export default function WithdrawalPage() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-md">
      <h2 className="text-xl font-bold mb-1">Secure Withdrawal Gate</h2>
      <p className="text-slate-500 text-sm mb-6">Liquidate platform balances directly to verified off-ramp accounts.</p>
      <div className="space-y-4">
        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-500">
          <option>Select Withdrawal Method</option>
          <option>External Checking/Savings Account</option>
          <option>Fedwire Routing Address</option>
          <option>Crypto Settlement (USDC/USDT)</option>
        </select>
        <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-blue-500" placeholder="0.00" />
        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
          Confirm Processing Request
        </button>
      </div>
    </div>
  );
}