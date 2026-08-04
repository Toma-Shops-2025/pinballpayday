import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import { Trophy, Coins, Play, RotateCcw, Zap, Target, Star, Gift, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { initAds, showRewardedAd, showInterstitial } from "@/lib/ads";
import { supabase } from "@/integrations/supabase/client";

export const PinballGame: React.FC = () => {
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

  // Physics bodies refs for control
  const leftFlipperRef = useRef<Matter.Body | null>(null);
  const rightFlipperRef = useRef<Matter.Body | null>(null);

  useEffect(() => {
    initAds();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const { Engine, Render, World, Bodies, Body, Events, Runner, Composite, Constraint } = Matter;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.3 },
    });
    engineRef.current = engine;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
      },
    });

    // --- Table Layout ---
    const wallColor = "#1e293b";
    const wallOptions = { isStatic: true, render: { fillStyle: wallColor } };

    // Main boundary
    const walls = [
      Bodies.rectangle(width / 2, 0, width, 20, wallOptions), // Top
      Bodies.rectangle(0, height / 2, 20, height, wallOptions), // Left
      Bodies.rectangle(width, height / 2, 20, height, wallOptions), // Right
      // Launch lane wall
      Bodies.rectangle(width - 40, height - 150, 10, 300, wallOptions),
    ];

    // Arched top (using multiple rectangles)
    const curveSegments = 10;
    for (let i = 0; i < curveSegments; i++) {
        const angle = (Math.PI / curveSegments) * i;
        const x = width / 2 + Math.cos(angle + Math.PI) * (width / 2 - 20);
        const y = width / 4 + Math.sin(angle + Math.PI) * (width / 4);
        walls.push(Bodies.rectangle(x, y, 60, 20, {
            isStatic: true,
            angle: angle + Math.PI/2,
            render: { fillStyle: wallColor }
        }));
    }

    // Inclined walls leading to flippers
    const bottomWalls = [
        Bodies.rectangle(60, height - 80, width * 0.4, 20, {
            isStatic: true, angle: Math.PI / 6, render: { fillStyle: wallColor }
        }),
        Bodies.rectangle(width - 100, height - 80, width * 0.4, 20, {
            isStatic: true, angle: -Math.PI / 6, render: { fillStyle: wallColor }
        }),
    ];

    // Flippers
    const createFlipper = (x: number, y: number, side: "left" | "right") => {
        const fWidth = 90;
        const fHeight = 24;
        const pivotX = side === "left" ? x - fWidth/2 + 10 : x + fWidth/2 - 10;

        const flipper = Bodies.rectangle(x, y, fWidth, fHeight, {
            collisionFilter: { group: -1 },
            chamfer: { radius: 12 },
            render: { fillStyle: "#60a5fa" },
            label: side === "left" ? "leftFlipper" : "rightFlipper",
            slop: 0,
            friction: 0,
            restitution: 0.1
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

    // Bumpers (High points)
    const createBumper = (x: number, y: number, pts: number, color: string) => {
        const b = Bodies.circle(x, y, 28, {
            isStatic: true,
            restitution: 1.6,
            label: "bumper",
            render: {
                fillStyle: color,
                strokeStyle: "#fff",
                lineWidth: 3,
                sprite: { texture: "" } // Placeholder for future graphics
            }
        });
        (b as any).points = pts;
        return b;
    };

    const bumpers = [
        createBumper(width * 0.25, height * 0.25, 500, "#ef4444"),
        createBumper(width * 0.75, height * 0.25, 500, "#ef4444"),
        createBumper(width * 0.5, height * 0.15, 1000, "#f59e0b"),
        createBumper(width * 0.5, height * 0.45, 250, "#3b82f6"),
    ];

    // Slingshots (Triangle bumpers above flippers)
    const createSlingshot = (x: number, y: number, angle: number) => {
        return Bodies.polygon(x, y, 3, 30, {
            isStatic: true,
            restitution: 1.8,
            angle: angle,
            label: "bumper",
            render: { fillStyle: "#10b981" }
        });
    };

    const slingshots = [
        createSlingshot(width * 0.2, height * 0.7, Math.PI / 4),
        createSlingshot(width * 0.8, height * 0.7, -Math.PI / 4),
    ];

    // Drain sensor
    const drain = Bodies.rectangle(width / 2, height + 60, width, 40, {
        isStatic: true,
        isSensor: true,
        label: "drain"
    });

    World.add(engine.world, [
        ...walls,
        ...bottomWalls,
        left.flipper, left.pivot, left.constraint,
        right.flipper, right.pivot, right.constraint,
        ...bumpers,
        ...slingshots,
        drain
    ]);

    // --- Logic ---
    Events.on(engine, "collisionStart", (event) => {
        event.pairs.forEach((pair) => {
            const labels = [pair.bodyA.label, pair.bodyB.label];

            if (labels.includes("bumper")) {
                const bumper = pair.bodyA.label === "bumper" ? pair.bodyA : pair.bodyB;
                const pts = (bumper as any).points || 100;
                setScore(s => s + pts);

                // Audio or Visual Feedback
                if (!isMuted && typeof navigator !== "undefined" && navigator.vibrate) {
                    navigator.vibrate(10);
                }
            }

            if (labels.includes("drain")) {
                const ball = pair.bodyA.label === "ball" ? pair.bodyA : pair.bodyB;
                World.remove(engine.world, ball);

                setBallsLeft(prev => {
                    if (prev <= 1) {
                        finishGame();
                        return 0;
                    }
                    setTimeout(spawnBall, 1500);
                    return prev - 1;
                });
            }
        });
    });

    // Smooth flipper motion
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
  }, []);

  const spawnBall = () => {
    if (!engineRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const ball = Matter.Bodies.circle(width - 25, height - 30, 14, {
        restitution: 0.5,
        density: 0.002,
        friction: 0.001,
        label: "ball",
        render: {
            fillStyle: "#fff",
            strokeStyle: "#94a3b8",
            lineWidth: 2
        }
    });

    Matter.World.add(engineRef.current.world, ball);

    // Launching force
    setTimeout(() => {
        Matter.Body.applyForce(ball, ball.position, { x: 0, y: -0.12 });
    }, 300);
  };

  const handleAction = (side: "left" | "right", active: boolean) => {
    const body = side === "left" ? leftFlipperRef.current : rightFlipperRef.current;
    if (!body) return;
    (body as any).isPressing = active;
  };

  const startGame = () => {
    setScore(0);
    setBallsLeft(3);
    setReward(null);
    setDoubled(false);
    setGameState("playing");
    setTimeout(spawnBall, 500);
  };

  const finishGame = async () => {
      setGameState("gameover");
      setIsSubmitting(true);

      try {
          // Calculate reward: 10,000 pts = 1 point ($0.01)
          const calculatedReward = Math.floor(score / 10000);

          const { data, error } = await (supabase as any).rpc("claim_game_reward", {
              p_game: "pinball_pirate",
              p_score: score,
              p_reward_est: calculatedReward
          });

          if (error) throw error;
          setReward(data?.reward_points || 0);

          showInterstitial(); // Show an ad between rounds
      } catch (err) {
          console.error(err);
          // Fallback if RPC doesn't exist yet
          setReward(Math.floor(score / 10000));
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDoubleReward = async () => {
      if (doubled || !reward) return;

      const res = await showRewardedAd();
      if (res.success) {
          try {
              const { error } = await (supabase as any).rpc("award_points", {
                  p_points: reward,
                  p_source: "pinball_double"
              });
              if (error) throw error;
              setDoubled(true);
              toast.success("Reward Doubled!");
          } catch (err) {
              toast.error("Failed to award bonus");
          }
      }
  };

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#0c4a6e] font-sans select-none">
      {/* Background Decor: Pirate Theme */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,#0ea5e9_0%,#0c4a6e_70%)]" />
        {/* Sand at the top */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#fde68a] to-transparent opacity-30" />
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full relative z-10" />

      {/* UI: HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 pointer-events-none pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex flex-col gap-1 bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 min-w-[140px] shadow-2xl">
            <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black text-amber-200 uppercase tracking-widest">Treasure Haul</span>
            </div>
            <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold" />
                <span className="text-3xl font-black text-white tabular-nums tracking-tighter">
                    {score.toLocaleString()}
                </span>
            </div>
        </div>

        <div className="flex flex-col gap-1 items-end bg-black/60 backdrop-blur-xl p-3 rounded-2xl border border-white/10 min-w-[90px] shadow-2xl">
            <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Cannonballs</span>
            <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white italic">{ballsLeft}</span>
                <div className="h-6 w-6 rounded-full bg-black/50 flex items-center justify-center border border-white/20">
                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                </div>
            </div>
        </div>
      </div>

      {/* Touch Controls */}
      {gameState === "playing" && (
        <div className="absolute inset-0 z-30 flex">
            <div
                className="w-1/2 h-full active:bg-blue-500/5 transition-colors cursor-pointer"
                onMouseDown={() => handleAction("left", true)}
                onMouseUp={() => handleAction("left", false)}
                onTouchStart={(e) => { e.preventDefault(); handleAction("left", true); }}
                onTouchEnd={(e) => { e.preventDefault(); handleAction("left", false); }}
            />
            <div
                className="w-1/2 h-full active:bg-blue-500/5 transition-colors cursor-pointer border-l border-white/5"
                onMouseDown={() => handleAction("right", true)}
                onMouseUp={() => handleAction("right", false)}
                onTouchStart={(e) => { e.preventDefault(); handleAction("right", true); }}
                onTouchEnd={(e) => { e.preventDefault(); handleAction("right", false); }}
            />
        </div>
      )}

      {/* Start Screen */}
      {gameState === "idle" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0c4a6e]/80 backdrop-blur-md p-6 text-white">
          <div className="max-w-sm w-full text-center space-y-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-500/30">
                    <Zap className="w-3 h-3 fill-current" /> Loot & Earn
                </div>
                <h1 className="text-6xl font-black italic tracking-tighter text-white leading-[0.9] drop-shadow-[0_10px_20px_rgba(245,158,11,0.4)]">
                    FAIR WIND<br/><span className="text-amber-400">PINBALL</span>
                </h1>
                <p className="text-blue-200 font-medium tracking-tight">Recover the lost treasure of the Seven Seas.</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <Target className="w-4 h-4 text-red-400 mb-1" />
                    <p className="text-[10px] font-bold text-blue-300 uppercase">Bounty</p>
                    <p className="text-sm font-black text-white">GOLD DOUBLOONS</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <Star className="w-4 h-4 text-gold mb-1" />
                    <p className="text-[10px] font-bold text-blue-300 uppercase">Multiplier</p>
                    <p className="text-sm font-black text-white">X2.5 WIND</p>
                </div>
            </div>

            <button
              onClick={startGame}
              className="w-full bg-amber-500 text-amber-950 py-6 rounded-[2.5rem] font-black text-2xl shadow-[0_20px_40px_rgba(245,158,11,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 border-t border-white/40"
            >
              <Play className="w-7 h-7 fill-current" />
              SET SAIL
            </button>

            <button onClick={() => setIsMuted(!isMuted)} className="text-blue-300 hover:text-white transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === "gameover" && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0c4a6e]/95 backdrop-blur-2xl p-6 text-white">
          <div className="max-w-sm w-full text-center space-y-8 animate-in zoom-in-95 duration-300">
            <div className="space-y-2">
                <h2 className="text-5xl font-black text-amber-400 uppercase tracking-tighter italic">ANCHORS AWAY!</h2>
                <p className="text-blue-200 font-medium">Your loot has been secured.</p>
            </div>

            <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center gap-2 shadow-inner">
                    <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.3em]">Treasure Score</span>
                    <span className="text-7xl font-black text-white tabular-nums tracking-tighter">{score.toLocaleString()}</span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex justify-between items-center">
                    <div className="text-left">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Rewards Earned</p>
                        <p className="text-3xl font-black text-white">
                            {isSubmitting ? "..." : `+${reward} Pts`}
                        </p>
                    </div>
                    <div className="h-14 w-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                        <Coins className="text-white w-7 h-7" />
                    </div>
                </div>

                {!doubled && reward && reward > 0 && (
                    <button
                        onClick={handleDoubleReward}
                        className="w-full bg-gold text-amber-950 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-glow hover:scale-105 transition-transform border-b-4 border-black/20"
                    >
                        <Gift className="w-5 h-5 fill-current" />
                        WATCH AD FOR 2X TREASURE
                    </button>
                )}
            </div>

            <div className="space-y-3 pt-4">
                <button
                    onClick={startGame}
                    className="w-full bg-white text-blue-900 py-5 rounded-[2rem] font-black text-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <RotateCcw className="w-6 h-6" />
                    NEW VOYAGE
                </button>
                <button
                    className="w-full text-blue-300 font-bold py-3 hover:text-white transition-colors uppercase text-xs tracking-widest"
                    onClick={() => setGameState("idle")}
                >
                    RETURN TO DOCK
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
