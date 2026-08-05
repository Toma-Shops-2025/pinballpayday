import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { showInterstitial } from "@/lib/ads";

export const Route = createFileRoute("/portal/$portalId")({
  component: PortalContainer,
});

const PORTAL_URLS: Record<string, string> = {
  lootably: "https://wall.lootably.com/webapp/YOUR_LOOTABLY_ID/user_id",
  revlum: "https://revlum.com/wall/YOUR_REVLUM_ID/user_id",
  adgem: "https://api.adgem.com/v1/wall?appid=YOUR_ADGEM_ID&playerid=user_id",
  bitlabs: "https://web.bitlabs.ai/v2/YOUR_BITLABS_ID/user_id",
};

function PortalContainer() {
  const { portalId } = useParams({ from: "/portal/$portalId" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUserId() {
        const { data } = await supabase.auth.getUser();
        if (data?.user) setUserId(data.user.id);
        else setUserId("anonymous_pirate");
    }
    getUserId();
    showInterstitial();
  }, [portalId]);

  const url = userId ? PORTAL_URLS[portalId]?.replace("user_id", userId) : "";

  return (
    <div className="h-screen w-screen bg-black flex flex-col overflow-hidden relative">
      {/* Header Overlay */}
      <header className="bg-slate-950 border-b border-white/10 px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
            <button
                onClick={() => navigate({ to: "/" })}
                className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
                <ArrowLeft className="text-white w-5 h-5" />
            </button>
            <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-primary italic">
                    {portalId} Zone
                </h2>
                <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Verified Payouts</span>
                </div>
            </div>
        </div>
      </header>

      {/* The Portal Loader */}
      <div className="flex-1 relative">
        {url ? (
            <iframe
                src={url}
                className="w-full h-full border-none bg-white"
                onLoad={() => setLoading(false)}
            />
        ) : (
            <div className="flex items-center justify-center h-full text-red-500 font-bold">Invalid Portal ID</div>
        )}

        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white z-40">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="font-black italic uppercase tracking-[0.2em] text-xs animate-pulse text-slate-400">Opening Secure Bridge...</p>
            </div>
        )}
      </div>
    </div>
  );
}
