import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trophy, Coins, Play, Star, Zap, Info, ShieldCheck, ArrowUpRight, Wallet, Gamepad2, Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { showInterstitial, showRewardedAd } from "@/lib/ads";

export const Route = createFileRoute("/")({
  component: LootLagoonLobby,
});

const EARNING_PORTALS = [
  {
    id: "games",
    name: "GAME GALAXY",
    desc: "1,000+ Premium Games",
    url: "https://gamedistribution.com/games?utm_source=lootlagoon&utm_medium=app",
    color: "from-blue-600 to-cyan-900",
    accent: "text-cyan-400",
    icon: Gamepad2,
    bonus: "INSTANT"
  },
  {
    id: "gamepix",
    name: "MYSTIC ARCADE",
    desc: "Action & Adventure Hub",
    url: "https://www.gamepix.com/play?sid=70000",
    color: "from-purple-600 to-indigo-900",
    accent: "text-purple-400",
    icon: Play,
    bonus: "NEW"
  },
  {
    id: "video",
    name: "VIDEO VAULT",
    desc: "Watch Ads, Earn Fast",
    url: "",
    color: "from-red-600 to-rose-900",
    accent: "text-rose-400",
    icon: Zap,
    bonus: "UNLIMITED"
  },
  {
    id: "fortune",
    name: "DAILY FORTUNE",
    desc: "Instant Win Games",
    url: "https://m.famobi.com/html5-games?partner=lootlagoon",
    color: "from-amber-500 to-orange-900",
    accent: "text-amber-400",
    icon: Coins,
    bonus: "HOT"
  }
];

const MINI_GAMES = [
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
  const { user, profile, loading: authLoading, signIn, signUp, addCash } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Time-based Reward Logic
  const checkRewards = useCallback(async () => {
    const startTime = localStorage.getItem('ll_session_start');
    if (startTime && user) {
        const start = parseInt(startTime);
        const now = Date.now();
        const elapsedMinutes = Math.floor((now - start) / 60000);

        if (elapsedMinutes >= 1) {
            const reward = 0.05 + (elapsedMinutes * 0.02);
            localStorage.removeItem('ll_session_start');
            await addCash(reward);
            toast.success(`Loot Secured! +$${reward.toFixed(2)}`, {
                description: `You played for ${elapsedMinutes} minutes.`,
                icon: '💰'
            });
        }
    }
  }, [user, addCash]);

  useEffect(() => {
    if (!user) return;
    checkRewards();
    const onFocus = () => { if (document.visibilityState === 'visible') checkRewards(); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, checkRewards]);

  const openPortal = async (portalId: string, url: string) => {
    if (portalId === 'video') {
        handleWatchReward();
        return;
    }

    localStorage.setItem('ll_session_start', Date.now().toString());
    showInterstitial();

    if (Capacitor.isNativePlatform()) {
        await Browser.open({ url, toolbarColor: '#020617' });
    } else {
        window.open(url, '_blank');
    }
  }

  const handleWatchReward = async () => {
    toast.info("Connecting to Video Vault...");
    const res = await showRewardedAd();
    if (res.success) {
        await addCash(0.10);
        toast.success("Reward Earned!", { description: "+$0.10 added to your balance." });
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!isLogin && !agreed) {
        toast.error("Please agree to the Terms of Service.");
        return;
    }
    setLoading(true);
    try {
        if (isLogin) {
            await signIn(email, password);
            toast.success("Welcome back, Pirate!");
        } else {
            await signUp(email, password, username);
            toast.success("Welcome to the Lagoon!");
        }
    } catch (error: any) {
        toast.error("Auth Failed", { description: error.message });
    } finally {
        setLoading(false);
    }
  }

  if (authLoading) return (
    <div className="h-screen w-full bg-[#020617] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin h-10 w-10 mb-4 text-[#00d2ff]" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Opening the Vault...</span>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen w-full bg-black flex flex-col text-white relative p-8 justify-center">
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,0%,#000,100%)] opacity-70" />
        <div className="relative z-10 text-center space-y-2 mb-12">
            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none">LOOT<br/><span className="text-[#00d2ff]">LAGOON</span></h1>
            <p className="text-xs font-bold tracking-[0.3em] text-white/40 uppercase italic">Your Treasure Awaits</p>
        </div>

        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-3 relative z-10 mx-auto">
            {!isLogin && (
                <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                    <UserIcon className="h-5 w-5 text-white/40 mr-3" />
                    <input type="text" placeholder="PIRATE NAME" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                <Mail className="h-5 w-5 text-white/40 mr-3" />
                <input type="email" placeholder="EMAIL ADDRESS" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md relative">
                <Lock className="h-5 w-5 text-white/40 mr-3" />
                <input type={showPass ? "text" : "password"} placeholder="PASSWORD" handle-auto-focus="false" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20 pr-12" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            {!isLogin && (
                <div className="flex items-center gap-3 px-4 py-2 text-left">
                    <input type="checkbox" id="terms" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="h-4 w-4 rounded border-white/10 bg-black/40 text-primary" />
                    <label htmlFor="terms" className="text-[10px] text-white/60 font-bold uppercase italic">I am 18+ and agree to the Pirate Code</label>
                </div>
            )}
            <button type="submit" disabled={loading} className="w-full bg-[#00d2ff] text-black py-5 rounded-3xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(0,210,255,0.4)] active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 italic">
                {loading && <Loader2 className="animate-spin h-5 w-5" />}
                {isLogin ? 'Enter Lagoon' : 'Join Crew'}
            </button>
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-[10px] text-white/40 font-black uppercase mt-6 underline tracking-[0.2em] relative z-10 italic">
                {isLogin ? "New Recruit? Sign Up" : "Back to Login"}
            </button>
        </form>
    </div>
  );

  return (
    <div className="flex flex-col bg-[#020617] text-white font-sans select-none min-h-screen overflow-y-auto pb-48 no-scrollbar">
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,0%,#020617,100%)] opacity-70 -z-10" />

      <div className="flex flex-col w-full max-w-lg mx-auto">
        <header className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#00d2ff] to-blue-600 p-0.5 shadow-glow">
                <div className="h-full w-full bg-black rounded-[14px] flex items-center justify-center overflow-hidden">
                    <img src="/logo.png" className="w-10 h-10 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                    <Zap className="w-6 h-6 text-[#00d2ff] absolute" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none uppercase">Loot<span className="text-[#00d2ff] not-italic tracking-normal">Lagoon</span></h1>
                <p className="text-[9px] text-slate-400 uppercase tracking-[0.3em] font-bold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5 text-[#00d2ff]" /> SECURE PAYOUTS
                </p>
              </div>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
              <Coins className="w-4 h-4 text-[#00d2ff]" />
              <span className="font-black text-lg tabular-nums tracking-tighter text-white italic">${parseFloat(profile?.cash_balance || "0").toFixed(2)}</span>
          </div>
        </header>

        <main className="px-4 py-2 space-y-8">
          <section>
            <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#00d2ff]">Earning Zones</h3>
                <div className="h-px flex-1 mx-4 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                {EARNING_PORTALS.map((portal) => (
                    <button
                        key={portal.id}
                        onClick={() => openPortal(portal.id, portal.url)}
                        className="relative h-28 rounded-3xl overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-4 flex flex-col justify-between active:scale-95 transition-all group text-left"
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

          <section>
            <div className="flex items-center justify-between px-2 mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 italic">Arcade Games</h3>
                <div className="h-px flex-1 mx-4 bg-white/10" />
                <Gamepad2 className="w-4 h-4 text-slate-500" />
            </div>
            <div className="grid grid-cols-1 gap-2">
                {MINI_GAMES.map((game) => (
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

      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-12 z-[5000]">
            <button onClick={() => navigate({ to: "/" })} className="flex flex-col items-center gap-1.5 text-[#00d2ff] scale-110">
                <Zap className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Home</span>
            </button>
            <button onClick={() => navigate({ to: "/leaderboard" })} className="flex flex-col items-center gap-1.5 text-white/40">
                <Trophy className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Ranks</span>
            </button>
            <button onClick={() => navigate({ to: "/cashout" })} className="flex flex-col items-center gap-1.5 text-white/40">
                <Wallet className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Wins</span>
            </button>
            <button onClick={() => toast.info("Loot Lagoon v2.1 - Play Games. Win Rewards.")} className="flex flex-col items-center gap-1.5 text-white/40">
                <Info className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Info</span>
            </button>
      </nav>
    </div>
  );
}
