import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { Contact } from '@/types';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { Avatar } from '@/components/Avatar';
import { StatusDot } from '@/components/StatusDot';
import { formatDayTime, isUpcoming } from '@/utils/date';

interface Props {
  contact: Contact;
  onPress: () => void;
  onToggleFavorite?: () => void;
}

export function ContactCard({ contact, onPress, onToggleFavorite }: Props) {
  const upcoming = contact.dates.find((d) => isUpcoming(d.at));
  const subtitle = [contact.age ? String(contact.age) : null, contact.role]
    .filter(Boolean)
    .join(' · ');

  const note = upcoming
    ? `${upcoming.label ? upcoming.label + ' · ' : ''}${formatDayTime(upcoming.at)}`
    : contact.tagline || contact.notes[0]?.body || 'No notes yet';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Open ${contact.name}`}
    >
      <Avatar uri={contact.photos[0]} name={contact.name} size={64} radius={14} />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.nameWrap}>
            <Text style={styles.name} numberOfLines={1}>
              {contact.name}
            </Text>
            {!!subtitle && (
              <Text style={styles.meta} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          {onToggleFavorite ? (
            <Pressable
              hitSlop={10}
              onPress={onToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel={
                contact.favorite ? 'Remove favorite' : 'Add favorite'
              }
            >
              <Heart
                size={16}
                color={contact.favorite ? colors.lime : colors.dotIdle}
                fill={contact.favorite ? colors.lime : 'transparent'}
              />
            </Pressable>
          ) : (
            <StatusDot active={contact.active} />
          )}
        </View>
        <Text style={styles.note} numberOfLines={1}>
          {note}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.panel2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
  },
  pressed: {
    backgroundColor: '#1a1a1a',
    borderColor: 'rgba(199,255,79,0.18)',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameWrap: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: colors.textStrong,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  meta: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 2,
  },
  note: {
    color: '#bdbdbd',
    fontFamily: fonts.body,
    fontSize: 11,
    marginTop: 8,
  },
});
