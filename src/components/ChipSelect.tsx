import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

interface Props<T extends string> {
  label: string;
  options: readonly T[];
  value: T | '';
  onChange: (value: T | '') => void;
}

/** Single-select pill group. Tapping the active chip deselects it (value → ''). */
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <Pressable
              key={opt}
              onPress={() => onChange(selected ? '' : opt)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel3,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  chipText: {
    color: colors.subtle,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  chipTextSelected: {
    color: colors.onLime,
    fontFamily: fonts.bodyBold,
  },
});
