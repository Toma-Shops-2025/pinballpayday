import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Loader2, Coins, Gift, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showInterstitial, showRewardedAd } from "@/lib/ads";
import { toast } from "sonner";

export const Route = createFileRoute("/game/$tableId")({
  component: GameContainer,
});

function GameContainer() {
  const { tableId } = useParams({ from: "/game/$tableId" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setScore] = useState(0);
  const [reward, setReward] = useState(0);
  const [doubled, setDoubled] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Logic to handle score from high-end licensed games
      if (event.data && (event.data.type === "GAME_OVER" || event.data.score !== undefined)) {
        const scoreValue = event.data.score || event.data.value || 0;
        if (scoreValue > 0) processGameOver(scoreValue);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const processGameOver = async (score: number) => {
    setScore(score);
    setGameOver(true);

    // Premium Math: 10,000 pts = 1 point ($0.01)
    const points = Math.floor(score / 10000);

    try {
      const { data } = await supabase.rpc("claim_game_reward", {
        p_game: `pinball_${tableId}`,
        p_score: score,
        p_reward_est: points
      });
      setReward(data?.[0]?.reward_points || points);
      showInterstitial();
    } catch (e) {
      setReward(points);
    }
  };

  const handleDouble = async () => {
    const res = await showRewardedAd();
    if (res.success) {
      await supabase.rpc("award_points", { p_points: reward, p_source: "pinball_double" });
      setDoubled(true);
      toast.success("REWARD DOUBLED!");
    }
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
      {/* High-End Game Frame */}
      {!gameOver && (
        <>
          <iframe
            src={`/games/${tableId}/index.html`}
            className="w-full h-full border-none"
            style={{ height: '100vh', width: '100vw' }}
            onLoad={() => setLoading(false)}
          />
          {/* Subtle Back Button overlaying the game */}
          <button
            onClick={() => navigate({ to: "/" })}
            className="absolute top-10 left-6 h-12 w-12 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 flex items-center justify-center z-50 active:scale-90 transition-transform"
          >
            <ArrowLeft className="text-white/70 w-6 h-6" />
          </button>
        </>
      )}

      {loading && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white z-40">
            <div className="relative">
                <Loader2 className="h-16 w-12 animate-spin text-primary" />
                <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
            </div>
            <p className="mt-6 font-black italic uppercase tracking-[0.3em] text-sm animate-pulse">Initializing Table...</p>
        </div>
      )}

      {/* Pro Game Over Screen - Styled like Pinball Deluxe */}
      {gameOver && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6 text-white text-center">
            <div className="space-y-8 w-full max-w-md animate-in fade-in zoom-in duration-300">
                <div className="space-y-2">
                    <h2 className="text-6xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                        FINISH!
                    </h2>
                    <p className="text-primary font-bold tracking-[.5em] uppercase text-xs">Table Session Ended</p>
                </div>

                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-slate-900 border border-white/10 rounded-[2rem] p-10 shadow-2xl">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Grand Total Score</p>
                        <p className="text-7xl font-black tabular-nums tracking-tighter text-white">
                            {finalScore.toLocaleString()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5 flex flex-col items-center gap-1">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Earnings</p>
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-emerald-400" />
                            <span className="text-2xl font-black">+{reward}</span>
                        </div>
                    </div>
                    <button className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col items-center gap-1 active:bg-white/10 transition-colors">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Share Result</p>
                        <Share2 className="w-5 h-5 text-white" />
                    </button>
                </div>

                {!doubled && reward > 0 && (
                    <button
                        onClick={handleDouble}
                        className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-black py-5 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-[0_0_30px_-5px_rgba(245,158,11,0.5)] active:scale-95 transition-all"
                    >
                        <Gift className="w-6 h-6 fill-current" />
                        DOUBLE YOUR PAYDAY (AD)
                    </button>
                )}

                <div className="flex flex-col gap-4 pt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-colors"
                    >
                        New Ball
                    </button>
                    <button
                        onClick={() => navigate({ to: "/" })}
                        className="text-slate-500 font-bold uppercase text-[10px] tracking-[.3em] hover:text-white transition-colors"
                    >
                        Return to Arcade
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
