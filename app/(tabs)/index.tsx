import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Search, SlidersHorizontal, UserPlus, Users } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useContacts } from '@/store/ContactsContext';
import { AppHeader } from '@/components/AppHeader';
import { ContactCard } from '@/components/ContactCard';
import { EmptyState } from '@/components/EmptyState';
import { SectionLabel } from '@/components/SectionLabel';
import { eyebrowForNow } from '@/utils/date';

type SortMode = 'recent' | 'active' | 'name';
const SORT_LABEL: Record<SortMode, string> = {
  recent: 'Recently updated',
  active: 'Active first',
  name: 'Name A–Z',
};
const SORT_ORDER: SortMode[] = ['recent', 'active', 'name'];

export default function RosterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contacts, hydrated, toggleFavorite } = useContacts();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('recent');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = contacts;
    if (q) {
      list = contacts.filter((c) => {
        const hay = [
          c.name,
          c.role,
          c.location,
          c.tagline,
          ...c.notes.map((n) => n.body),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return hay.includes(q);
      });
    }
    const sorted = [...list];
    if (sort === 'recent') {
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    } else if (sort === 'active') {
      sorted.sort((a, b) => Number(b.active) - Number(a.active));
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [contacts, query, sort]);

  const activeCount = contacts.filter((c) => c.active).length;

  const cycleSort = () => {
    const idx = SORT_ORDER.indexOf(sort);
    setSort(SORT_ORDER[(idx + 1) % SORT_ORDER.length]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <SectionLabel style={styles.eyebrow}>{eyebrowForNow()}</SectionLabel>
            <Text style={styles.title}>Your roster</Text>
            <Text style={styles.subtitle}>
              {contacts.length} {contacts.length === 1 ? 'connection' : 'connections'}
              {activeCount > 0 ? ` · ${activeCount} active` : ''}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/contact/form')}
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Add contact"
          >
            <Plus size={22} color={colors.onLime} />
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <Search size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search your list"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
        </View>

        <View style={styles.listHeader}>
          <SectionLabel>{query ? 'Results' : SORT_LABEL[sort]}</SectionLabel>
          <Pressable
            onPress={cycleSort}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Change sort order"
          >
            <SlidersHorizontal size={16} color={colors.muted} />
          </Pressable>
        </View>

        {!hydrated ? null : filtered.length === 0 ? (
          query ? (
            <EmptyState
              icon={Search}
              title="No matches"
              subtitle={`Nothing matches “${query.trim()}”.`}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="Your roster is empty"
              subtitle="Add the first person you're keeping track of."
            >
              <Pressable
                onPress={() => router.push('/contact/form')}
                style={styles.emptyCta}
              >
                <UserPlus size={16} color={colors.onLime} />
                <Text style={styles.emptyCtaText}>Add a contact</Text>
              </Pressable>
            </EmptyState>
          )
        ) : (
          <View style={styles.list}>
            {filtered.map((c) => (
              <ContactCard
                key={c.id}
                contact={c}
                onPress={() => router.push(`/contact/${c.id}`)}
                onToggleFavorite={() => toggleFavorite(c.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  eyebrow: {
    color: colors.muted,
    letterSpacing: 2.4,
    fontSize: 11,
    fontFamily: fonts.bodyBold,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: -1,
    marginTop: 4,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    padding: 0,
  },
  listHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  list: {
    gap: 12,
  },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.lime,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyCtaText: {
    color: colors.onLime,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
});
