import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Trophy, Coins, Play, Star, Zap, Info, ShieldCheck, ArrowUpRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { showInterstitial } from "@/lib/ads";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: PinballPortalLobby,
});

const EARNING_PORTALS = [
  {
    id: "lootably",
    name: "LOOT DECK",
    desc: "Complete tasks and watch videos",
    image: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&q=80&w=500",
    color: "from-blue-600/80 to-blue-900/90",
    accent: "text-amber-400",
    bonus: "+20%",
    status: "active"
  },
  {
    id: "revlum",
    name: "CAPTAIN'S BOUNTY",
    desc: "High-paying surveys & offers",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=500",
    color: "from-orange-700/80 to-amber-900/90",
    accent: "text-orange-400",
    bonus: "HOT",
    status: "active"
  },
  {
    id: "adgem",
    name: "GOLDEN GALLEON",
    desc: "Play games and earn doubloons",
    image: "https://images.unsplash.com/photo-1585671175111-94943f721511?auto=format&fit=crop&q=80&w=500",
    color: "from-emerald-700/80 to-green-950/90",
    accent: "text-green-400",
    bonus: "NEW",
    status: "active"
  },
  {
    id: "bitlabs",
    name: "TREASURE VAULT",
    desc: "Quick rewards and multipliers",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=500",
    color: "from-slate-700/80 to-stone-900/90",
    accent: "text-emerald-400",
    bonus: "INSTANT",
    status: "active"
  }
];

function PinballPortalLobby() {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    async function fetchPoints() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('reward_points').eq('id', user.id).single();
            if (data) setPoints(data.reward_points);
        }
    }
    fetchPoints();
  }, []);

  return (
    <div className="flex flex-col bg-black text-white font-sans select-none min-h-screen overflow-y-auto pb-32">
      {/* Dynamic Background */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,0%,#000,100%)] opacity-70 -z-10" />

      <div className="flex flex-col w-full max-w-lg mx-auto">
        {/* Top Header */}
        <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 p-0.5 shadow-glow">
                <div className="h-full w-full bg-black rounded-[14px] flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" className="w-10 h-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Zap className="w-6 h-6 text-primary absolute" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none">LOOT<span className="text-primary not-italic tracking-normal">LAGOON</span></h1>
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-bold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-primary" /> SECURE PAYOUTS
                </p>
              </div>
          </div>

          <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-black text-lg tabular-nums tracking-tighter text-white italic">{points.toLocaleString()}</span>
              </div>
          </div>
        </header>

        {/* Featured Banner */}
        <div className="px-4 mb-4">
            <div className="relative h-44 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
                <img
                    src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800"
                    className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-1000 opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 p-8">
                    <span className="text-[10px] font-black bg-primary text-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">Special Event</span>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Double Loot<br/>Weekend</h2>
                </div>
            </div>
        </div>

        {/* Earning Zones Grid */}
        <main className="px-4 py-2 mb-28 space-y-6">
          <div className="flex items-center justify-between px-2 text-slate-500">
              <h3 className="text-xs font-black uppercase tracking-widest">Select Earning Zone</h3>
              <div className="h-px flex-1 mx-4 bg-white/10" />
              <Zap className="w-4 h-4" />
          </div>

          <div className="grid grid-cols-1 gap-4">
              {EARNING_PORTALS.map((portal) => (
                  <button
                      key={portal.id}
                      onClick={() => navigate({ to: "/portal/$portalId", params: { portalId: portal.id } })}
                      className="group relative h-36 rounded-[2rem] overflow-hidden border border-white/10 transition-all active:scale-95 duration-200 shadow-2xl text-left flex"
                  >
                      {/* Left: Content */}
                      <div className="flex-1 p-6 z-10 flex flex-col justify-between relative overflow-hidden">
                         <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-r", portal.color)} />
                         <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border border-white/10", portal.accent)}>
                                    {portal.bonus}
                                </span>
                            </div>
                            <h4 className="text-2xl font-black uppercase italic text-white leading-none">
                                {portal.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                {portal.desc}
                            </p>
                         </div>
                         <div className="flex items-center gap-1 text-primary text-[10px] font-black uppercase tracking-widest">
                            Enter Zone <ArrowUpRight className="w-3 h-3" />
                         </div>
                      </div>

                      {/* Right: Image */}
                      <div className="w-1/3 relative h-full">
                        <img
                            src={portal.image}
                            className="absolute inset-0 w-full h-full object-cover grayscale-[40%] group-hover:grayscale-0 transition-all duration-500"
                            alt={portal.name}
                        />
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black" />
                      </div>
                  </button>
              ))}
          </div>

          {/* Quick Stats Ticker */}
          <div className="mx-2 bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Trophy className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Recent Winner</p>
                        <p className="text-xs font-black text-white">PirateKing42 — +5,000 Pts</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total Paid</p>
                    <p className="text-xs font-black text-primary">$1,240.50</p>
                </div>
          </div>
        </main>
      </div>

      {/* Elegant Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 px-8 flex justify-between items-center shadow-2xl z-50">
            <div className="flex flex-col items-center gap-1.5 text-primary scale-110">
                <Zap className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter">EARN</span>
            </div>
            <button
                onClick={() => navigate({ to: "/leaderboard" })}
                className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
            >
                <Trophy className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">RANKS</span>
            </button>
            <button
                onClick={() => navigate({ to: "/cashout" })}
                className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
            >
                <Wallet className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">CASHOUT</span>
            </button>
            <button
                onClick={() => toast.info("Loot Lagoon v2.0 - Earn rewards by playing games and completing offers!")}
                className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors"
            >
                <Info className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">INFO</span>
            </button>
      </nav>
    </div>
  );
}
