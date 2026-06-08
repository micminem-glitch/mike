export default function AccountPage() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-2xl">
      <h2 className="text-xl font-bold mb-1">Account Relationship Manager</h2>
      <p className="text-slate-500 text-sm mb-6">Manage login privileges, update metadata values, and inspect active platform nodes.</p>
      <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">KS</div>
        <div>
          <h4 className="font-bold text-slate-800">Kwon Soon-hee</h4>
          <p className="text-xs text-red-500 font-mono">Last Auth Access Tracking Point: 94.59.104.73</p>
        </div>
      </div>
    </div>
  );
}