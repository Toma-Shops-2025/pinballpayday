import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Trophy, Coins, Play, Star, Zap, Info, ShieldCheck, ArrowUpRight, Wallet, Gamepad2, Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, ChevronRight, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { showInterstitial, showRewardedAd, initAds, setBannerVisible } from "@/lib/ads";

export const Route = createFileRoute("/")({ component: LootLagoonLobby });

const PORTALS = [
  { id: "games", name: "GAME GALAXY", desc: "1,000+ Premium Games", url: "https://gamedistribution.com/games?utm_source=lootlagoon&utm_medium=app", color: "from-cyan-500 to-blue-900", icon: Gamepad2, bonus: "INSTANT" },
  { id: "gamepix", name: "MYSTIC ARCADE", desc: "Action & Adventure Hub", url: "https://www.gamepix.com/play?sid=70000", color: "from-blue-600 to-indigo-900", icon: Play, bonus: "NEW" },
  { id: "fortune", name: "DAILY FORTUNE", desc: "Instant Win Games", url: "https://m.famobi.com/html5-games?partner=lootlagoon", color: "from-cyan-600 to-blue-950", icon: Coins, bonus: "HOT" }
];

function AppBackground() {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
          <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: 'url(/bg-loot.png)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black" />
      </div>
    )
}

function LootLagoonLobby() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signIn, signUp, addCash } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const isChecking = useRef(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
        initAds();
        setBannerVisible(true);
    }
  }, []);

  const checkRewards = useCallback(async () => {
    if (isChecking.current) return;
    const startTime = localStorage.getItem('ll_session_start');
    if (startTime && user) {
        isChecking.current = true;
        const start = parseInt(startTime);
        const elapsed = Math.floor((Date.now() - start) / 60000);
        localStorage.removeItem('ll_session_start');

        if (elapsed >= 1) {
            const reward = Math.min(0.50, 0.05 + (elapsed * 0.01));
            await addCash(reward);
            toast.success(`Loot Secured! +$${reward.toFixed(2)}`);
        }
        isChecking.current = false;
    }
  }, [user, addCash]);

  useEffect(() => {
    if (!user) return;
    checkRewards();
    const onVisible = () => { if (document.visibilityState === 'visible') checkRewards(); };
    window.addEventListener('visibilitychange', onVisible);
    return () => window.removeEventListener('visibilitychange', onVisible);
  }, [user, checkRewards]);

  const openPortal = async (url: string) => {
    setHasInteracted(true);
    localStorage.setItem('ll_session_start', Date.now().toString());
    showInterstitial();
    if (Capacitor.isNativePlatform()) {
        await Browser.open({ url, toolbarColor: '#020617' });
    } else {
        window.open(url, '_blank');
    }
  }

  const handleVideoAd = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setHasInteracted(true);
    try {
        const res = await showRewardedAd();
        if (res.success) {
            await addCash(0.10);
            toast.success("Reward Earned!");
        }
    } finally { setIsProcessing(false); }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (isLogin) await signIn(formData.email, formData.password);
        else await signUp(formData.email, formData.password, formData.username);
        setHasInteracted(true);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  if (authLoading) return <div className="h-screen w-full bg-black flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-cyan-400" /></div>;

  if (!user) return (
    <div className="min-h-screen w-full bg-black flex flex-col text-white relative p-8 justify-center overflow-y-auto" onClick={() => setHasInteracted(true)}>
        <AppBackground />
        <div className="relative z-10 text-center space-y-2 mb-12">
            <h1 className="text-6xl font-black italic tracking-tighter uppercase leading-none text-white">LOOT<br/><span className="text-cyan-400">LAGOON</span></h1>
        </div>
        <form onSubmit={handleAuth} className="w-full max-w-sm space-y-3 relative z-10 mx-auto text-left">
            {!isLogin && (
                <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                    <UserIcon className="h-5 w-5 text-white/40 mr-3" />
                    <input type="text" placeholder="PIRATE NAME" className="bg-transparent outline-none w-full font-bold text-white uppercase" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md">
                <Mail className="h-5 w-5 text-white/40 mr-3" />
                <input type="email" placeholder="EMAIL ADDRESS" className="bg-transparent outline-none w-full font-bold text-white uppercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl flex items-center px-4 py-4 backdrop-blur-md relative">
                <Lock className="h-5 w-5 text-white/40 mr-3" />
                <input type={showPass ? "text" : "password"} placeholder="PASSWORD" handle-auto-focus="false" className="bg-transparent outline-none w-full font-bold text-white placeholder:text-white/20 pr-12" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 text-white/20">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-cyan-400 text-black py-5 rounded-3xl font-black uppercase tracking-widest active:scale-95 transition-all mt-4 italic">
                {loading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : (isLogin ? 'Enter Lagoon' : 'Join Crew')}
            </button>
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="w-full text-center text-[10px] text-white/40 font-black uppercase mt-6 underline tracking-[0.2em] relative z-10 italic">
                {isLogin ? "New Recruit? Sign Up" : "Back to Login"}
            </button>
        </form>
    </div>
  );

  return (
    <div className="h-screen w-full text-white flex flex-col overflow-y-auto font-sans relative bg-black no-scrollbar pb-32">
        <AppBackground />
        <header className="px-6 pt-12 pb-4 flex justify-between items-center z-20 relative">
            <div className="flex items-center gap-3 text-left">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 p-0.5 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
                    <div className="h-full w-full bg-black rounded-[14px] flex items-center justify-center overflow-hidden">
                        <img src="/logo.png" className="w-10 h-10 object-contain" />
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none uppercase">LOOT<span className="text-cyan-400 not-italic tracking-normal">LAGOON</span></h1>
                    <p className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-bold mt-1 flex items-center gap-1 italic">
                        <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" /> SECURE PAYOUTS
                    </p>
                </div>
            </div>
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl">
                <Coins className="w-4 h-4 text-cyan-400" />
                <span className="font-black text-lg tabular-nums tracking-tighter text-white italic">${parseFloat(profile?.cash_balance || "0").toFixed(2)}</span>
            </div>
        </header>

        <main className="flex-1 px-4 py-4 space-y-8 relative z-10 text-left">
            <section>
                <div className="flex items-center justify-between px-2 mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400 italic">Earning Portals</h3>
                    <div className="h-px flex-1 mx-4 bg-white/10" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {PORTALS.map((p) => (
                        <button key={p.id} onClick={() => openPortal(p.url)} className="relative h-32 rounded-[2rem] overflow-hidden border border-white/5 bg-gradient-to-br from-white/5 to-transparent p-5 flex flex-col justify-between active:scale-95 transition-all group text-left shadow-xl">
                            <div className={cn("absolute inset-0 opacity-20 bg-gradient-to-br", p.color)} />
                            <div className="flex justify-between items-start z-10">
                                <p.icon className="w-7 h-7 text-white" />
                                <span className="text-[8px] font-black bg-cyan-400/20 px-2 py-0.5 rounded-full text-cyan-400 border border-cyan-400/20">{p.bonus}</span>
                            </div>
                            <div className="z-10">
                                <h4 className="text-sm font-black uppercase italic leading-none tracking-tight">{p.name}</h4>
                                <p className="text-[9px] text-white/40 mt-1 font-bold">{p.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            <button onClick={handleVideoAd} disabled={isProcessing} className="w-full bg-white/5 border border-white/10 p-8 rounded-[3rem] flex items-center justify-between active:scale-95 transition-all group backdrop-blur-xl">
                <div className="flex items-center gap-6">
                    <div className="bg-cyan-400 p-4 rounded-3xl text-black shadow-2xl">
                        {isProcessing ? <Loader2 className="h-8 w-8 animate-spin" /> : <PlayCircle className="h-8 w-8" />}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="font-black text-white uppercase text-lg italic tracking-tight">{isProcessing ? "Connecting..." : "Video Vault"}</span>
                        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-[0.2em]">Earn $0.10 Loot</span>
                    </div>
                </div>
                <ChevronRight className="h-6 w-6 text-cyan-400/40 group-hover:text-cyan-400 transition-colors" />
            </button>

            <section>
                <div className="flex items-center justify-between px-2 mb-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/40 italic">Arcade Games</h3>
                    <div className="h-px flex-1 mx-4 bg-white/10" />
                    <Gamepad2 className="w-4 h-4 text-white/20" />
                </div>
                <div className="grid grid-cols-1 gap-2">
                    {MINI_GAMES.map((game) => (
                        <button key={game.id} onClick={() => navigate({ to: "/game/$tableId", params: { tableId: game.id } })} className="bg-white/5 border border-white/5 rounded-2xl p-5 flex items-center justify-between active:bg-white/10 transition-colors group backdrop-blur-sm">
                            <div className="flex items-center gap-4 text-left">
                                <span className="text-2xl drop-shadow-md">{game.emoji}</span>
                                <span className="font-black uppercase italic text-sm tracking-tight text-white/90">{game.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-cyan-400 tracking-widest uppercase">Play Now</span>
                                <ArrowUpRight className="w-4 h-4 text-cyan-400/40 group-hover:text-cyan-400 transition-colors" />
                            </div>
                        </button>
                    ))}
                </div>
            </section>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-3xl border-t border-white/10 flex justify-around items-center px-4 pb-12 z-[5000]">
            <button onClick={() => navigate({ to: "/" })} className="flex flex-col items-center gap-1.5 text-cyan-400 scale-110">
                <Zap className="w-6 h-6 fill-current" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Lobby</span>
            </button>
            <button onClick={() => navigate({ to: "/leaderboard" })} className="flex flex-col items-center gap-1.5 text-white/40">
                <Trophy className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Ranks</span>
            </button>
            <button onClick={() => navigate({ to: "/cashout" })} className="flex flex-col items-center gap-1.5 text-white/40">
                <Wallet className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Wins</span>
            </button>
            <button onClick={() => toast.info("Loot Lagoon v2.4")} className="flex flex-col items-center gap-1.5 text-white/40">
                <Info className="w-6 h-6" />
                <span className="text-[8px] font-black uppercase tracking-tighter italic">Info</span>
            </button>
        </nav>
    </div>
  );
}
