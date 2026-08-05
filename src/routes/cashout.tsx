import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Wallet, Landmark, Smartphone, Gift, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cashout")({
  component: CashoutScreen,
});

const CASHOUT_OPTIONS = [
  { id: "paypal", name: "PayPal Transfer", icon: Wallet, color: "text-blue-500", min: "5,000", desc: "Sent to your email" },
  { id: "bank", name: "Bank Transfer", icon: Landmark, color: "text-emerald-500", min: "10,000", desc: "Direct to account" },
  { id: "mobile", name: "Mobile Top-up", icon: Smartphone, color: "text-purple-500", min: "2,000", desc: "Instant airtime" },
  { id: "gift", name: "Amazon Gift Card", icon: Gift, color: "text-orange-500", min: "5,000", desc: "Digital code" },
];

function CashoutScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,0%,#000,100%)] opacity-70 -z-10" />

      <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 flex items-center gap-4">
        <button onClick={() => navigate({ to: "/" })} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">Withdraw <span className="text-primary">Loot</span></h1>
      </header>

      <main className="px-4 space-y-6">
        <div className="bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-24 h-24 rotate-12" /></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Available for Payout</p>
            <p className="text-5xl font-black tracking-tighter text-white tabular-nums">450</p>
            <p className="text-xs text-primary font-bold mt-2">$0.45 USD</p>
        </div>

        <div className="space-y-3 pb-24">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Choose Method</h3>
            {CASHOUT_OPTIONS.map((method) => (
                <button
                    key={method.id}
                    className="w-full group bg-white/5 border border-white/5 rounded-3xl p-5 flex items-center justify-between active:scale-95 transition-all"
                >
                    <div className="flex items-center gap-4 text-left">
                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                            <method.icon className={cn("w-6 h-6", method.color)} />
                        </div>
                        <div>
                            <h4 className="font-black text-sm uppercase italic">{method.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold">{method.desc}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Min.</p>
                        <p className="text-xs font-black text-white italic">{method.min} Pts</p>
                    </div>
                </button>
            ))}
        </div>
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 px-8 flex justify-between items-center shadow-2xl z-50">
            <button onClick={() => navigate({ to: "/" })} className="flex flex-col items-center gap-1.5 text-slate-500">
                <Gift className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">EARN</span>
            </button>
            <div className="flex flex-col items-center gap-1.5 text-primary scale-110">
                <Wallet className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter">CASHOUT</span>
            </div>
      </nav>
    </div>
  );
}
