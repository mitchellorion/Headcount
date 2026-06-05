import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { Chemistry, Vibe } from '@/types';
import { useContacts, useContact } from '@/store/ContactsContext';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { Field } from '@/components/Field';
import { ChipSelect } from '@/components/ChipSelect';
import { Button } from '@/components/Button';

const CHEMISTRY: readonly Chemistry[] = ['High', 'Medium', 'Low', 'Unsure'];
const VIBES: readonly Vibe[] = ['Easy', 'Playful', 'Intense', 'Slow burn', 'Unknown'];

export default function ContactFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = useContact(id);
  const isEdit = Boolean(editing);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { addContact, updateContact } = useContacts();

  const [name, setName] = useState(editing?.name ?? '');
  const [age, setAge] = useState(editing?.age ? String(editing.age) : '');
  const [role, setRole] = useState(editing?.role ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [tagline, setTagline] = useState(editing?.tagline ?? '');
  const [photoUri, setPhotoUri] = useState<string | undefined>(editing?.photoUri);
  const [chemistry, setChemistry] = useState<Chemistry>(editing?.chemistry ?? 'Unsure');
  const [vibe, setVibe] = useState<Vibe>(editing?.vibe ?? 'Unknown');
  const [active, setActive] = useState(editing?.active ?? true);
  const [favorite, setFavorite] = useState(editing?.favorite ?? false);

  const canSave = name.trim().length > 0;

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Photos access needed',
        'Enable photo access in Settings to add a picture.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSave = () => {
    if (!canSave) return;
    const ageNum = age.trim() ? Number(age.trim()) : undefined;
    const patch = {
      name: name.trim(),
      age: Number.isFinite(ageNum) ? ageNum : undefined,
      role: role.trim() || undefined,
      location: location.trim() || undefined,
      tagline: tagline.trim() || undefined,
      photoUri,
      chemistry,
      vibe,
      active,
      favorite,
    };

    if (isEdit && editing) {
      updateContact(editing.id, patch);
      toast.show('Contact updated.');
      router.back();
    } else {
      const created = addContact({
        ...patch,
        lastSeen: undefined,
      });
      toast.show(`${created.name} added.`);
      router.back();
    }
  };

  const title = useMemo(() => (isEdit ? 'Edit contact' : 'New contact'), [isEdit]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.title}>{title}</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.close}
          accessibilityLabel="Close"
        >
          <X size={18} color={colors.subtle} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoRow}>
          <Avatar uri={photoUri} name={name || '?'} size={84} radius={22} />
          <View style={styles.photoActions}>
            <Button label="Add photo" variant="ghost" icon={Camera} onPress={pickPhoto} />
            {photoUri ? (
              <Pressable onPress={() => setPhotoUri(undefined)} hitSlop={8}>
                <Text style={styles.removePhoto}>Remove photo</Text>
              </Pressable>
            ) : (
              <Text style={styles.photoHint}>Optional — initials show otherwise.</Text>
            )}
          </View>
        </View>

        <Field
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="First name"
          autoCapitalize="words"
        />
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Field
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="—"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          <View style={{ flex: 2 }}>
            <Field
              label="Role / tagline"
              value={role}
              onChangeText={setRole}
              placeholder="Architect"
            />
          </View>
        </View>
        <Field
          label="Location"
          value={location}
          onChangeText={setLocation}
          placeholder="Atlanta"
        />
        <Field
          label="Quick note"
          value={tagline}
          onChangeText={setTagline}
          placeholder="Where you met, what stood out…"
          multiline
        />

        <ChipSelect
          label="Chemistry"
          options={CHEMISTRY}
          value={chemistry}
          onChange={setChemistry}
        />
        <ChipSelect label="Vibe" options={VIBES} value={vibe} onChange={setVibe} />

        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Active</Text>
            <Text style={styles.toggleHint}>Currently in the rotation</Text>
          </View>
          <Switch
            value={active}
            onValueChange={setActive}
            trackColor={{ false: colors.line, true: colors.lime }}
            thumbColor={colors.textStrong}
          />
        </View>
        <View style={styles.toggleRow}>
          <View>
            <Text style={styles.toggleLabel}>Favorite</Text>
            <Text style={styles.toggleHint}>Pin to your Faves tab</Text>
          </View>
          <Switch
            value={favorite}
            onValueChange={setFavorite}
            trackColor={{ false: colors.line, true: colors.lime }}
            thumbColor={colors.textStrong}
          />
        </View>

        <Button
          label={isEdit ? 'Save changes' : 'Add to roster'}
          onPress={onSave}
          disabled={!canSave}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 22 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  photoActions: { flex: 1, gap: 8, alignItems: 'flex-start' },
  photoHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  removePhoto: { color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 12 },
  twoCol: { flexDirection: 'row', gap: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  toggleLabel: { color: colors.textStrong, fontFamily: fonts.bodyMedium, fontSize: 14 },
  toggleHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
});
