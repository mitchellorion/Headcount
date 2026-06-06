import React, { useCallback, useEffect } from 'react';
import { preloadInterstitial } from '@/lib/ads';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts as useDMSans,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  LibreFranklin_600SemiBold,
  LibreFranklin_700Bold,
  LibreFranklin_800ExtraBold,
} from '@expo-google-fonts/libre-franklin';
import { colors } from '@/theme/colors';
import { ContactsProvider } from '@/store/ContactsContext';
import { ToastProvider } from '@/components/Toast';
import { AdConsentModal } from '@/components/AdConsentModal';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [fontsLoaded, fontError] = useDMSans({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    LibreFranklin_600SemiBold,
    LibreFranklin_700Bold,
    LibreFranklin_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => undefined);
      preloadInterstitial();
    }
  }, [fontsLoaded, fontError]);

  const onLayout = useCallback(() => undefined, []);

  if (!fontsLoaded && !fontError) {
    return <View style={{ flex: 1, backgroundColor: colors.ink }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.ink }}>
      <SafeAreaProvider>
        <ContactsProvider>
          <ToastProvider>
            <View style={{ flex: 1, backgroundColor: colors.ink }} onLayout={onLayout}>
              <StatusBar style="light" />
              <AdConsentModal onUpgrade={() => {
                // TODO: wire up Google Play in-app billing here
              }} />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.ink },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" options={{ animation: 'none' }} />
                <Stack.Screen name="auth" options={{ animation: 'none' }} />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="contact/[id]" />
                <Stack.Screen
                  name="contact/form"
                  options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
                />
              </Stack>
            </View>
          </ToastProvider>
        </ContactsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
