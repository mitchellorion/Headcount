import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '@/types';

/**
 * ContactRepository abstracts persistence so the UI never talks to a storage
 * engine directly. Today it's backed by on-device AsyncStorage; swapping in a
 * cloud/sync backend later means implementing this same interface — no screen
 * changes required.
 */
export interface ContactRepository {
  load(): Promise<Contact[] | null>;
  save(contacts: Contact[]): Promise<void>;
  clear(): Promise<void>;
}

const STORAGE_KEY = 'headcount.contacts.v1';
const SCHEMA_VERSION = 2;

interface Persisted {
  version: number;
  contacts: Contact[];
}

class AsyncStorageRepository implements ContactRepository {
  async load(): Promise<Contact[] | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Persisted;
      if (!parsed || !Array.isArray(parsed.contacts)) return null;
      return parsed.contacts.map(normalize);
    } catch (err) {
      console.warn('[HeadCount] Failed to load contacts:', err);
      return null;
    }
  }

  async save(contacts: Contact[]): Promise<void> {
    const payload: Persisted = { version: SCHEMA_VERSION, contacts };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

/** Defensive defaults so older/partial records never crash the UI. */
function normalize(c: Partial<Contact> & { photoUri?: string }): Contact {
  // Migrate legacy single-photo records (schema v1) into the photos array.
  const photos = Array.isArray(c.photos)
    ? c.photos.filter(Boolean)
    : c.photoUri
      ? [c.photoUri]
      : [];
  return {
    id: c.id ?? '',
    name: c.name ?? 'Unnamed',
    age: c.age,
    role: c.role,
    location: c.location,
    photos,
    position: c.position,
    cut: c.cut,
    zodiac: c.zodiac,
    active: c.active ?? false,
    favorite: c.favorite ?? false,
    chemistry: c.chemistry ?? 'Unsure',
    vibe: c.vibe ?? 'Unknown',
    lastSeen: c.lastSeen,
    tagline: c.tagline,
    notes: Array.isArray(c.notes) ? c.notes : [],
    dates: Array.isArray(c.dates) ? c.dates : [],
    createdAt: c.createdAt ?? new Date().toISOString(),
    updatedAt: c.updatedAt ?? new Date().toISOString(),
  };
}

export const contactRepository: ContactRepository = new AsyncStorageRepository();
