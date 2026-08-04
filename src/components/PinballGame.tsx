import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { Trophy, Coins, Play, RotateCcw, Zap, Target, Star, Gift, Volume2, VolumeX, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { initAds, showRewardedAd, showInterstitial } from "@/lib/ads";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

interface PinballGameProps {
    tableId: string;
}

const TABLE_CONFIGS: Record<string, any> = {
    pirate: {
        name: "FAIR WIND",
        bg: "#0c4a6e",
        wall: "#1e293b",
        flipper: "#60a5fa",
        bumper: "#f59e0b",
        ballsName: "Cannonballs",
        scoreName: "Treasure",
        multiplier: 10000 // 10k pts = 1 reward pt
    },
    western: {
        name: "WILD WEST",
        bg: "#451a03",
        wall: "#78350f",
        flipper: "#fb923c",
        bumper: "#facc15",
        ballsName: "Bullets",
        scoreName: "Bounty",
        multiplier: 12000
    },
    space: {
        name: "ASTEROID",
        bg: "#020617",
        wall: "#1e293b",
        flipper: "#a855f7",
        bumper: "#22d3ee",
        ballsName: "Probes",
        scoreName: "Credits",
        multiplier: 15000
    },
    carnival: {
        name: "FUN HOUSE",
        bg: "#450a0a",
        wall: "#991b1b",
        flipper: "#f87171",
        bumper: "#fbbf24",
        ballsName: "Tokens",
        scoreName: "Tickets",
        multiplier: 8000
    }
};

export const PinballGame: React.FC<PinballGameProps> = ({ tableId }) => {
  const navigate = useNavigate();
  const config = TABLE_CONFIGS[tableId] || TABLE_CONFIGS.pirate;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const [ballsLeft, setBallsLeft] = useState(3);
  const [isMuted, setIsMuted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [doubled, setDoubled] = useState(false);

  const leftFlipperRef = useRef<Matter.Body | null>(null);
  const rightFlipperRef = useRef<Matter.Body | null>(null);

  useEffect(() => {
    initAds();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const { Engine, Render, World, Bodies, Body, Events, Runner, Composite, Constraint } = Matter;
    const engine = Engine.create({ gravity: { x: 0, y: 1.3 } });
    engineRef.current = engine;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: { width, height, wireframes: false, background: "transparent" },
    });

    const wallOptions = { isStatic: true, render: { fillStyle: config.wall } };
    const walls = [
      Bodies.rectangle(width / 2, 0, width, 20, wallOptions),
      Bodies.rectangle(0, height / 2, 20, height, wallOptions),
      Bodies.rectangle(width, height / 2, 20, height, wallOptions),
      Bodies.rectangle(width - 40, height - 150, 10, 300, wallOptions),
    ];

    // Flippers
    const createFlipper = (x: number, y: number, side: "left" | "right") => {
        const fWidth = 90;
        const fHeight = 24;
        const pivotX = side === "left" ? x - fWidth/2 + 10 : x + fWidth/2 - 10;
        const flipper = Bodies.rectangle(x, y, fWidth, fHeight, {
            collisionFilter: { group: -1 },
            chamfer: { radius: 12 },
            render: { fillStyle: config.flipper },
            label: side === "left" ? "leftFlipper" : "rightFlipper",
            friction: 0
        });
        const pivot = Bodies.circle(pivotX, y, 5, { isStatic: true, isSensor: true, render: { visible: false } });
        const constraint = Constraint.create({
            bodyA: flipper,
            pointA: { x: side === "left" ? -fWidth/2 + 10 : fWidth/2 - 10, y: 0 },
            bodyB: pivot,
            length: 0,
            stiffness: 1,
            render: { visible: false }
        });
        return { flipper, pivot, constraint };
    };

    const left = createFlipper(width * 0.32, height * 0.88, "left");
    const right = createFlipper(width * 0.58, height * 0.88, "right");
    leftFlipperRef.current = left.flipper;
    rightFlipperRef.current = right.flipper;

    // Bumpers
    const bumpers = [
        Bodies.circle(width * 0.25, height * 0.25, 28, { isStatic: true, restitution: 1.6, label: "bumper", render: { fillStyle: config.bumper, strokeStyle: "#fff", lineWidth: 3 } }),
        Bodies.circle(width * 0.75, height * 0.25, 28, { isStatic: true, restitution: 1.6, label: "bumper", render: { fillStyle: config.bumper, strokeStyle: "#fff", lineWidth: 3 } }),
        Bodies.circle(width * 0.5, height * 0.15, 30, { isStatic: true, restitution: 1.6, label: "bumper", render: { fillStyle: config.bumper, strokeStyle: "#fff", lineWidth: 3 } }),
    ];

    const drain = Bodies.rectangle(width / 2, height + 60, width, 40, { isStatic: true, isSensor: true, label: "drain" });

    World.add(engine.world, [...walls, left.flipper, left.pivot, left.constraint, right.flipper, right.pivot, right.constraint, ...bumpers, drain]);

    Events.on(engine, "collisionStart", (event) => {
        event.pairs.forEach((pair) => {
            if (pair.bodyA.label === "bumper" || pair.bodyB.label === "bumper") {
                setScore(s => s + 500);
                if (!isMuted && navigator.vibrate) navigator.vibrate(10);
            }
            if (pair.bodyA.label === "drain" || pair.bodyB.label === "drain") {
                const ball = pair.bodyA.label === "ball" ? pair.bodyA : pair.bodyB;
                World.remove(engine.world, ball);
                setBallsLeft(prev => {
                    if (prev <= 1) { finishGame(); return 0; }
                    setTimeout(spawnBall, 1500);
                    return prev - 1;
                });
            }
        });
    });

    Events.on(engine, "beforeUpdate", () => {
        const speed = 0.25;
        if (leftFlipperRef.current) {
            const targetAngle = (leftFlipperRef.current as any).isPressing ? -0.5 : 0.4;
            const diff = targetAngle - leftFlipperRef.current.angle;
            Body.setAngle(leftFlipperRef.current, leftFlipperRef.current.angle + diff * speed);
        }
        if (rightFlipperRef.current) {
            const targetAngle = (rightFlipperRef.current as any).isPressing ? 0.5 : -0.4;
            const diff = targetAngle - rightFlipperRef.current.angle;
            Body.setAngle(rightFlipperRef.current, rightFlipperRef.current.angle + diff * speed);
        }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    return () => {
        Render.stop(render);
        Runner.stop(runner);
        Engine.clear(engine);
        World.clear(engine.world, false);
    };
  }, [tableId]);

  const spawnBall = () => {
    if (!engineRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const ball = Matter.Bodies.circle(width - 25, height - 30, 14, {
        restitution: 0.5, density: 0.002, friction: 0.001, label: "ball",
        render: { fillStyle: "#fff", strokeStyle: "#94a3b8", lineWidth: 2 }
    });
    Matter.World.add(engineRef.current.world, ball);
    setTimeout(() => { Matter.Body.applyForce(ball, ball.position, { x: 0, y: -0.12 }); }, 300);
  };

  const handleAction = (side: "left" | "right", active: boolean) => {
    const body = side === "left" ? leftFlipperRef.current : rightFlipperRef.current;
    if (body) (body as any).isPressing = active;
  };

  const startGame = () => {
    setScore(0); setBallsLeft(3); setReward(null); setDoubled(false); setGameState("playing");
    setTimeout(spawnBall, 500);
  };

  const finishGame = async () => {
      setGameState("gameover");
      setIsSubmitting(true);
      try {
          const calculatedReward = Math.floor(score / config.multiplier);
          const { data } = await supabase.rpc("claim_game_reward", {
              p_game: `pinball_${tableId}`, p_score: score, p_reward_est: calculatedReward
          });
          setReward(data?.reward_points || calculatedReward);
          showInterstitial();
      } catch {
          setReward(Math.floor(score / config.multiplier));
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDoubleReward = async () => {
      if (doubled || !reward) return;
      const res = await showRewardedAd();
      if (res.success) {
          try {
              await supabase.rpc("award_points", { p_points: reward, p_source: `pinball_${tableId}_double` });
              setDoubled(true);
              toast.success("Reward Doubled!");
          } catch { toast.error("Failed to award bonus"); }
      }
  };

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden font-sans select-none" style={{ backgroundColor: config.bg }}>
      <canvas ref={canvasRef} className="block w-full h-full relative z-10" />

      {/* UI: HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex flex-col gap-1 bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 min-w-[140px] shadow-2xl">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{config.scoreName}</span>
            </div>
            <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-3xl font-black text-white tabular-nums tracking-tighter">{score.toLocaleString()}</span>
            </div>
        </div>

        <div className="flex flex-col gap-1 items-end bg-black/40 backdrop-blur-xl p-3 rounded-2xl border border-white/10 min-w-[90px] shadow-2xl">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{config.ballsName}</span>
            <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-primary italic">{ballsLeft}</span>
            </div>
        </div>
      </div>

      {/* Touch Controls */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-30 flex">
            <div className="w-1/2 h-full active:bg-white/5 transition-colors cursor-pointer" onTouchStart={(e) => { e.preventDefault(); handleAction("left", true); }} onTouchEnd={(e) => { e.preventDefault(); handleAction("left", false); }} />
            <div className="w-1/2 h-full active:bg-white/5 transition-colors cursor-pointer" onTouchStart={(e) => { e.preventDefault(); handleAction("right", true); }} onTouchEnd={(e) => { e.preventDefault(); handleAction("right", false); }} />
        </div>
      )}

      {/* Overlays (Start/Game Over) - truncated for brevity but maintained with themed text */}
      {gameState === "idle" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 text-white text-center">
            <div className="space-y-6">
                <h1 className="text-6xl font-black italic tracking-tighter">{config.name}<br/><span className="text-primary">PINBALL</span></h1>
                <button onClick={startGame} className="w-full bg-primary text-black py-5 rounded-[2rem] font-black text-xl">START MISSION</button>
                <button onClick={() => navigate({ to: '/' })} className="text-slate-400 flex items-center gap-2 mx-auto"><ArrowLeft className="w-4 h-4"/> Back to Lobby</button>
            </div>
        </div>
      )}

      {gameState === "gameover" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6 text-white text-center">
            <div className="space-y-6 w-full max-w-sm">
                <h2 className="text-4xl font-black uppercase italic">MISSION ENDED</h2>
                <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Final Score</p>
                    <p className="text-6xl font-black">{score.toLocaleString()}</p>
                </div>
                <div className="bg-primary/20 p-4 rounded-2xl flex justify-between items-center">
                    <span className="font-bold text-primary">Earnings:</span>
                    <span className="text-2xl font-black">+{reward} Pts</span>
                </div>
                {!doubled && (
                    <button onClick={handleDoubleReward} className="w-full bg-gold text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                        <Gift className="w-5 h-5"/> DOUBLE REWARD (WATCH AD)
                    </button>
                )}
                <button onClick={startGame} className="w-full bg-white text-black py-4 rounded-xl font-bold">PLAY AGAIN</button>
                <button onClick={() => navigate({ to: '/' })} className="w-full text-slate-500 font-bold">EXIT</button>
            </div>
        </div>
      )}
    </div>
  );
};
