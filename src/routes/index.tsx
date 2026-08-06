import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trophy, Coins, Play, Star, Zap, Info, ShieldCheck, ArrowUpRight, Wallet, Gamepad2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: LootLagoonLobby,
});

const EARNING_PORTALS = [
  {
    id: "games",
    name: "GAME GALAXY",
    desc: "1,000+ Premium Games",
    color: "from-blue-600 to-cyan-900",
    accent: "text-cyan-400",
    icon: Gamepad2,
    bonus: "INSTANT"
  },
  {
    id: "gamepix",
    name: "MYSTIC ARCADE",
    desc: "Action & Adventure Hub",
    color: "from-purple-600 to-indigo-900",
    accent: "text-purple-400",
    icon: Play,
    bonus: "NEW"
  },
  {
    id: "video",
    name: "VIDEO VAULT",
    desc: "Watch Ads, Earn Fast",
    color: "from-red-600 to-rose-900",
    accent: "text-rose-400",
    icon: Zap,
    bonus: "UNLIMITED"
  },
  {
    id: "fortune",
    name: "DAILY FORTUNE",
    desc: "Instant Win Games",
    color: "from-amber-500 to-orange-900",
    accent: "text-amber-400",
    icon: Coins,
    bonus: "HOT"
  }
];

const GAMES = [
  { id: "1", name: "Neon Strike", emoji: "🚀" },
  { id: "2", name: "Cyber Dash", emoji: "💎" },
  { id: "3", name: "Galactic Quest", emoji: "👾" },
  { id: "4", name: "Retro Pulse", emoji: "🕹️" },
  { id: "5", name: "Pixel Jump", emoji: "🏃" },
  { id: "6", name: "Sonic Wave", emoji: "🌊" },
  { id: "7", name: "Star Blazer", emoji: "✨" },
  { id: "8", name: "Void Runner", emoji: "🌑" },
];

function LootLagoonLobby() {
  const navigate = useNavigate();
  const [points, setPoints] = useState(0);

  useEffect(() => {
    async function fetchPoints() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('reward_points').eq('id', user.id).maybeSingle();
            if (data) setPoints(Number(data.reward_points));
        }
    }
    fetchPoints();
  }, []);

  return (
    <div className="flex flex-col bg-[#020617] text-white font-sans select-none min-h-screen overflow-y-auto pb-32 no-scrollbar">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,0%,#020617,100%)] opacity-70 -z-10" />

      <div className="flex flex-col w-full max-w-lg mx-auto">
        <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#00d2ff] to-blue-600 p-0.5 shadow-[0_0_15px_rgba(0,210,255,0.3)]">
                <div className="h-full w-full bg-black rounded-[14px] flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" className="w-10 h-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Zap className="w-6 h-6 text-[#00d2ff] absolute" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none uppercase">Loot<span className="text-[#00d2ff] not-italic">Lagoon</span></h1>
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-bold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-[#00d2ff]" /> SECURE PAYOUTS
                </p>
              </div>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
              <Coins className="w-4 h-4 text-[#00d2ff]" />
              <span className="font-black text-lg tabular-nums tracking-tighter text-white italic">{points.toLocaleString()}</span>
          </div>
        </header>

        <main className="px-4 py-2 space-y-8">
          {/* Earning Section */}
          <section>
            <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#00d2ff]">Earning Zones</h3>
                <div className="h-px flex-1 mx-4 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                {EARNING_PORTALS.map((portal) => (
                    <button
                        key={portal.id}
                        onClick={() => navigate({ to: "/portal/$portalId", params: { portalId: portal.id } })}
                        className="relative h-28 rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-4 flex flex-col justify-between active:scale-95 transition-all group"
                    >
                        <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", portal.color)} />
                        <div className="flex justify-between items-start z-10">
                            <portal.icon className={cn("w-6 h-6", portal.accent)} />
                            <span className="text-[8px] font-black bg-white/10 px-2 py-0.5 rounded-full text-white/70">{portal.bonus}</span>
                        </div>
                        <div className="z-10">
                            <h4 className="text-sm font-black uppercase italic leading-none">{portal.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-1 font-bold">{portal.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
          </section>

          {/* Gaming Section */}
          <section>
            <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Gaming Arcade</h3>
                <div className="h-px flex-1 mx-4 bg-white/10" />
                <Gamepad2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="grid grid-cols-1 gap-2">
                {GAMES.map((game) => (
                    <button
                        key={game.id}
                        onClick={() => navigate({ to: "/game/$tableId", params: { tableId: game.id } })}
                        className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between active:bg-white/10 transition-colors group"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">{game.emoji}</span>
                            <span className="font-black uppercase italic text-sm tracking-tight">{game.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-primary">PLAY & EARN</span>
                            <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
                        </div>
                    </button>
                ))}
            </div>
          </section>
        </main>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 px-8 flex justify-between items-center shadow-2xl z-50">
            <button onClick={() => navigate({ to: "/" })} className="flex flex-col items-center gap-1.5 text-[#00d2ff] scale-110">
                <Zap className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter">EARN</span>
            </button>
            <button onClick={() => navigate({ to: "/leaderboard" })} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors">
                <Trophy className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">RANKS</span>
            </button>
            <button onClick={() => navigate({ to: "/cashout" })} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors">
                <Wallet className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">CASHOUT</span>
            </button>
            <button onClick={() => toast.info("Loot Lagoon v2.0 - Play & Earn!")} className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-white transition-colors">
                <Info className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">INFO</span>
            </button>
      </nav>
    </div>
  );
}
