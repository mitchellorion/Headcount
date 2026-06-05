/**
 * HeadCount color tokens.
 * Mirrors the design language from the original mockup:
 * near-black surfaces, a single electric-lime accent, soft off-white text.
 */
export const colors = {
  ink: '#090909',
  bg: '#0b0b0b',
  panel: '#111111',
  panel2: '#171717',
  panel3: '#151515',
  line: 'rgba(255,255,255,0.08)',
  lineSoft: 'rgba(255,255,255,0.05)',
  muted: '#7a7a7a',
  subtle: '#a3a3a3',
  soft: '#e9e7df',
  text: '#f7f7f2',
  textStrong: '#ffffff',
  lime: '#c7ff4f',
  limeSoft: 'rgba(199,255,79,0.12)',
  limeSofter: 'rgba(199,255,79,0.10)',
  onLime: '#0a0a0a',
  dotIdle: '#52525b',
  danger: '#ff5d5d',
  dangerSoft: 'rgba(255,93,93,0.12)',
} as const;

export type ColorName = keyof typeof colors;
