export default function CardsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Virtual Cards</h2>
        <p className="text-slate-500 text-sm">Manage your active cards and secure web-spending limitations.</p>
      </div>
      {/* Visual Credit Card */}
      <div className="w-80 h-48 bg-gradient-to-tr from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative border border-white/10 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] uppercase text-purple-300 tracking-widest font-medium">Hexafox Platinum</p>
            <p className="text-sm font-semibold mt-1">Kwon Soon-hee</p>
          </div>
          <div className="w-8 h-6 bg-amber-400/30 rounded border border-amber-400/20" />
        </div>
        <div>
          <p className="font-mono text-lg tracking-wider">••••  ••••  ••••  4821</p>
          <div className="flex gap-4 mt-2 text-xs text-slate-400 font-mono">
            <span>EXP: 12/29</span>
            <span>CVV: •••</span>
          </div>
        </div>
      </div>
    </div>
  );
}