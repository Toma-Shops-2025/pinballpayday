import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";

const isNative = () => Capacitor.isNativePlatform();

// YOUR REAL UNITY GAME ID for Loot Lagoon
const UNITY_GAME_ID = "6168873";

declare global {
  interface Window {
    unityads?: any;
  }
}

export const initAds = async () => {
  if (!isNative()) return;

  return new Promise((resolve) => {
    const checkPlugin = () => {
      if (window.unityads) {
        // false = Test Mode OFF (Real Ads ON)
        window.unityads.initialize(UNITY_GAME_ID, false, () => {
          console.log("✅ Unity Ads Initialized - REAL MODE");
          resolve(true);
        });
      } else {
        document.addEventListener("deviceready", () => {
          if (window.unityads) {
            window.unityads.initialize(UNITY_GAME_ID, false, () => {
                console.log("✅ Unity Ads Initialized (deviceready) - REAL MODE");
                resolve(true);
            });
          }
        }, { once: true });
      }
    };
    checkPlugin();
  });
};

export const showInterstitial = async () => {
  if (!isNative()) {
    console.log("🎬 Simulating Interstitial");
    return;
  }

  if (window.unityads) {
    // Unity's default unit name for interstitials
    window.unityads.show("Interstitial_Android");
  }
};

export const showRewardedAd = async (): Promise<{ success: boolean }> => {
  if (!isNative()) {
    toast.info("Simulating Rewarded Video...");
    await new Promise((r) => setTimeout(r, 2000));
    return { success: true };
  }

  return new Promise((resolve) => {
    if (!window.unityads) {
      toast.error("Ad Engine not ready");
      resolve({ success: false });
      return;
    }

    window.unityads.show("Rewarded_Android", (res: any) => {
      if (res === "COMPLETED") {
        resolve({ success: true });
      } else {
        toast.error("Ad not finished - no reward granted");
        resolve({ success: false });
      }
    });
  });
};
