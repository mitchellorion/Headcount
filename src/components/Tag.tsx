import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

interface Props {
  label: string;
  tone?: 'lime' | 'muted';
  style?: ViewStyle;
}

export function Tag({ label, tone = 'lime', style }: Props) {
  const isLime = tone === 'lime';
  return (
    <View
      style={[
        styles.tag,
        { backgroundColor: isLime ? colors.lime : colors.panel2 },
        style,
      ]}
    >
      <Text
        style={[styles.text, { color: isLime ? colors.onLime : colors.subtle }]}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
});
