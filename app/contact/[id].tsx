import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  CalendarDays,
  ChevronLeft,
  Heart,
  MapPin,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useContacts, useContact } from '@/store/ContactsContext';
import { useToast } from '@/components/Toast';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Tag } from '@/components/Tag';
import { SectionLabel } from '@/components/SectionLabel';
import { formatDayTime, formatRelative, formatShortDate, isUpcoming } from '@/utils/date';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const contact = useContact(id);
  const {
    toggleFavorite,
    toggleActive,
    addNote,
    removeNote,
    removeDate,
    removeContact,
    markSeenNow,
  } = useContacts();

  const [noteText, setNoteText] = useState('');
  const [composing, setComposing] = useState(false);

  if (!contact) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.missing}>This contact is no longer available.</Text>
        <Button label="Back to roster" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  const meta = [
    contact.age ? String(contact.age) : null,
    contact.role,
    contact.location,
  ]
    .filter(Boolean)
    .join(' · ');

  const upcoming = contact.dates.find((d) => isUpcoming(d.at));

  const onSaveNote = () => {
    const body = noteText.trim();
    if (!body) return;
    addNote(contact.id, body);
    setNoteText('');
    setComposing(false);
    toast.show('Note added.');
  };

  const onDelete = () => {
    Alert.alert(
      `Remove ${contact.name}?`,
      'This permanently deletes this contact and their notes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeContact(contact.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back to roster"
        >
          <ChevronLeft size={20} color={colors.subtle} />
        </Pressable>
        <SectionLabel>Contact</SectionLabel>
        <Pressable
          onPress={() => toggleFavorite(contact.id)}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel={contact.favorite ? 'Unfavorite' : 'Favorite'}
        >
          <Heart
            size={18}
            color={contact.favorite ? colors.lime : colors.subtle}
            fill={contact.favorite ? colors.lime : 'transparent'}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          {contact.photoUri ? (
            <Image
              source={{ uri: contact.photoUri }}
              style={styles.heroImg}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]}>
              <Avatar name={contact.name} size={96} radius={28} />
            </View>
          )}
          <View style={styles.heroScrim} />
          <View style={styles.heroContent}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroName}>{contact.name}</Text>
              {!!meta && (
                <View style={styles.metaRow}>
                  {contact.location ? (
                    <MapPin size={12} color="#d4d4d4" />
                  ) : null}
                  <Text style={styles.heroMeta}>{meta}</Text>
                </View>
              )}
            </View>
            <Pressable onPress={() => toggleActive(contact.id)}>
              <Tag
                label={contact.active ? 'Active' : 'Idle'}
                tone={contact.active ? 'lime' : 'muted'}
              />
            </Pressable>
          </View>
        </View>

        {/* Latest note */}
        <View style={styles.card}>
          <View style={styles.cardHeadRow}>
            <View style={styles.cardHead}>
              <Sparkles size={16} color={colors.lime} />
              <Text style={styles.cardTitle}>Your note</Text>
            </View>
            {!composing && (
              <Pressable onPress={() => setComposing(true)} hitSlop={8}>
                <Text style={styles.link}>Add</Text>
              </Pressable>
            )}
          </View>

          {composing && (
            <View style={styles.composer}>
              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="What do you want to remember?"
                placeholderTextColor={colors.muted}
                style={styles.composerInput}
                multiline
                autoFocus
              />
              <View style={styles.composerActions}>
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={() => {
                    setComposing(false);
                    setNoteText('');
                  }}
                  style={styles.composerBtn}
                />
                <Button
                  label="Save note"
                  onPress={onSaveNote}
                  style={styles.composerBtn}
                />
              </View>
            </View>
          )}

          {contact.notes.length === 0 && !composing ? (
            <Text style={styles.noteEmpty}>
              No notes yet. Jot down what stood out.
            </Text>
          ) : (
            contact.notes.map((n) => (
              <Pressable
                key={n.id}
                onLongPress={() =>
                  Alert.alert('Delete note?', n.body, [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => removeNote(contact.id, n.id),
                    },
                  ])
                }
                style={styles.noteRow}
              >
                <Text style={styles.noteBody}>{n.body}</Text>
                <Text style={styles.noteTime}>{formatRelative(n.createdAt)}</Text>
              </Pressable>
            ))
          )}
        </View>

        {/* Next up */}
        {upcoming ? (
          <View style={styles.card}>
            <View style={styles.nextRow}>
              <View style={{ flex: 1 }}>
                <SectionLabel>Next up</SectionLabel>
                <Text style={styles.nextText}>
                  {upcoming.label ? `${upcoming.label} · ` : ''}
                  {formatDayTime(upcoming.at)}
                  {upcoming.place ? ` · ${upcoming.place}` : ''}
                </Text>
              </View>
              <Pressable
                onPress={() => removeDate(contact.id, upcoming.id)}
                style={styles.nextIcon}
                accessibilityLabel="Remove planned date"
              >
                <CalendarDays size={16} color={colors.lime} />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Quick read */}
        <View style={{ marginTop: 20 }}>
          <SectionLabel>Quick read</SectionLabel>
          <View style={styles.facts}>
            <FactRow label="Chemistry" value={contact.chemistry} />
            <FactRow label="Vibe" value={contact.vibe} />
            <FactRow
              label="Last seen"
              value={contact.lastSeen ? formatShortDate(contact.lastSeen) : '—'}
            />
            <FactRow
              label="Added"
              value={formatShortDate(contact.createdAt)}
              last
            />
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Mark seen today"
            onPress={() => {
              markSeenNow(contact.id);
              toast.show('Updated last seen.');
            }}
            style={{ flex: 1 }}
          />
          <Button
            label="Edit"
            variant="ghost"
            onPress={() => router.push(`/contact/form?id=${contact.id}`)}
            style={{ flex: 1 }}
          />
        </View>

        <Pressable onPress={onDelete} style={styles.deleteRow}>
          <Trash2 size={15} color={colors.danger} />
          <Text style={styles.deleteText}>Remove contact</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function FactRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.factRow, last && { borderBottomWidth: 0 }]}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  missing: { color: colors.subtle, fontFamily: fonts.body, fontSize: 15 },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  hero: {
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImg: { width: '100%', height: 288 },
  heroFallback: {
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 128,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  heroName: {
    color: colors.textStrong,
    fontFamily: fonts.display,
    fontSize: 26,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  heroMeta: { color: '#d4d4d4', fontFamily: fonts.body, fontSize: 12 },
  card: {
    marginTop: 16,
    backgroundColor: colors.panel2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 16,
  },
  cardHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 14,
  },
  link: { color: colors.lime, fontFamily: fonts.bodyBold, fontSize: 13 },
  noteEmpty: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 10,
  },
  noteRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 12,
  },
  noteBody: {
    color: '#cfcfcf',
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
  },
  noteTime: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 6,
  },
  composer: { marginTop: 12 },
  composerInput: {
    backgroundColor: colors.panel3,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    padding: 12,
    minHeight: 80,
    color: colors.textStrong,
    fontFamily: fonts.body,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  composerActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  composerBtn: { flex: 1, paddingVertical: 11 },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextText: {
    color: colors.textStrong,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 6,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.limeSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facts: {
    marginTop: 12,
    backgroundColor: colors.panel3,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  factLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  factValue: { color: colors.textStrong, fontFamily: fonts.bodyMedium, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    paddingVertical: 12,
  },
  deleteText: { color: colors.danger, fontFamily: fonts.bodyMedium, fontSize: 13 },
});
