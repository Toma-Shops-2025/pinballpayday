import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Trophy, Medal, Star, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardScreen,
});

interface LeaderboardEntry {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  reward_points: number;
}

function LeaderboardScreen() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase
          .from("global_leaderboard")
          .select("*")
          .limit(50);

        if (data) setPlayers(data);
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans select-none flex flex-col">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,0%,#000,100%)] opacity-70 -z-10" />

      <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 flex items-center gap-4">
        <button onClick={() => navigate({ to: "/" })} className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-black uppercase italic tracking-tighter">Global <span className="text-primary">Hall of Fame</span></h1>
      </header>

      <main className="flex-1 px-4 overflow-y-auto pb-28">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        ) : (
            <div className="space-y-2">
                {players.map((player, index) => (
                    <div
                        key={player.id}
                        className={cn(
                            "bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between",
                            index === 0 && "bg-amber-500/10 border-amber-500/30",
                            index === 1 && "bg-slate-300/10 border-slate-300/30",
                            index === 2 && "bg-orange-700/10 border-orange-700/30"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="h-12 w-12 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                                    <img
                                        src={player.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.username}`}
                                        alt={player.username}
                                    />
                                </div>
                                {index < 3 && (
                                    <div className="absolute -top-1 -right-1">
                                        <Crown className={cn(
                                            "w-5 h-5 drop-shadow-md",
                                            index === 0 ? "text-amber-400" : index === 1 ? "text-slate-300" : "text-orange-600"
                                        )} />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-tight">
                                    {player.display_name || player.username || 'Anonymous'}
                                </h4>
                                <div className="flex items-center gap-1 opacity-50">
                                    <Medal className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">Rank #{index + 1}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Earnings</p>
                            <div className="flex items-center gap-1 justify-end mt-1">
                                <Star className="w-3 h-3 text-primary fill-current" />
                                <span className="text-lg font-black italic">{player.reward_points.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-6 right-6 h-20 bg-black/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 px-8 flex justify-between items-center shadow-2xl z-50">
            <button onClick={() => navigate({ to: "/" })} className="flex flex-col items-center gap-1.5 text-slate-500">
                <Crown className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter">EARN</span>
            </button>
            <div className="flex flex-col items-center gap-1.5 text-primary scale-110">
                <Trophy className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter">RANKS</span>
            </div>
      </nav>
    </div>
  );
}
