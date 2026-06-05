import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { useToast } from '@/components/Toast';

/** The persistent brand header (H mark + wordmark + bell). */
export function AppHeader() {
  const toast = useToast();
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.mark}>
          <Text style={styles.markText}>H</Text>
        </View>
        <Text style={styles.word}>HeadCount<Text style={styles.dot}> .</Text></Text>
      </View>
      <Pressable
        onPress={() => toast.show('No new notifications.')}
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        style={styles.bell}
        hitSlop={8}
      >
        <Bell size={16} color={colors.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    color: colors.onLime,
    fontFamily: fonts.displayExtra,
    fontSize: 18,
  },
  word: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  dot: {
    color: colors.lime,
  },
  bell: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
