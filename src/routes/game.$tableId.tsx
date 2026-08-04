import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Loader2, Trophy, Coins, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showInterstitial, showRewardedAd } from "@/lib/ads";
import { toast } from "sonner";

export const Route = createFileRoute("/game/$tableId")({
  component: GameContainer,
});

function GameContainer() {
  const { tableId } = useParams({ from: "/game/$tableId" });
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setScore] = useState(0);
  const [reward, setReward] = useState(0);
  const [doubled, setDoubled] = useState(false);

  // This is the "Bridge" that listens for scores from the professional games
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Professional HTML5 games usually send messages like this:
      // { type: "GAME_OVER", score: 50000 }
      if (event.data && event.data.type === "GAME_OVER") {
        processGameOver(event.data.score);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const processGameOver = async (score: number) => {
    setScore(score);
    setGameOver(true);

    // Calculate Reward: 10,000 pts = 1 point ($0.01)
    const points = Math.floor(score / 10000);

    try {
      const { data, error } = await supabase.rpc("claim_game_reward", {
        p_game: `pinball_${tableId}`,
        p_score: score,
        p_reward_est: points
      });
      if (!error) setReward(data[0]?.reward_points || points);
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
      toast.success("Reward Doubled!");
    }
  };

  return (
    <div className="h-dvh w-full bg-black flex flex-col overflow-hidden">
      {/* Game Header */}
      {!gameOver && (
        <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center gap-4 pointer-events-none">
            <button
                onClick={() => navigate({ to: "/" })}
                className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center pointer-events-auto"
            >
                <ArrowLeft className="text-white" />
            </button>
        </div>
      )}

      {/* The Game Loader */}
      {!gameOver && (
        <iframe
            ref={iframeRef}
            src={`/games/${tableId}/index.html`}
            className="flex-1 w-full h-full border-none"
            onLoad={() => setLoading(false)}
        />
      )}

      {loading && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="font-bold animate-pulse uppercase tracking-widest">Loading Table...</p>
        </div>
      )}

      {/* Unified Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950 p-6 text-white text-center">
            <div className="space-y-6 w-full max-w-sm">
                <h2 className="text-5xl font-black uppercase italic">FINISH!</h2>
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 shadow-inner">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Final Score</p>
                    <p className="text-6xl font-black tabular-nums">{finalScore.toLocaleString()}</p>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex justify-between items-center">
                    <div className="text-left">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Added to Vault</p>
                        <p className="text-3xl font-black text-white">+{reward} Pts</p>
                    </div>
                    <div className="h-14 w-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-glow">
                        <Coins className="text-white w-7 h-7" />
                    </div>
                </div>

                {!doubled && reward > 0 && (
                    <button
                        onClick={handleDouble}
                        className="w-full bg-amber-500 text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-glow"
                    >
                        <Gift className="w-5 h-5 fill-current" />
                        WATCH AD FOR 2X REWARD
                    </button>
                )}

                <div className="flex flex-col gap-3 pt-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-white text-black py-4 rounded-xl font-bold"
                    >
                        PLAY AGAIN
                    </button>
                    <button
                        onClick={() => navigate({ to: "/" })}
                        className="w-full text-slate-500 font-bold uppercase text-xs tracking-widest"
                    >
                        BACK TO LOBBY
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
