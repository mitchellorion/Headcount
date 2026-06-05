import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useContacts } from '@/store/ContactsContext';
import { AppHeader } from '@/components/AppHeader';
import { ContactCard } from '@/components/ContactCard';
import { EmptyState } from '@/components/EmptyState';

export default function FavesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { contacts, toggleFavorite } = useContacts();

  const faves = useMemo(
    () =>
      contacts
        .filter((c) => c.favorite)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        ),
    [contacts]
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Faves</Text>
        <Text style={styles.subtitle}>
          {faves.length} {faves.length === 1 ? 'favorite' : 'favorites'}
        </Text>

        {faves.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            subtitle="Tap the heart on anyone in your roster to pin them here."
          />
        ) : (
          <View style={styles.list}>
            {faves.map((c) => (
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
  screen: { flex: 1, backgroundColor: colors.ink },
  scroll: { paddingHorizontal: 20, paddingTop: 22 },
  title: { color: colors.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: -1 },
  subtitle: { color: colors.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 4 },
  list: { gap: 12, marginTop: 22 },
});
