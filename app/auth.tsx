import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/useAuth';

type Mode = 'signin' | 'signup';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setError('');
    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const { error: err } =
        mode === 'signin'
          ? await signIn(email.trim(), password)
          : await signUp(email.trim(), password);
      if (err) { setError(err.message); return; }
      router.replace('/(tabs)/');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.logo}>
        <View style={s.logoMark}><Text style={s.logoH}>H</Text></View>
        <Text style={s.brand}>HeadCount .</Text>
      </View>

      <View style={s.tabs}>
        {(['signin', 'signup'] as Mode[]).map(m => (
          <TouchableOpacity key={m} onPress={() => { setMode(m); setError(''); }} style={[s.tab, mode === m && s.tabActive]}>
            <Text style={[s.tabText, mode === m && s.tabTextActive]}>
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.form}>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#555" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#555" secureTextEntry value={password} onChangeText={setPassword} />
        {mode === 'signup' && (
          <TextInput style={s.input} placeholder="Confirm password" placeholderTextColor="#555" secureTextEntry value={confirm} onChangeText={setConfirm} />
        )}
        {!!error && <Text style={s.error}>{error}</Text>}
        <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#0a0a0a" /> : <Text style={s.btnText}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.skip} onPress={() => router.replace('/(tabs)/')}>
          <Text style={s.skipText}>Continue without account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#090909', justifyContent: 'center', paddingHorizontal: 28 },
  logo: { alignItems: 'center', marginBottom: 40, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  logoMark: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#c7ff4f', alignItems: 'center', justifyContent: 'center' },
  logoH: { fontWeight: '800', fontSize: 20, color: '#0a0a0a' },
  brand: { fontSize: 22, fontWeight: '700', color: '#f5f5f1' },
  tabs: { flexDirection: 'row', backgroundColor: '#171717', borderRadius: 14, padding: 4, marginBottom: 28 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#252525' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '500' },
  tabTextActive: { color: '#f5f5f1', fontWeight: '700' },
  form: { gap: 12 },
  input: { backgroundColor: '#171717', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#f5f5f1', borderWidth: 1, borderColor: '#252525' },
  error: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },
  btn: { backgroundColor: '#c7ff4f', borderRadius: 99, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  btnText: { fontSize: 15, fontWeight: '700', color: '#0a0a0a' },
  skip: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontSize: 13, color: '#555' },
});
