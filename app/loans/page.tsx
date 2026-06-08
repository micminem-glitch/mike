export default function LoansPage() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold mb-1">Loans & Mortgages</h2>
      <p className="text-slate-500 text-sm mb-6">Apply for institutional lending capital or manage your outstanding active balances.</p>
      <div className="p-8 border border-dashed border-slate-200 rounded-xl text-center bg-slate-50">
        <p className="text-slate-500 text-sm font-medium">You currently do not have any active loan protocols matching this profile layout.</p>
        <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
          Apply Now
        </button>
      </div>
    </div>
  );
}