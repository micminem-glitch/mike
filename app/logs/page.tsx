export default function LogsPage() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold mb-1">Transaction History Logs</h2>
      <p className="text-slate-500 text-sm mb-6">Real-time audit log of domestic and wire funds routing events.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="p-3 rounded-l-lg">ID Reference</th>
              <th className="p-3">Type</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3 rounded-r-lg">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="p-3 font-mono text-xs">TRX-948102</td>
              <td className="p-3 font-medium text-slate-800">System Genesis Credit</td>
              <td className="p-3 font-semibold text-emerald-600">+$2,000,000.00</td>
              <td className="p-3"><span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Settled</span></td>
              <td className="p-3 text-xs text-slate-400">2026-05-11 14:48:07</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}