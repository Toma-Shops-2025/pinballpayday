import { toast } from "sonner";

// Toggle this to "true" to see real ads once you have your IDs
const USE_REAL_ADS = false;

export const initAds = async () => {
  console.log("🎬 Ad System Initializing...");
  // When you get your Unity or AppLovin ID, we put the native init code here
};

export const showInterstitial = async () => {
  if (!USE_REAL_ADS) {
    console.log("🎬 Simulating Interstitial Ad");
    return { success: true };
  }

  // Native implementation for Unity/AppLovin goes here
  return { success: true };
};

export const showRewardedAd = async (): Promise<{ success: boolean }> => {
  return new Promise((resolve) => {
    toast.info("Loading Rewarded Video...", { duration: 1500 });

    // Simulate ad delay
    setTimeout(() => {
      if (!USE_REAL_ADS) {
        toast.success("Ad Finished! Reward Granted.");
        resolve({ success: true });
      } else {
        // Logic for UnityAds.show('Rewarded_Android')
        resolve({ success: true });
      }
    }, 2000);
  });
};
