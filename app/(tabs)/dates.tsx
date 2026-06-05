import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CalendarDays, CalendarPlus, Clock, MapPin, X } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { Contact } from '@/types';
import { useContacts } from '@/store/ContactsContext';
import { useToast } from '@/components/Toast';
import { AppHeader } from '@/components/AppHeader';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SectionLabel } from '@/components/SectionLabel';
import { formatDayTime, formatShortDate, isUpcoming } from '@/utils/date';

interface Row {
  contact: Contact;
  dateId: string;
  at: string;
  place: string;
  label?: string;
}

const TIME_PRESETS: { key: string; label: string; build: () => Date }[] = [
  { key: 'tonight', label: 'Tonight · 8:30', build: () => atTime(0, 20, 30) },
  { key: 'tomorrow', label: 'Tomorrow · 8:00', build: () => atTime(1, 20, 0) },
  { key: 'friday', label: 'Fri · 8:30', build: () => nextWeekday(5, 20, 30) },
  { key: 'saturday', label: 'Sat · 9:00', build: () => nextWeekday(6, 21, 0) },
];

export default function DatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { contacts, addDate, removeDate } = useContacts();
  const [showSchedule, setShowSchedule] = useState(false);

  const { upcoming, past } = useMemo(() => {
    const rows: Row[] = [];
    contacts.forEach((c) =>
      c.dates.forEach((d) =>
        rows.push({
          contact: c,
          dateId: d.id,
          at: d.at,
          place: d.place,
          label: d.label,
        })
      )
    );
    const up = rows
      .filter((r) => isUpcoming(r.at))
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const pa = rows
      .filter((r) => !isUpcoming(r.at))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { upcoming: up, past: pa };
  }, [contacts]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dates</Text>
            <Text style={styles.subtitle}>
              {upcoming.length} upcoming · {past.length} logged
            </Text>
          </View>
          <Pressable
            onPress={() => setShowSchedule(true)}
            style={styles.addBtn}
            accessibilityLabel="Schedule a date"
          >
            <CalendarPlus size={20} color={colors.onLime} />
          </Pressable>
        </View>

        {upcoming.length === 0 && past.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No dates yet"
            subtitle="Schedule a meetup and it'll show up here and on the contact."
          >
            <Button label="Schedule a date" onPress={() => setShowSchedule(true)} />
          </EmptyState>
        ) : (
          <>
            {upcoming.length > 0 && (
              <View style={styles.section}>
                <SectionLabel>Upcoming</SectionLabel>
                <View style={styles.list}>
                  {upcoming.map((r) => (
                    <DateRow
                      key={r.dateId}
                      row={r}
                      onPressContact={() => router.push(`/contact/${r.contact.id}`)}
                      onRemove={() => {
                        removeDate(r.contact.id, r.dateId);
                        toast.show('Date removed.');
                      }}
                    />
                  ))}
                </View>
              </View>
            )}
            {past.length > 0 && (
              <View style={styles.section}>
                <SectionLabel>Logged</SectionLabel>
                <View style={styles.list}>
                  {past.map((r) => (
                    <DateRow
                      key={r.dateId}
                      row={r}
                      past
                      onPressContact={() => router.push(`/contact/${r.contact.id}`)}
                      onRemove={() => {
                        removeDate(r.contact.id, r.dateId);
                        toast.show('Date removed.');
                      }}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <ScheduleModal
        visible={showSchedule}
        contacts={contacts}
        onClose={() => setShowSchedule(false)}
        onSchedule={(contactId, at, place, label) => {
          addDate(contactId, { at: at.toISOString(), place, label });
          setShowSchedule(false);
          toast.show('Date scheduled.');
        }}
      />
    </View>
  );
}

function DateRow({
  row,
  past,
  onPressContact,
  onRemove,
}: {
  row: Row;
  past?: boolean;
  onPressContact: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable onPress={onPressContact} style={styles.row}>
      <Avatar uri={row.contact.photos[0]} name={row.contact.name} size={48} radius={12} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rowName}>{row.contact.name}</Text>
        <View style={styles.rowMeta}>
          <Clock size={11} color={colors.muted} />
          <Text style={styles.rowMetaText}>
            {past ? formatShortDate(row.at) : formatDayTime(row.at)}
          </Text>
          {row.place ? (
            <>
              <MapPin size={11} color={colors.muted} />
              <Text style={styles.rowMetaText} numberOfLines={1}>
                {row.place}
              </Text>
            </>
          ) : null}
        </View>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} style={styles.rowRemove}>
        <X size={16} color={colors.muted} />
      </Pressable>
    </Pressable>
  );
}

function ScheduleModal({
  visible,
  contacts,
  onClose,
  onSchedule,
}: {
  visible: boolean;
  contacts: Contact[];
  onClose: () => void;
  onSchedule: (contactId: string, at: Date, place: string, label?: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [contactId, setContactId] = useState<string | null>(null);
  const [presetKey, setPresetKey] = useState(TIME_PRESETS[0].key);
  const [place, setPlace] = useState('');
  const [label, setLabel] = useState('');

  const reset = () => {
    setContactId(null);
    setPresetKey(TIME_PRESETS[0].key);
    setPlace('');
    setLabel('');
  };

  const submit = () => {
    if (!contactId) return;
    const preset = TIME_PRESETS.find((p) => p.key === presetKey) ?? TIME_PRESETS[0];
    onSchedule(contactId, preset.build(), place.trim(), label.trim() || undefined);
    reset();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule a date</Text>
            <Pressable
              onPress={() => {
                reset();
                onClose();
              }}
              style={styles.close}
            >
              <X size={18} color={colors.subtle} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {contacts.length === 0 ? (
              <Text style={styles.modalHint}>
                Add a contact first, then you can schedule a date.
              </Text>
            ) : (
              <>
                <SectionLabel style={styles.modalLabel}>Who</SectionLabel>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.whoRow}
                >
                  {contacts.map((c) => {
                    const sel = c.id === contactId;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setContactId(c.id)}
                        style={[styles.whoChip, sel && styles.whoChipSel]}
                      >
                        <Avatar uri={c.photos[0]} name={c.name} size={40} radius={12} />
                        <Text style={[styles.whoName, sel && styles.whoNameSel]}>
                          {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <SectionLabel style={styles.modalLabel}>When</SectionLabel>
                <View style={styles.presetRow}>
                  {TIME_PRESETS.map((p) => {
                    const sel = p.key === presetKey;
                    return (
                      <Pressable
                        key={p.key}
                        onPress={() => setPresetKey(p.key)}
                        style={[styles.preset, sel && styles.presetSel]}
                      >
                        <Text style={[styles.presetText, sel && styles.presetTextSel]}>
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <SectionLabel style={styles.modalLabel}>Where</SectionLabel>
                <TextInput
                  value={place}
                  onChangeText={setPlace}
                  placeholder="Bar, restaurant, neighborhood…"
                  placeholderTextColor={colors.muted}
                  style={styles.modalInput}
                />

                <SectionLabel style={styles.modalLabel}>Label (optional)</SectionLabel>
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Drinks, dinner, coffee…"
                  placeholderTextColor={colors.muted}
                  style={styles.modalInput}
                />

                <Button
                  label="Schedule"
                  onPress={submit}
                  disabled={!contactId}
                  style={{ marginTop: 18 }}
                />
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Returns a Date `addDays` from now at the given hour/minute. */
function atTime(addDays: number, hour: number, minute: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, minute, 0, 0);
  // if "tonight" already passed, push to tomorrow
  if (addDays === 0 && d.getTime() < Date.now()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

function nextWeekday(weekday: number, hour: number, minute: number): Date {
  const d = new Date();
  let add = (weekday - d.getDay() + 7) % 7;
  if (add === 0) add = 7;
  d.setDate(d.getDate() + add);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingHorizontal: 20, paddingTop: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: -1 },
  subtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: { marginTop: 26 },
  list: { gap: 12, marginTop: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 16,
    padding: 12,
  },
  rowName: { color: colors.textStrong, fontFamily: fonts.bodyBold, fontSize: 14 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  rowMetaText: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  rowRemove: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '86%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 20 },
  modalHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, paddingVertical: 12 },
  modalLabel: { marginTop: 14, marginBottom: 10 },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whoRow: { gap: 10, paddingRight: 8 },
  whoChip: {
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel2,
    width: 72,
  },
  whoChipSel: { borderColor: colors.lime, backgroundColor: colors.limeSoft },
  whoName: { color: colors.subtle, fontFamily: fonts.bodyMedium, fontSize: 11 },
  whoNameSel: { color: colors.lime },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel2,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  presetSel: { backgroundColor: colors.lime, borderColor: colors.lime },
  presetText: { color: colors.subtle, fontFamily: fonts.bodyMedium, fontSize: 13 },
  presetTextSel: { color: colors.onLime, fontFamily: fonts.bodyBold },
  modalInput: {
    backgroundColor: colors.panel3,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: colors.textStrong,
    fontFamily: fonts.body,
    fontSize: 15,
  },
});
