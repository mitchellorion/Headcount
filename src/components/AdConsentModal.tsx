import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Sparkles, X } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

const CONSENT_KEY = 'headcount.ad_consent_seen.v1';
const AD_FREE_KEY = 'headcount.ad_free.v1';

export function useAdFree() {
  const [adFree, setAdFree] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AD_FREE_KEY).then((v) => setAdFree(v === 'true'));
  }, []);

  return adFree;
}

export async function getAdFree(): Promise<boolean> {
  const v = await AsyncStorage.getItem(AD_FREE_KEY);
  return v === 'true';
}

export async function setAdFree(): Promise<void> {
  await AsyncStorage.setItem(AD_FREE_KEY, 'true');
}

interface Props {
  onUpgrade: () => void;
}

export function AdConsentModal({ onUpgrade }: Props) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [adFree, setAdFreeState] = useState(false);

  useEffect(() => {
    (async () => {
      const [seen, free] = await Promise.all([
        AsyncStorage.getItem(CONSENT_KEY),
        AsyncStorage.getItem(AD_FREE_KEY),
      ]);
      if (free === 'true') { setAdFreeState(true); return; }
      if (!seen) setVisible(true);
    })();
  }, []);

  const dismiss = async () => {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');
    setVisible(false);
  };

  const handleUpgrade = async () => {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');
    setVisible(false);
    onUpgrade();
  };

  if (adFree) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={[styles.card, { paddingBottom: insets.bottom + 24 }]}>

          {/* Header */}
          <View style={styles.iconWrap}>
            <Heart size={28} color={colors.lime} fill={colors.lime} />
          </View>
          <Text style={styles.title}>Keeping the lights on</Text>
          <Text style={styles.body}>
            HeadCount is free to use. To keep it that way — and keep our small dev team fed — we show a small number of ads.
          </Text>
          <Text style={styles.body}>
            We promise to keep them minimal and non-intrusive. No autoplay video, no pop-ups every five seconds. Just a quiet banner here and there.
          </Text>

          {/* Ad-free offer */}
          <Pressable onPress={handleUpgrade} style={styles.upgradeBtn}>
            <Sparkles size={16} color={colors.onLime} />
            <View style={{ flex: 1 }}>
              <Text style={styles.upgradeBtnTitle}>Go ad-free forever</Text>
              <Text style={styles.upgradeBtnSub}>One-time payment · $2.99</Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>$2.99</Text>
            </View>
          </Pressable>

          {/* Dismiss */}
          <Pressable onPress={dismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>Continue with ads</Text>
          </Pressable>

          <Text style={styles.fine}>
            You can remove ads anytime from the More tab.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    color: colors.textStrong,
    fontFamily: fonts.display,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    color: colors.subtle,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.lime,
    borderRadius: 18,
    padding: 16,
    marginTop: 6,
  },
  upgradeBtnTitle: {
    color: colors.onLime,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  upgradeBtnSub: {
    color: colors.onLime,
    fontFamily: fonts.body,
    fontSize: 12,
    opacity: 0.75,
    marginTop: 2,
  },
  priceBadge: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  priceText: {
    color: colors.onLime,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dismissText: {
    color: colors.subtle,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  fine: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 4,
  },
});
