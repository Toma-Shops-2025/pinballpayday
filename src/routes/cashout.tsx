import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Wallet, Landmark, Smartphone, Gift, ChevronRight, Lock, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/cashout")({
  component: CashoutScreen,
});

const REWARDS = [
    { id: 'v5', name: '$5 Visa Card', cost: 5.00, type: 'Visa' },
    { id: 'a5', name: '$5 Amazon Gift', cost: 5.00, type: 'Amazon' },
    { id: 'p5', name: '$5 PayPal Cash', cost: 5.00, type: 'PayPal' },
    { id: 'v10', name: '$10 Visa Card', cost: 10.00, type: 'Visa' },
    { id: 'a10', name: '$10 Amazon Gift', cost: 10.00, type: 'Amazon' },
    { id: 'p10', name: '$10 PayPal Cash', cost: 10.00, type: 'PayPal' },
    { id: 'v25', name: '$25 Visa Card', cost: 25.00, type: 'Visa' },
    { id: 'a25', name: '$25 Amazon Gift', cost: 25.00, type: 'Amazon' },
    { id: 'p25', name: '$25 PayPal Cash', cost: 25.00, type: 'PayPal' },
];

function CashoutScreen() {
  const navigate = useNavigate();
  const { user, profile, addCash, supabase, signOut } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const cashBalance = parseFloat(profile?.cash_balance || "0");

  const handlePayoutRequest = async (reward: any) => {
    if (isProcessing) return;
    if (cashBalance < reward.cost) {
        toast.error("Insufficient Balance", { description: `You need $${reward.cost.toFixed(2)} to redeem this.` });
        return;
    }

    setIsProcessing(true);
    try {
        const { error } = await supabase.from('payout_requests').insert({
            user_id: user?.id,
            reward_name: reward.name,
            points_cost: reward.cost * 1000, // Storing as points for consistency
            status: 'pending'
        });

        if (error) throw error;

        await addCash(-reward.cost);
        toast.success("Redemption Submitted!", {
            description: "Payouts are processed within 24-48 hours.",
        });
    } catch (e: any) {
        toast.error(e.message);
    } finally {
        setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans select-none flex flex-col">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,0%,#020617,100%)] opacity-70 -z-10" />

      <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 flex items-center gap-4">
        <button onClick={() => navigate({ to: "/" })} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">THE <span className="text-[#00d2ff]">TREASURE VAULT</span></h1>
      </header>

      <main className="flex-1 px-4 space-y-6 overflow-y-auto pb-32">
        <div className="bg-gradient-to-br from-slate-900 to-black border border-white/10 rounded-[2rem] p-8 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="w-24 h-24 rotate-12 text-[#00d2ff]" /></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 italic">Total Loot Balance</p>
            <p className="text-6xl font-black tracking-tighter text-white tabular-nums italic">${cashBalance.toFixed(2)}</p>
            <p className="text-[10px] text-[#00d2ff] font-bold mt-2 uppercase tracking-widest">Withdrawal Ready</p>
        </div>

        <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 italic">Select Reward</h3>
            {REWARDS.map((r) => {
                const isUnlocked = cashBalance >= r.cost;
                const Icon = r.type === 'PayPal' ? Wallet : CreditCard;
                const color = r.type === 'Amazon' ? "bg-orange-500" : r.type === 'PayPal' ? "bg-green-600" : "bg-blue-600";

                return (
                    <div
                        key={r.id}
                        className={cn(
                            "group bg-white/5 border border-white/5 rounded-3xl p-5 flex items-center justify-between transition-all",
                            isUnlocked ? "border-[#00d2ff]/30 bg-[#00d2ff]/5" : "opacity-40 grayscale"
                        )}
                    >
                        <div className="flex items-center gap-4 text-left">
                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg text-white", color)}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase italic">{r.name}</h4>
                                <p className="text-[10px] text-slate-500 font-bold uppercase">{isUnlocked ? "Ready to Claim" : `Unlock at $${r.cost.toFixed(2)}`}</p>
                            </div>
                        </div>

                        {isUnlocked ? (
                            <button
                                onClick={() => handlePayoutRequest(r)}
                                disabled={isProcessing}
                                className="bg-[#00d2ff] text-black text-[10px] font-black px-5 py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,210,255,0.4)] active:scale-95 transition-all italic"
                            >
                                {isProcessing ? "..." : "REDEEM"}
                            </button>
                        ) : (
                            <Lock className="w-4 h-4 text-white/20 mr-2" />
                        )}
                    </div>
                );
            })}
        </div>

        <div className="flex flex-col items-center gap-4 pt-8 pb-10">
            <button
                onClick={signOut}
                className="text-white/20 text-[10px] font-black uppercase tracking-widest underline italic"
            >
                Abandon Ship (Logout)
            </button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-12 z-[5000]">
            <button onClick={() => navigate({ to: "/" })} className="flex flex-col items-center gap-1.5 text-white/40">
                <Gift className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Earn</span>
            </button>
            <button onClick={() => navigate({ to: "/leaderboard" })} className="flex flex-col items-center gap-1.5 text-white/40">
                <Trophy className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Ranks</span>
            </button>
            <button className="flex flex-col items-center gap-1.5 text-[#00d2ff] scale-110">
                <Wallet className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Wins</span>
            </button>
            <button onClick={() => toast.info("Loot Lagoon v2.1")} className="flex flex-col items-center gap-1.5 text-white/40">
                <Info className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Info</span>
            </button>
      </nav>
    </div>
  );
}
