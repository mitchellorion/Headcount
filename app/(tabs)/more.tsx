import React, { useMemo } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Cloud,
  Download,
  Lock,
  LogOut,
  type LucideIcon,
  RotateCcw,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  Users,
} from 'lucide-react-native';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useContacts } from '@/store/ContactsContext';
import { useToast } from '@/components/Toast';
import { AppHeader } from '@/components/AppHeader';
import { SectionLabel } from '@/components/SectionLabel';
import { supabase } from '@/lib/supabase';
import { CloudRepository } from '@/store/CloudRepository';
import { Contact } from '@/types';

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { contacts, resetToSeed, clearAll, cloudUserId, syncToCloud } = useContacts();

  const stats = useMemo(() => {
    const active = contacts.filter((c) => c.active).length;
    const faves = contacts.filter((c) => c.favorite).length;
    return { total: contacts.length, active, faves };
  }, [contacts]);

  const onCloudBackup = async () => {
    if (!cloudUserId) {
      router.push('/auth');
      return;
    }
    try {
      await syncToCloud();
      toast.show('Contacts backed up to cloud.');
    } catch {
      toast.show('Backup failed. Check your connection.');
    }
  };

  const onSignOut = () => {
    Alert.alert('Sign out?', 'Your contacts stay on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          supabase.auth.signOut();
          toast.show('Signed out.');
        },
      },
    ]);
  };

  const onExport = async () => {
    try {
      const payload = JSON.stringify({ exportedAt: new Date().toISOString(), contacts }, null, 2);
      await Share.share({ title: 'HeadCount export', message: payload });
    } catch {
      toast.show('Export cancelled.');
    }
  };

  const onImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled) return;
      const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const parsed = JSON.parse(raw);
      const imported: Contact[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.contacts)
          ? parsed.contacts
          : null;
      if (!imported) {
        toast.show('Invalid file — expected a HeadCount export.');
        return;
      }
      Alert.alert(
        `Import ${imported.length} contacts?`,
        'This will merge with your current roster. Existing contacts with the same ID will be updated.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import',
            onPress: () => {
              imported.forEach((c) => {
                const existing = contacts.find((x) => x.id === c.id);
                if (existing) {
                  updateContact(c.id, c);
                } else {
                  addContact(c);
                }
              });
              toast.show(`Imported ${imported.length} contacts.`);
            },
          },
        ]
      );
    } catch {
      toast.show('Could not read file.');
    }
  };

  const { updateContact, addContact } = useContacts();

  const onReset = () => {
    Alert.alert(
      'Restore sample data?',
      'This replaces your current roster with the three sample contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: () => {
            resetToSeed();
            toast.show('Sample data restored.');
          },
        },
      ]
    );
  };

  const onClear = () => {
    Alert.alert(
      'Delete everything?',
      'This permanently removes every contact, note, and date. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete all',
          style: 'destructive',
          onPress: () => {
            clearAll();
            toast.show('All contacts deleted.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Manage your data and privacy</Text>

        <View style={styles.statsRow}>
          <Stat icon={Users} value={stats.total} label="Contacts" />
          <Stat icon={Star} value={stats.faves} label="Faves" />
          <Stat icon={Users} value={stats.active} label="Active" />
        </View>

        <SectionLabel style={styles.group}>Cloud backup</SectionLabel>
        <View style={styles.card}>
          {cloudUserId ? (
            <>
              <Row icon={Cloud} label="Back up now" hint="Push contacts to your account" onPress={onCloudBackup} />
              <Row icon={LogOut} label="Sign out" onPress={onSignOut} last />
            </>
          ) : (
            <Row icon={Cloud} label="Enable cloud backup" hint="Create a free account" onPress={onCloudBackup} last />
          )}
        </View>

        <SectionLabel style={styles.group}>Your data</SectionLabel>
        <View style={styles.card}>
          <Row icon={Download} label="Export data" hint="Share a JSON backup" onPress={onExport} />
          <Row icon={Upload} label="Import data" hint="Restore from a JSON backup" onPress={onImport} />
          <Row icon={RotateCcw} label="Restore sample data" onPress={onReset} />
          <Row icon={Trash2} label="Delete all contacts" danger onPress={onClear} last />
        </View>

        <SectionLabel style={styles.group}>Privacy</SectionLabel>
        <View style={styles.card}>
          <View style={styles.privacyHead}>
            <Lock size={16} color={colors.lime} />
            <Text style={styles.privacyTitle}>Your data, your choice</Text>
          </View>
          <Text style={styles.privacyBody}>
            HeadCount stores your roster locally on your phone by default. Cloud backup
            is optional — create a free account to sync across devices. Signing out or
            deleting the app removes local data.
          </Text>
        </View>

        <View style={styles.card}>
          <Row
            icon={ShieldCheck}
            label="Privacy policy"
            onPress={() =>
              Linking.openURL('https://mitchellorion.github.io/Headcount/privacy/').catch(() =>
                toast.show('Add your privacy URL before launch.')
              )
            }
            last
          />
        </View>

        <Text style={styles.version}>HeadCount v1.0.0 · ctrlaltorion</Text>
      </ScrollView>
    </View>
  );
}

function Stat({ icon: Icon, value, label }: { icon: LucideIcon; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon size={16} color={colors.lime} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  onPress,
  danger,
  last,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.rowPressed]}
    >
      <Icon size={18} color={danger ? colors.danger : colors.subtle} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: colors.danger }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {!danger && <ChevronRight size={16} color={colors.muted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingHorizontal: 20, paddingTop: 22 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: -1 },
  subtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  stat: {
    flex: 1,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { color: colors.textStrong, fontFamily: fonts.display, fontSize: 22 },
  statLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  group: { marginTop: 26, marginBottom: 12 },
  card: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 18,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  rowPressed: { opacity: 0.6 },
  rowLabel: { color: colors.textStrong, fontFamily: fonts.bodyMedium, fontSize: 14 },
  rowHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  privacyHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16 },
  privacyTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 13 },
  privacyBody: {
    color: colors.subtle,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 19,
    paddingVertical: 12,
  },
  version: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
  },
});
