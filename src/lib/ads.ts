import { Capacitor } from "@capacitor/core";

const isNative = () => Capacitor.isNativePlatform();

declare global {
  interface Window {
    applovin?: any;
  }
}

// These should be updated with actual IDs from the AppLovin dashboard
const SDK_KEY = "YOUR_SDK_KEY_HERE";
const REWARDED_AD_UNIT_ID = "YOUR_REWARDED_AD_UNIT_ID_HERE";
const INTERSTITIAL_AD_UNIT_ID = "YOUR_INTERSTITIAL_AD_UNIT_ID_HERE";
const BANNER_AD_UNIT_ID = "YOUR_BANNER_AD_UNIT_ID_HERE";

export async function initAds(): Promise<void> {
  if (!isNative()) return;

  return new Promise((resolve) => {
    const checkPlugin = () => {
      if (window.applovin) {
        window.applovin.initialize(SDK_KEY, (configuration: any) => {
          console.log("AppLovin SDK Initialized", configuration);
          window.applovin.loadRewardedAd(REWARDED_AD_UNIT_ID);
          window.applovin.loadInterstitialAd(INTERSTITIAL_AD_UNIT_ID);
          resolve();
        });
      } else {
        document.addEventListener("deviceready", () => {
          if (window.applovin) {
            window.applovin.initialize(SDK_KEY, (configuration: any) => {
              console.log("AppLovin SDK Initialized (deviceready)", configuration);
              window.applovin.loadRewardedAd(REWARDED_AD_UNIT_ID);
              window.applovin.loadInterstitialAd(INTERSTITIAL_AD_UNIT_ID);
              resolve();
            });
          }
        }, { once: true });
      }
    };
    checkPlugin();
  });
}

export async function showRewardedAd(): Promise<{ success: boolean }> {
  if (!isNative()) {
    console.log("Simulating ad on web...");
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true };
  }

  return new Promise((resolve) => {
    if (!window.applovin) {
      resolve({ success: false });
      return;
    }

    window.applovin.isRewardedAdReady(REWARDED_AD_UNIT_ID, (isReady: boolean) => {
      if (isReady) {
        window.applovin.showRewardedAd(REWARDED_AD_UNIT_ID);
        // Reward is usually handled via listener, but we resolve to let UI know it started
        setTimeout(() => resolve({ success: true }), 1000);
      } else {
        window.applovin.loadRewardedAd(REWARDED_AD_UNIT_ID);
        resolve({ success: false });
      }
    });
  });
}

export async function showInterstitial(): Promise<void> {
    if (!isNative() || !window.applovin) return;

    window.applovin.isInterstitialReady(INTERSTITIAL_AD_UNIT_ID, (isReady: boolean) => {
        if (isReady) {
            window.applovin.showInterstitial(INTERSTITIAL_AD_UNIT_ID);
        } else {
            window.applovin.loadInterstitialAd(INTERSTITIAL_AD_UNIT_ID);
        }
    });
}
