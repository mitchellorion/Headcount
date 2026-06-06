import {
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IS_PROD = !__DEV__;

export const BANNER_AD_UNIT = IS_PROD
  ? 'ca-app-pub-1946277948152462/7535969576'
  : TestIds.BANNER;

export const INTERSTITIAL_AD_UNIT = IS_PROD
  ? 'ca-app-pub-1946277948152462/3800434771'
  : TestIds.INTERSTITIAL;

export { BannerAdSize };

const AD_FREE_KEY = 'headcount.ad_free.v1';
const INTERSTITIAL_COUNT_KEY = 'headcount.interstitial_count.v1';
// Show interstitial every 5 app opens
const INTERSTITIAL_INTERVAL = 5;

export async function isAdFree(): Promise<boolean> {
  const v = await AsyncStorage.getItem(AD_FREE_KEY);
  return v === 'true';
}

let interstitial: ReturnType<typeof InterstitialAd.createForAdRequest> | null = null;

export function preloadInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT, {
    requestNonPersonalizedAdsOnly: true,
  });
  interstitial.load();
}

export async function maybeShowInterstitial(): Promise<void> {
  if (await isAdFree()) return;

  const raw = await AsyncStorage.getItem(INTERSTITIAL_COUNT_KEY);
  const count = raw ? parseInt(raw, 10) : 0;
  const next = count + 1;
  await AsyncStorage.setItem(INTERSTITIAL_COUNT_KEY, String(next));

  if (next % INTERSTITIAL_INTERVAL !== 0) return;
  if (!interstitial) return;

  return new Promise((resolve) => {
    const unsub = interstitial!.addAdEventListener(AdEventType.CLOSED, () => {
      unsub();
      preloadInterstitial();
      resolve();
    });
    interstitial!.show().catch(() => resolve());
  });
}
