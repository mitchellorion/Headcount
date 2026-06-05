import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

export function StatusDot({ active, size = 8 }: { active: boolean; size?: number }) {
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: active ? colors.lime : colors.dotIdle,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    marginTop: 2,
  },
});
