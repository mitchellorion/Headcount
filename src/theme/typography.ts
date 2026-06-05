/**
 * Font family names as registered in app/_layout.tsx via @expo-google-fonts.
 * Libre Franklin = display/headings, DM Sans = body/UI.
 */
export const fonts = {
  display: 'LibreFranklin_700Bold',
  displayExtra: 'LibreFranklin_800ExtraBold',
  displaySemi: 'LibreFranklin_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;
