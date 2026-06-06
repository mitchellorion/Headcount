import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_AD_UNIT, isAdFree } from '@/lib/ads';

export function AdBanner() {
  const [adFree, setAdFree] = useState<boolean | null>(null);

  useEffect(() => {
    isAdFree().then(setAdFree);
  }, []);

  if (adFree !== false) return null;

  return (
    <View style={{ alignItems: 'center' }}>
      <BannerAd
        unitId={BANNER_AD_UNIT}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}
