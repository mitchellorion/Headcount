/**
 * Lightweight unique-id generator. Avoids a uuid dependency and works
 * fine for client-side, single-device records.
 */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}${time}${rand}`;
}
