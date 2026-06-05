import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';

interface Props {
  uri?: string;
  name: string;
  size?: number;
  radius?: number;
  style?: ViewStyle;
}

/** Photo avatar with a graceful initials fallback. */
export function Avatar({ uri, name, size = 64, radius = 14, style }: Props) {
  const initials = getInitials(name);
  const dim: ViewStyle = { width: size, height: size, borderRadius: radius };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dim, style]}
        contentFit="cover"
        transition={180}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.fallback, dim, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: colors.panel2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  initials: {
    color: colors.lime,
    fontFamily: fonts.displayExtra,
  },
});
