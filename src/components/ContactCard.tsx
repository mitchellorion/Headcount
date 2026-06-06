import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Heart, Trash2 } from 'lucide-react-native';
import { Contact } from '@/types';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { Avatar } from '@/components/Avatar';
import { StatusDot } from '@/components/StatusDot';
import { formatDayTime, isUpcoming } from '@/utils/date';

const SWIPE_THRESHOLD = 72;
const ACTION_WIDTH = 72;

interface Props {
  contact: Contact;
  onPress: () => void;
  onToggleFavorite?: () => void;
  onDelete?: () => void;
}

export function ContactCard({ contact, onPress, onToggleFavorite, onDelete }: Props) {
  const upcoming = contact.dates.find((d) => isUpcoming(d.at));
  const subtitle = [contact.age ? String(contact.age) : null, contact.role]
    .filter(Boolean)
    .join(' · ');

  const note = upcoming
    ? `${upcoming.label ? upcoming.label + ' · ' : ''}${formatDayTime(upcoming.at)}`
    : contact.tagline || contact.notes[0]?.body || 'No notes yet';

  const translateX = useRef(new Animated.Value(0)).current;
  const lastX = useRef(0);

  const onPanStart = () => { lastX.current = 0; };

  const onPanMove = (dx: number) => {
    const clamped = Math.max(-ACTION_WIDTH * 2 - 20, Math.min(0, dx));
    translateX.setValue(clamped);
    lastX.current = clamped;
  };

  const onPanEnd = () => {
    const x = lastX.current;
    if (x < -SWIPE_THRESHOLD * 2 && onDelete) {
      onDelete();
      return;
    }
    if (x < -SWIPE_THRESHOLD) {
      Animated.spring(translateX, { toValue: -ACTION_WIDTH * 2, useNativeDriver: true }).start();
    } else {
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  const close = () => Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();

  return (
    <View style={styles.wrapper}>
      {/* Actions revealed on swipe */}
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.limeSoft }]}
          onPress={() => { onToggleFavorite?.(); close(); }}
        >
          <Heart
            size={18}
            color={colors.lime}
            fill={contact.favorite ? colors.lime : 'transparent'}
          />
        </Pressable>
        <Pressable
          style={[styles.actionBtn, { backgroundColor: colors.dangerSoft }]}
          onPress={() => { onDelete?.(); }}
        >
          <Trash2 size={18} color={colors.danger} />
        </Pressable>
      </View>

      <Animated.View
        style={{ transform: [{ translateX }] }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={onPanStart}
        onResponderMove={(e) => onPanMove(e.nativeEvent.translationX ?? e.nativeEvent.pageX - e.nativeEvent.locationX)}
        onResponderRelease={onPanEnd}
      >
        <Pressable
          onPress={() => { close(); onPress(); }}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Open ${contact.name}`}
        >
          <Avatar uri={contact.photos[0]} name={contact.name} size={64} radius={14} />
          <View style={styles.body}>
            <View style={styles.topRow}>
              <View style={styles.nameWrap}>
                <Text style={styles.name} numberOfLines={1}>{contact.name}</Text>
                {!!subtitle && (
                  <Text style={styles.meta} numberOfLines={1}>{subtitle}</Text>
                )}
              </View>
              {onToggleFavorite ? (
                <Pressable
                  hitSlop={10}
                  onPress={onToggleFavorite}
                  accessibilityRole="button"
                  accessibilityLabel={contact.favorite ? 'Remove favorite' : 'Add favorite'}
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
            <Text style={styles.note} numberOfLines={1}>{note}</Text>
            {contact.tags && contact.tags.length > 0 && (
              <View style={styles.tagRow}>
                {contact.tags.slice(0, 3).map((t) => (
                  <View key={t} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden', borderRadius: 18 },
  actions: {
    position: 'absolute', right: 0, top: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingRight: 8, gap: 8,
  },
  actionBtn: {
    width: ACTION_WIDTH - 16, height: '80%', borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.panel2, borderRadius: 18,
    borderWidth: 1, borderColor: colors.lineSoft, padding: 12,
  },
  pressed: { backgroundColor: '#1a1a1a', borderColor: 'rgba(199,255,79,0.18)' },
  body: { flex: 1, minWidth: 0 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  nameWrap: { flex: 1, minWidth: 0 },
  name: { color: colors.textStrong, fontFamily: fonts.bodyBold, fontSize: 15 },
  meta: { color: colors.muted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  note: { color: '#bdbdbd', fontFamily: fonts.body, fontSize: 11, marginTop: 8 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  tagChip: {
    backgroundColor: colors.limeSoft, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tagChipText: { color: colors.lime, fontFamily: fonts.bodyMedium, fontSize: 10 },
});
