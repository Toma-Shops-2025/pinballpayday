// Loot Lagoon - High Performance Ads
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

const isNative = () => Capacitor.isNativePlatform();
const UNITY_GAME_ID = "6168873";

declare global {
  interface Window {
    unityads?: any;
  }
}

/** Initialize and Load Ads */
export async function initAds(): Promise<void> {
  if (!isNative()) return;

  const startInit = () => {
    if (window.unityads) {
      // false = Test Mode OFF (Real Ads ON)
      window.unityads.initialize(UNITY_GAME_ID, false, () => {
        console.log("✅ Unity Ads Ready - Loot Lagoon");
        // Pre-load units so they are ready the moment a button is clicked
        window.unityads.load("Rewarded_Android");
        window.unityads.load("Interstitial_Android");
        window.unityads.load("Banner_Android");
      });
    }
  };

  if (window.unityads) startInit();
  else document.addEventListener("deviceready", startInit, { once: true });
}

/** Show a rewarded ad with Auto-Reload */
export async function showRewardedAd(): Promise<{ success: boolean }> {
  if (!isNative()) {
    toast.info("Simulating Ad...");
    return { success: true };
  }

  return new Promise((resolve) => {
    if (!window.unityads) {
      toast.error("Ad Engine not ready. Re-initializing...");
      initAds();
      resolve({ success: false });
      return;
    }

    window.unityads.show("Rewarded_Android", (res: any) => {
      // Immediately start loading the next one
      window.unityads.load("Rewarded_Android");

      if (res === "COMPLETED") {
        resolve({ success: true });
      } else {
        toast.error("Video skipped - no loot granted");
        resolve({ success: false });
      }
    });
  });
}

/** Show an interstitial */
export async function showInterstitial(): Promise<void> {
    if (!isNative() || !window.unityads) return;
    window.unityads.show("Interstitial_Android", () => {
        // Load the next one for the next time
        window.unityads.load("Interstitial_Android");
    });
}

/** Show/Hide Banner Ad */
export function setBannerVisible(visible: boolean): void {
    if (!isNative() || !window.unityads) return;
    if (visible) {
        window.unityads.showBanner("Banner_Android");
    } else {
        window.unityads.hideBanner();
    }
}
