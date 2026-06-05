import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

export function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: TextStyle;
}) {
  return <Text style={[styles.label, style]}>{String(children).toUpperCase()}</Text>;
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.8,
  },
});
