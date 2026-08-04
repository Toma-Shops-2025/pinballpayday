import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=500",
    color: "from-blue-600/80 to-blue-900/90",
    accent: "text-amber-400",
    minBounty: "1,000",
    status: "active"
  },
  {
    id: "western",
    name: "Wild West",
    theme: "Old West Outlaw",
    image: "https://images.unsplash.com/photo-1533134486753-c81769482274?auto=format&fit=crop&q=80&w=500",
    color: "from-orange-700/80 to-amber-900/90",
    accent: "text-orange-400",
    minBounty: "1,200",
    status: "active"
  },
  {
    id: "space",
    name: "Asteroid",
    theme: "Deep Space",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=500",
    color: "from-purple-800/80 to-slate-950/90",
    accent: "text-fuchsia-400",
    minBounty: "1,500",
    status: "active"
  },
  {
    id: "soccer",
    name: "Golden Goal",
    theme: "Stadium Stars",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=500",
    color: "from-emerald-700/80 to-green-950/90",
    accent: "text-green-400",
    minBounty: "1,100",
    status: "active"
  },
  {
    id: "carnival",
    name: "Fun House",
    theme: "Classic Carnival",
    image: "https://images.unsplash.com/photo-1513885045260-6b3586f24c17?auto=format&fit=crop&q=80&w=500",
    color: "from-red-600/80 to-orange-600/90",
    accent: "text-yellow-300",
    minBounty: "800",
    status: "active"
  },
  {
    id: "cyber",
    name: "Neon City",
    theme: "Cyber Punk",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=500",
    color: "from-cyan-600/80 to-blue-950/90",
    accent: "text-pink-500",
    minBounty: "2,000",
    status: "active"
  },
  {
    id: "volcano",
    name: "Magma Peak",
    theme: "Lava Hazard",
    image: "https://images.unsplash.com/photo-1580436541340-36b1d40d9c60?auto=format&fit=crop&q=80&w=500",
    color: "from-red-900/80 to-black/90",
    accent: "text-orange-600",
    minBounty: "2,500",
    status: "active"
  },
  {
    id: "jewel",
    name: "Diamond Mine",
    theme: "Treasure Vault",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=500",
    color: "from-slate-700/80 to-stone-900/90",
    accent: "text-emerald-400",
    minBounty: "1,100",
    status: "active"
  }
];

function PinballLobby() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-black text-white font-sans select-none min-h-screen overflow-y-auto">
      {/* Dynamic Background Blur */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b,0%,#000,100%)] opacity-50 -z-10" />

      <div className="flex flex-col w-full max-w-lg mx-auto">
        {/* Top Header */}
        <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 flex justify-between items-center z-20">
          <div>
              <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-lg leading-none">PINBALL<span className="text-primary not-italic">PAYDAY</span></h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mt-1">Arcade Edition v1.0</p>
          </div>

          <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-inner">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="font-black text-lg tabular-nums">450</span>
              </div>
          </div>
        </header>

        {/* Tables Grid */}
        <main className="px-4 py-4 mb-28">
          <div className="flex items-center justify-between mb-6 px-2 text-slate-500">
              <h3 className="text-xs font-black uppercase tracking-widest">Available Tables</h3>
              <div className="h-px flex-1 mx-4 bg-white/10" />
              <Trophy className="w-4 h-4" />
          </div>

          <div className="grid grid-cols-2 gap-4">
              {PINBALL_TABLES.map((table) => (
                  <button
                      key={table.id}
                      onClick={() => {
                          console.log("Navigating to:", table.id);
                          navigate({ to: "/game/$tableId", params: { tableId: table.id } });
                      }}
                      className={cn(
                          "group relative aspect-[3/4] rounded-[2.5rem] overflow-hidden border-2 transition-all active:scale-95 duration-200 shadow-2xl text-left",
                          table.status === 'active' ? "border-white/5 bg-slate-900 cursor-pointer" : "border-transparent opacity-40 grayscale pointer-events-none"
                      )}
                  >
                      {/* Game Image */}
                      <img
                          src={table.image}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 pointer-events-none"
                          alt={table.name}
                      />

                      {/* Themed Gradient Overlay */}
                      <div className={cn("absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none", table.color)} />

                      {/* Content */}
                      <div className="absolute inset-x-0 bottom-0 p-5 flex flex-col gap-1 pointer-events-none">
                          <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", table.accent)}>
                              {table.theme}
                          </p>
                          <h4 className="text-2xl font-black leading-none uppercase italic text-white drop-shadow-md">
                              {table.name}
                          </h4>

                          <div className="mt-3 flex items-center justify-between">
                              <div className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                  <span className="text-[10px] font-bold text-white">x2.5</span>
                              </div>
                              <div className="flex items-center justify-center bg-white text-black h-10 w-10 rounded-full shadow-lg transition-colors">
                                  <Play className="w-5 h-5 fill-current ml-0.5" />
                              </div>
                          </div>
                      </div>

                      {table.status === 'locked' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                              <Lock className="w-8 h-8 text-white/40" />
                          </div>
                      )}
                  </button>
              ))}
          </div>
        </main>
      </div>

      {/* Elegant Bottom Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 px-8 flex justify-between items-center shadow-2xl z-50">
            <div className="flex flex-col items-center gap-1.5 text-primary scale-110">
                <Zap className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter">ARCADE</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
                <Trophy className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">RANKS</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
                <Star className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">WALLET</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-slate-500">
                <Info className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">INFO</span>
            </div>
      </nav>
    </div>
  );
}
