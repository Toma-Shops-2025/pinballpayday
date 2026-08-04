import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trophy, Coins, Play, Star, Zap, Info, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: PinballLobby,
});

const PINBALL_TABLES = [
  {
    id: "pirate",
    name: "Fair Wind",
    theme: "Pirate Adventure",
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=400&auto=format&fit=crop",
    color: "from-blue-600 to-blue-900",
    accent: "text-amber-400",
    minBounty: "1,000",
    status: "active"
  },
  {
    id: "western",
    name: "Wild West",
    theme: "Old West Outlaw",
    image: "https://images.unsplash.com/photo-1533134486753-c81769482274?q=80&w=400&auto=format&fit=crop",
    color: "from-orange-700 to-amber-900",
    accent: "text-orange-400",
    minBounty: "1,200",
    status: "active"
  },
  {
    id: "space",
    name: "Asteroid Mining",
    theme: "Deep Space",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400&auto=format&fit=crop",
    color: "from-purple-800 to-slate-950",
    accent: "text-fuchsia-400",
    minBounty: "1,500",
    status: "active"
  },
  {
    id: "soccer",
    name: "Golden Goal",
    theme: "Stadium Stars",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=400&auto=format&fit=crop",
    color: "from-emerald-700 to-green-950",
    accent: "text-green-400",
    minBounty: "1,100",
    status: "active"
  },
  {
    id: "carnival",
    name: "Fun House",
    theme: "Classic Carnival",
    image: "https://images.unsplash.com/photo-1513885045260-6b3586f24c17?q=80&w=400&auto=format&fit=crop",
    color: "from-red-600 to-orange-600",
    accent: "text-yellow-300",
    minBounty: "800",
    status: "active"
  },
  {
    id: "cyber",
    name: "Neon City",
    theme: "Cyber Punk 2077",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop",
    color: "from-cyan-600 to-blue-950",
    accent: "text-pink-500",
    minBounty: "2,000",
    status: "active"
  },
  {
    id: "volcano",
    name: "Magma Peak",
    theme: "Lava Hazard",
    image: "https://images.unsplash.com/photo-1580436541340-36b1d40d9c60?q=80&w=400&auto=format&fit=crop",
    color: "from-red-900 to-black",
    accent: "text-orange-600",
    minBounty: "2,500",
    status: "active"
  },
  {
    id: "jewel",
    name: "Diamond Mine",
    theme: "Treasure Vault",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop",
    color: "from-slate-700 to-stone-900",
    accent: "text-emerald-400",
    minBounty: "1,100",
    status: "active"
  }
];

function PinballLobby() {
  const [balance] = useState(450); // Mock balance

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      {/* Top Header */}
      <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 flex justify-between items-center bg-gradient-to-b from-slate-900 to-transparent">
        <div>
            <h1 className="text-2xl font-black italic tracking-tighter">PINBALL<span className="text-primary not-italic">PAYDAY</span></h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Arcade Edition v1.0</p>
        </div>

        <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
                <Coins className="w-4 h-4 text-primary" />
                <span className="font-black tabular-nums">{balance}</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
            </div>
        </div>
      </header>

      {/* Featured Banner */}
      <div className="px-4 mb-8">
        <div className="relative h-44 rounded-[2rem] overflow-hidden group">
            <img
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt="Featured"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="bg-red-600 text-[10px] font-black px-2 py-0.5 rounded uppercase animate-pulse">Live Tournament</span>
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Grand Prix 2026</h2>
                    <p className="text-xs text-slate-300">Win up to $50.00 in the next 2 hours!</p>
                </div>
                <button className="bg-white text-black h-12 w-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
                    <Play className="w-5 h-5 fill-current ml-1" />
                </button>
            </div>
        </div>
      </div>

      {/* Tables Grid */}
      <main className="flex-1 px-4 pb-12 overflow-y-auto">
        <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Select Machine</h3>
            <span className="text-[10px] text-slate-600 font-bold uppercase">8 Tables Available</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
            {PINBALL_TABLES.map((table) => (
                <Link
                    key={table.id}
                    to="/game/$tableId"
                    params={{ tableId: table.id }}
                    disabled={table.status !== 'active'}
                    className={cn(
                        "relative aspect-[4/5] rounded-3xl overflow-hidden border transition-all active:scale-95 block",
                        table.status === 'active' ? "border-white/10 hover:border-primary/50 cursor-pointer shadow-xl" : "border-white/5 opacity-60 grayscale cursor-not-allowed"
                    )}
                >
                    <img src={table.image} className="absolute inset-0 w-full h-full object-cover" alt={table.name} />
                    <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent")} />

                    {table.status === 'locked' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-20">
                            <div className="bg-black/80 p-3 rounded-full border border-white/20">
                                <Lock className="w-5 h-5 text-slate-400" />
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 z-10">
                        <p className={cn("text-[10px] font-black uppercase tracking-tighter mb-0.5", table.accent)}>{table.theme}</p>
                        <h4 className="text-xl font-black leading-tight uppercase italic">{table.name}</h4>
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                <span className="text-[10px] font-bold">x2.5</span>
                            </div>
                            <span className="text-[10px] font-black bg-black/60 px-2 py-1 rounded-md border border-white/10 italic">
                                {table.minBounty}
                            </span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </main>

      {/* Bottom Bar Mock */}
      <footer className="h-20 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl px-8 flex justify-between items-center">
            <div className="flex flex-col items-center gap-1 text-primary">
                <Zap className="w-6 h-6 fill-current" />
                <span className="text-[9px] font-bold uppercase">Play</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-500">
                <Star className="w-6 h-6" />
                <span className="text-[9px] font-bold uppercase">Earn</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-500">
                <Trophy className="w-6 h-6" />
                <span className="text-[9px] font-bold uppercase">Ranks</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-500">
                <Info className="w-6 h-6" />
                <span className="text-[9px] font-bold uppercase">Help</span>
            </div>
      </footer>
    </div>
  );
}
