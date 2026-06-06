import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, CalendarDays, Heart, Star, TrendingUp, Users, Zap } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useContacts } from '@/store/ContactsContext';
import { AppHeader } from '@/components/AppHeader';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { contacts } = useContacts();

  const stats = useMemo(() => {
    const now = new Date();
    const thisYear = now.getFullYear();

    const total = contacts.length;
    const active = contacts.filter((c) => c.active).length;
    const favorites = contacts.filter((c) => c.favorite).length;
    const totalDates = contacts.reduce((n, c) => n + c.dates.length, 0);
    const totalNotes = contacts.reduce((n, c) => n + c.notes.length, 0);

    // Contacts added this year
    const addedThisYear = contacts.filter(
      (c) => new Date(c.createdAt).getFullYear() === thisYear
    ).length;

    // Most active month (by dates scheduled)
    const monthCounts: Record<number, number> = {};
    contacts.forEach((c) =>
      c.dates.forEach((d) => {
        const m = new Date(d.at).getMonth();
        monthCounts[m] = (monthCounts[m] ?? 0) + 1;
      })
    );
    let busiestMonth = -1;
    let busiestCount = 0;
    Object.entries(monthCounts).forEach(([m, count]) => {
      if (count > busiestCount) { busiestCount = count; busiestMonth = Number(m); }
    });

    // Chemistry breakdown
    const chemMap: Record<string, number> = {};
    contacts.forEach((c) => {
      chemMap[c.chemistry] = (chemMap[c.chemistry] ?? 0) + 1;
    });

    // Top locations
    const locMap: Record<string, number> = {};
    contacts.forEach((c) => {
      if (c.location) locMap[c.location] = (locMap[c.location] ?? 0) + 1;
    });
    const topLocations = Object.entries(locMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    // Top tags
    const tagMap: Record<string, number> = {};
    contacts.forEach((c) => {
      (c.tags ?? []).forEach((t) => { tagMap[t] = (tagMap[t] ?? 0) + 1; });
    });
    const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Last seen recently (within 7 days)
    const seenRecently = contacts.filter((c) => {
      if (!c.lastSeen) return false;
      return Date.now() - new Date(c.lastSeen).getTime() < 7 * 86_400_000;
    }).length;

    return {
      total, active, favorites, totalDates, totalNotes,
      addedThisYear, busiestMonth, busiestCount,
      chemMap, topLocations, topTags, seenRecently,
    };
  }, [contacts]);

  if (contacts.length === 0) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <AppHeader />
        <View style={styles.empty}>
          <TrendingUp size={40} color={colors.muted} />
          <Text style={styles.emptyTitle}>No stats yet</Text>
          <Text style={styles.emptySubtitle}>Add contacts and schedule dates to see your activity.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Stats</Text>
        <Text style={styles.subtitle}>Your headcount at a glance</Text>

        {/* Hero row */}
        <View style={styles.heroRow}>
          <StatTile icon={<Users size={18} color={colors.lime} />} value={stats.total} label="Total" />
          <StatTile icon={<Zap size={18} color={colors.lime} />} value={stats.active} label="Active" />
          <StatTile icon={<Heart size={18} color={colors.lime} />} value={stats.favorites} label="Faves" />
        </View>
        <View style={styles.heroRow}>
          <StatTile icon={<CalendarDays size={18} color={colors.lime} />} value={stats.totalDates} label="Dates" />
          <StatTile icon={<Activity size={18} color={colors.lime} />} value={stats.totalNotes} label="Notes" />
          <StatTile icon={<Star size={18} color={colors.lime} />} value={stats.seenRecently} label="Seen this week" />
        </View>

        {/* This year */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>This year</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>New connections</Text>
            <Text style={styles.cardValue}>{stats.addedThisYear}</Text>
          </View>
          {stats.busiestMonth >= 0 && (
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Most active month</Text>
              <Text style={styles.cardValue}>
                {MONTH_NAMES[stats.busiestMonth]} · {stats.busiestCount} date{stats.busiestCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Chemistry breakdown */}
        {Object.keys(stats.chemMap).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Chemistry</Text>
            {(['High', 'Medium', 'Low', 'Unsure'] as const).map((level) => {
              const count = stats.chemMap[level] ?? 0;
              if (count === 0) return null;
              const pct = stats.total > 0 ? count / stats.total : 0;
              return (
                <View key={level} style={styles.barRow}>
                  <Text style={styles.barLabel}>{level}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Top locations */}
        {stats.topLocations.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top locations</Text>
            {stats.topLocations.map(([loc, count]) => (
              <View key={loc} style={styles.cardRow}>
                <Text style={styles.cardLabel}>{loc}</Text>
                <Text style={styles.cardValue}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Top tags */}
        {stats.topTags.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top tags</Text>
            <View style={styles.tagRow}>
              {stats.topTags.map(([tag, count]) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <Text style={styles.tagChipCount}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <View style={styles.tile}>
      {icon}
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingHorizontal: 20, paddingTop: 22 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: -1 },
  subtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 4, marginBottom: 22 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyTitle: { color: colors.subtle, fontFamily: fonts.display, fontSize: 20 },
  emptySubtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
  heroRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tile: {
    flex: 1, backgroundColor: colors.panel, borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', paddingVertical: 18, gap: 6,
  },
  tileValue: { color: colors.textStrong, fontFamily: fonts.display, fontSize: 26, letterSpacing: -1 },
  tileLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 11 },
  card: {
    backgroundColor: colors.panel, borderRadius: 18,
    borderWidth: 1, borderColor: colors.line,
    padding: 16, marginBottom: 12,
  },
  cardTitle: { color: colors.text, fontFamily: fonts.bodyBold, fontSize: 14, marginBottom: 12 },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.lineSoft,
  },
  cardLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 13 },
  cardValue: { color: colors.textStrong, fontFamily: fonts.bodyMedium, fontSize: 13 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  barLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, width: 56 },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.panel2, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.lime, borderRadius: 3 },
  barCount: { color: colors.subtle, fontFamily: fonts.bodyMedium, fontSize: 12, width: 20, textAlign: 'right' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.limeSoft, borderWidth: 1, borderColor: colors.lime,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  tagChipText: { color: colors.lime, fontFamily: fonts.bodyMedium, fontSize: 12 },
  tagChipCount: {
    color: colors.onLime, fontFamily: fonts.bodyBold, fontSize: 10,
    backgroundColor: colors.lime, borderRadius: 999, paddingHorizontal: 5, paddingVertical: 1,
  },
});
