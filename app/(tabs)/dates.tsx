import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  X,
} from 'lucide-react-native';
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

type CalendarMode = 'month' | 'week';

interface Row {
  contact: Contact;
  dateId: string;
  at: string;
  place: string;
  label?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DatesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { contacts, addDate, removeDate } = useContacts();
  const [showSchedule, setShowSchedule] = useState(false);
  const [calMode, setCalMode] = useState<CalendarMode>('month');
  const [calAnchor, setCalAnchor] = useState(new Date());

  const allRows = useMemo(() => {
    const rows: Row[] = [];
    contacts.forEach((c) =>
      c.dates.forEach((d) =>
        rows.push({ contact: c, dateId: d.id, at: d.at, place: d.place, label: d.label })
      )
    );
    return rows;
  }, [contacts]);

  const { upcoming, past } = useMemo(() => {
    const up = allRows
      .filter((r) => isUpcoming(r.at))
      .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const pa = allRows
      .filter((r) => !isUpcoming(r.at))
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { upcoming: up, past: pa };
  }, [allRows]);

  // Map of "YYYY-MM-DD" -> rows for the calendar dots
  const dateMap = useMemo(() => {
    const m: Record<string, Row[]> = {};
    allRows.forEach((r) => {
      const key = r.at.slice(0, 10);
      if (!m[key]) m[key] = [];
      m[key].push(r);
    });
    return m;
  }, [allRows]);

  const todayStr = new Date().toISOString().slice(0, 10);

  // ── Month helpers ──────────────────────────────────────────────
  const monthYear = `${MONTH_NAMES[calAnchor.getMonth()]} ${calAnchor.getFullYear()}`;

  const monthDays = useMemo(() => {
    const year = calAnchor.getFullYear();
    const month = calAnchor.getMonth();
    const first = new Date(year, month, 1).getDay();
    const total = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(first).fill(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [calAnchor]);

  function prevMonth() {
    setCalAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCalAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1));
  }

  // ── Week helpers ───────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const anchor = new Date(calAnchor);
    const dow = anchor.getDay();
    anchor.setDate(anchor.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor);
      d.setDate(anchor.getDate() + i);
      return d;
    });
  }, [calAnchor]);

  const weekLabel = useMemo(() => {
    const s = weekDays[0];
    const e = weekDays[6];
    if (s.getMonth() === e.getMonth())
      return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`;
    return `${MONTH_NAMES[s.getMonth()]} ${s.getDate()} – ${MONTH_NAMES[e.getMonth()]} ${e.getDate()}`;
  }, [weekDays]);

  function prevWeek() {
    setCalAnchor((a) => { const d = new Date(a); d.setDate(d.getDate() - 7); return d; });
  }
  function nextWeek() {
    setCalAnchor((a) => { const d = new Date(a); d.setDate(d.getDate() + 7); return d; });
  }

  function dayKey(d: Date) {
    return d.toISOString().slice(0, 10);
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title row */}
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

        {/* Calendar card */}
        <View style={styles.calCard}>
          {/* Mode toggle */}
          <View style={styles.modeRow}>
            <Pressable
              onPress={() => setCalMode('month')}
              style={[styles.modeBtn, calMode === 'month' && styles.modeBtnSel]}
            >
              <Text style={[styles.modeTxt, calMode === 'month' && styles.modeTxtSel]}>Month</Text>
            </Pressable>
            <Pressable
              onPress={() => setCalMode('week')}
              style={[styles.modeBtn, calMode === 'week' && styles.modeBtnSel]}
            >
              <Text style={[styles.modeTxt, calMode === 'week' && styles.modeTxtSel]}>Week</Text>
            </Pressable>
          </View>

          {/* Nav row */}
          <View style={styles.navRow}>
            <Pressable
              onPress={calMode === 'month' ? prevMonth : prevWeek}
              hitSlop={10}
              style={styles.navBtn}
            >
              <ChevronLeft size={18} color={colors.subtle} />
            </Pressable>
            <Text style={styles.navLabel}>
              {calMode === 'month' ? monthYear : weekLabel}
            </Text>
            <Pressable
              onPress={calMode === 'month' ? nextMonth : nextWeek}
              hitSlop={10}
              style={styles.navBtn}
            >
              <ChevronRight size={18} color={colors.subtle} />
            </Pressable>
          </View>

          {/* Day-of-week headers */}
          <View style={styles.dowRow}>
            {DAY_LABELS.map((l, i) => (
              <Text key={i} style={styles.dowLabel}>{l}</Text>
            ))}
          </View>

          {calMode === 'month' ? (
            <View style={styles.grid}>
              {monthDays.map((day, i) => {
                if (day === null) return <View key={`e-${i}`} style={styles.cell} />;
                const key = `${calAnchor.getFullYear()}-${String(calAnchor.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasDates = !!dateMap[key];
                const isToday = key === todayStr;
                return (
                  <View key={key} style={styles.cell}>
                    <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                      <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{day}</Text>
                    </View>
                    {hasDates && <View style={styles.dot} />}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.weekRow}>
              {weekDays.map((d) => {
                const key = dayKey(d);
                const hasDates = !!dateMap[key];
                const isToday = key === todayStr;
                return (
                  <View key={key} style={styles.weekCell}>
                    <View style={[styles.dayCircle, isToday && styles.dayCircleToday]}>
                      <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>
                        {d.getDate()}
                      </Text>
                    </View>
                    {hasDates && <View style={styles.dot} />}
                  </View>
                );
              })}
            </View>
          )}

          {/* Events for visible period */}
          {(() => {
            const visibleKeys = calMode === 'month'
              ? monthDays
                  .filter((d): d is number => d !== null)
                  .map((d) => `${calAnchor.getFullYear()}-${String(calAnchor.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
              : weekDays.map(dayKey);
            const events = visibleKeys.flatMap((k) => dateMap[k] ?? []);
            if (events.length === 0) return null;
            return (
              <View style={styles.calEvents}>
                {events.map((r) => (
                  <Pressable
                    key={r.dateId}
                    onPress={() => router.push(`/contact/${r.contact.id}`)}
                    style={styles.calEventRow}
                  >
                    <View style={styles.calDot} />
                    <Text style={styles.calEventName}>{r.contact.name}</Text>
                    <Text style={styles.calEventTime}>{formatDayTime(r.at)}</Text>
                    {r.place ? <Text style={styles.calEventPlace}>· {r.place}</Text> : null}
                  </Pressable>
                ))}
              </View>
            );
          })()}
        </View>

        {/* Lists */}
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
                      onRemove={() => { removeDate(r.contact.id, r.dateId); toast.show('Date removed.'); }}
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
                      onRemove={() => { removeDate(r.contact.id, r.dateId); toast.show('Date removed.'); }}
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
  row, past, onPressContact, onRemove,
}: {
  row: Row; past?: boolean; onPressContact: () => void; onRemove: () => void;
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
              <Text style={styles.rowMetaText} numberOfLines={1}>{row.place}</Text>
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
  visible, contacts, onClose, onSchedule,
}: {
  visible: boolean;
  contacts: Contact[];
  onClose: () => void;
  onSchedule: (contactId: string, at: Date, place: string, label?: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const [contactId, setContactId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [place, setPlace] = useState('');
  const [label, setLabel] = useState('');

  const reset = () => {
    setContactId(null);
    setSelectedDate(new Date());
    setShowDatePicker(false);
    setShowTimePicker(false);
    setPlace('');
    setLabel('');
  };

  const submit = () => {
    if (!contactId) return;
    onSchedule(contactId, selectedDate, place.trim(), label.trim() || undefined);
    reset();
  };

  const formatSelectedDate = (d: Date) => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const formatSelectedTime = (d: Date) => {
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule a date</Text>
            <Pressable onPress={() => { reset(); onClose(); }} style={styles.close}>
              <X size={18} color={colors.subtle} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {contacts.length === 0 ? (
              <Text style={styles.modalHint}>Add a contact first, then you can schedule a date.</Text>
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
                        <Text style={[styles.whoName, sel && styles.whoNameSel]}>{c.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <SectionLabel style={styles.modalLabel}>When</SectionLabel>
                <View style={styles.pickerRow}>
                  <Pressable
                    onPress={() => { setShowDatePicker(true); setShowTimePicker(false); }}
                    style={[styles.pickerBtn, showDatePicker && styles.pickerBtnSel]}
                  >
                    <CalendarDays size={14} color={showDatePicker ? colors.onLime : colors.subtle} />
                    <Text style={[styles.pickerBtnTxt, showDatePicker && styles.pickerBtnTxtSel]}>
                      {formatSelectedDate(selectedDate)}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setShowTimePicker(true); setShowDatePicker(false); }}
                    style={[styles.pickerBtn, showTimePicker && styles.pickerBtnSel]}
                  >
                    <Clock size={14} color={showTimePicker ? colors.onLime : colors.subtle} />
                    <Text style={[styles.pickerBtnTxt, showTimePicker && styles.pickerBtnTxtSel]}>
                      {formatSelectedTime(selectedDate)}
                    </Text>
                  </Pressable>
                </View>

                {(showDatePicker || showTimePicker) && (
                  <View style={styles.pickerContainer}>
                    <DateTimePicker
                      value={selectedDate}
                      mode={showDatePicker ? 'date' : 'time'}
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      themeVariant="dark"
                      minimumDate={showDatePicker ? new Date() : undefined}
                      onChange={(_event, date) => {
                        if (date) setSelectedDate(date);
                        if (Platform.OS === 'android') {
                          setShowDatePicker(false);
                          setShowTimePicker(false);
                        }
                      }}
                    />
                  </View>
                )}

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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingHorizontal: 20, paddingTop: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: -1 },
  subtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center',
  },

  // Calendar card
  calCard: {
    marginTop: 22,
    backgroundColor: colors.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: colors.panel2,
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    alignSelf: 'center',
    gap: 2,
  },
  modeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 10,
  },
  modeBtnSel: { backgroundColor: colors.lime },
  modeTxt: { color: colors.subtle, fontFamily: fonts.bodyMedium, fontSize: 13 },
  modeTxtSel: { color: colors.onLime, fontFamily: fonts.bodyBold },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: { padding: 4 },
  navLabel: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14 },
  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dowLabel: {
    flex: 1, textAlign: 'center',
    color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: 11,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekRow: { flexDirection: 'row' },
  weekCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  dayCircleToday: { backgroundColor: colors.lime },
  dayNum: { color: colors.subtle, fontFamily: fonts.body, fontSize: 13 },
  dayNumToday: { color: colors.onLime, fontFamily: fonts.bodyBold },
  dot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: colors.lime, marginTop: 2,
  },
  calEvents: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    paddingTop: 12,
    gap: 8,
  },
  calEventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.lime,
  },
  calEventName: { color: colors.textStrong, fontFamily: fonts.bodyBold, fontSize: 13 },
  calEventTime: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },
  calEventPlace: { color: colors.muted, fontFamily: fonts.body, fontSize: 12 },

  // Lists
  section: { marginTop: 26 },
  list: { gap: 12, marginTop: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.panel2, borderWidth: 1,
    borderColor: colors.lineSoft, borderRadius: 16, padding: 12,
  },
  rowName: { color: colors.textStrong, fontFamily: fonts.bodyBold, fontSize: 14 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  rowMetaText: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  rowRemove: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: colors.panel,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: colors.line,
    paddingHorizontal: 20, paddingTop: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  modalTitle: { color: colors.text, fontFamily: fonts.display, fontSize: 20 },
  modalHint: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, paddingVertical: 12 },
  modalLabel: { marginTop: 14, marginBottom: 10 },
  close: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  whoRow: { gap: 10, paddingRight: 8 },
  whoChip: {
    alignItems: 'center', gap: 6, padding: 8,
    borderRadius: 14, borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.panel2, width: 72,
  },
  whoChipSel: { borderColor: colors.lime, backgroundColor: colors.limeSoft },
  whoName: { color: colors.subtle, fontFamily: fonts.bodyMedium, fontSize: 11 },
  whoNameSel: { color: colors.lime },
  pickerRow: { flexDirection: 'row', gap: 10 },
  pickerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.panel2, borderWidth: 1,
    borderColor: colors.line, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  pickerBtnSel: { borderColor: colors.lime, backgroundColor: colors.limeSoft },
  pickerBtnTxt: { color: colors.subtle, fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 },
  pickerBtnTxtSel: { color: colors.lime },
  pickerContainer: {
    marginTop: 8,
    backgroundColor: colors.panel2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  modalInput: {
    backgroundColor: colors.panel3, borderWidth: 1,
    borderColor: colors.line, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    color: colors.textStrong, fontFamily: fonts.body, fontSize: 15,
  },
});
