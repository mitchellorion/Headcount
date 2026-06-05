import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

interface Props { onUnlock: () => void; }

export default function LockScreen({ onUnlock }: Props) {
  const [loading, setLoading] = useState(true);

  async function authenticate() {
    setLoading(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock HeadCount',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });
      if (result.success) onUnlock();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { authenticate(); }, []);

  return (
    <View style={s.root}>
      <View style={s.logoMark}><Text style={s.logoH}>H</Text></View>
      <Text style={s.title}>HeadCount .</Text>
      <Text style={s.sub}>Your roster is locked</Text>
      {loading
        ? <ActivityIndicator color="#c7ff4f" style={{ marginTop: 32 }} />
        : (
          <TouchableOpacity style={s.btn} onPress={authenticate}>
            <Text style={s.btnText}>Unlock</Text>
          </TouchableOpacity>
        )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090909', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoMark: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#c7ff4f', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoH: { fontSize: 28, fontWeight: '800', color: '#0a0a0a' },
  title: { fontSize: 22, fontWeight: '700', color: '#f5f5f1' },
  sub: { fontSize: 13, color: '#555', marginBottom: 8 },
  btn: { marginTop: 24, backgroundColor: '#c7ff4f', borderRadius: 99, paddingHorizontal: 40, paddingVertical: 14 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
});
