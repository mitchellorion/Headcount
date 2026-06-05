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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Plus, X } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { Chemistry, Vibe } from '@/types';
import { useContacts, useContact } from '@/store/ContactsContext';
import { useToast } from '@/components/Toast';
import { Field } from '@/components/Field';
import { ChipSelect } from '@/components/ChipSelect';
import { Button } from '@/components/Button';

const CHEMISTRY: readonly Chemistry[] = ['High', 'Medium', 'Low', 'Unsure'];
const VIBES: readonly Vibe[] = ['Easy', 'Playful', 'Intense', 'Slow burn', 'Unknown'];
const POSITIONS: readonly string[] = ['Top', 'Bottom', 'Side', 'Vers'];
const CUTS: readonly string[] = ['Cut', 'Uncut'];
const ZODIACS: readonly string[] = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

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
  const [photos, setPhotos] = useState<string[]>(editing?.photos ?? []);
  const [chemistry, setChemistry] = useState<Chemistry>(editing?.chemistry ?? 'Unsure');
  const [vibe, setVibe] = useState<Vibe>(editing?.vibe ?? 'Unknown');
  const [position, setPosition] = useState<string>(editing?.position ?? '');
  const [cut, setCut] = useState<string>(editing?.cut ?? '');
  const [zodiac, setZodiac] = useState<string>(editing?.zodiac ?? '');
  const [active, setActive] = useState(editing?.active ?? true);
  const [favorite, setFavorite] = useState(editing?.favorite ?? false);

  const canSave = name.trim().length > 0;

  const addPhoto = async () => {
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
      allowsMultipleSelection: true,
      allowsEditing: false,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length) {
      setPhotos((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removePhotoAt = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
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
      photos,
      position: position || undefined,
      cut: cut || undefined,
      zodiac: zodiac || undefined,
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
        {/* Photos */}
        <Text style={styles.fieldLabel}>PHOTOS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.photoRow}
          keyboardShouldPersistTaps="handled"
        >
          {photos.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.thumbWrap}>
              <Image source={{ uri }} style={styles.thumb} contentFit="cover" transition={150} />
              {i === 0 && (
                <View style={styles.coverBadge}>
                  <Text style={styles.coverText}>COVER</Text>
                </View>
              )}
              <Pressable
                onPress={() => removePhotoAt(i)}
                style={styles.thumbRemove}
                hitSlop={6}
                accessibilityLabel={`Remove photo ${i + 1}`}
              >
                <X size={13} color={colors.textStrong} />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={addPhoto}
            style={styles.addTile}
            accessibilityRole="button"
            accessibilityLabel="Add photo"
          >
            {photos.length === 0 ? (
              <ImagePlus size={22} color={colors.lime} />
            ) : (
              <Plus size={22} color={colors.lime} />
            )}
            <Text style={styles.addTileText}>{photos.length === 0 ? 'Add photos' : 'Add'}</Text>
          </Pressable>
        </ScrollView>
        <Text style={styles.photoHint}>First photo is the cover used on your roster.</Text>

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

        <ChipSelect label="Position" options={POSITIONS} value={position} onChange={setPosition} />
        <ChipSelect label="Cut" options={CUTS} value={cut} onChange={setCut} />
        <ChipSelect label="Zodiac" options={ZODIACS} value={zodiac} onChange={setZodiac} />
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

const THUMB = 96;

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
  fieldLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  photoRow: {
    gap: 10,
    paddingRight: 8,
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB * 1.25,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.panel2,
  },
  thumb: { width: '100%', height: '100%' },
  coverBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: colors.lime,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  coverText: {
    color: colors.onLime,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 1,
  },
  thumbRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: THUMB,
    height: THUMB * 1.25,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.panel3,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addTileText: { color: colors.subtle, fontFamily: fonts.bodyMedium, fontSize: 12 },
  photoHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 8, marginBottom: 20 },
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
