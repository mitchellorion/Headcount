import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { Contact, ContactDraft, DatePlan, Note } from '@/types';
import { uid } from '@/utils/id';
import { contactRepository } from '@/store/storage';
import { makeSeedContacts } from '@/store/seed';
import { supabase } from '@/lib/supabase';
import { CloudRepository } from '@/store/CloudRepository';

interface State {
  contacts: Contact[];
  hydrated: boolean;
}

type Action =
  | { type: 'HYDRATE'; contacts: Contact[] }
  | { type: 'ADD'; contact: Contact }
  | { type: 'UPDATE'; id: string; patch: Partial<Contact> }
  | { type: 'REMOVE'; id: string }
  | { type: 'REPLACE_ALL'; contacts: Contact[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'HYDRATE':
      return { contacts: action.contacts, hydrated: true };
    case 'ADD':
      return { ...state, contacts: [action.contact, ...state.contacts] };
    case 'UPDATE':
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.id
            ? { ...c, ...action.patch, updatedAt: new Date().toISOString() }
            : c
        ),
      };
    case 'REMOVE':
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.id),
      };
    case 'REPLACE_ALL':
      return { ...state, contacts: action.contacts };
    default:
      return state;
  }
}

interface ContactsContextValue {
  contacts: Contact[];
  hydrated: boolean;
  cloudUserId: string | null;
  getById: (id: string) => Contact | undefined;
  addContact: (draft: ContactDraft | Contact) => Contact;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleActive: (id: string) => void;
  addNote: (id: string, body: string) => void;
  removeNote: (contactId: string, noteId: string) => void;
  addDate: (id: string, date: Omit<DatePlan, 'id'>) => void;
  removeDate: (contactId: string, dateId: string) => void;
  markSeenNow: (id: string) => void;
  resetToSeed: () => void;
  clearAll: () => void;
  syncToCloud: () => Promise<void>;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    contacts: [],
    hydrated: false,
  });
  const [cloudUserId, setCloudUserId] = React.useState<string | null>(null);

  // Track auth session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCloudUserId(session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Hydrate from local storage on mount; seed on first ever launch.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await contactRepository.load();
      if (cancelled) return;
      if (stored) {
        dispatch({ type: 'HYDRATE', contacts: stored });
      } else {
        const seeded = makeSeedContacts();
        dispatch({ type: 'HYDRATE', contacts: seeded });
        contactRepository.save(seeded).catch(() => undefined);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // When a user signs in, pull their cloud contacts down (cloud wins if they have data).
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!cloudUserId || prevUserIdRef.current === cloudUserId || !state.hydrated) return;
    prevUserIdRef.current = cloudUserId;
    CloudRepository.getAll(cloudUserId)
      .then((cloudContacts) => {
        if (cloudContacts.length > 0) {
          dispatch({ type: 'REPLACE_ALL', contacts: cloudContacts });
          contactRepository.save(cloudContacts).catch(() => undefined);
        } else {
          // New account — push local contacts up as the initial backup.
          CloudRepository.syncAll(cloudUserId, state.contacts).catch(() => undefined);
        }
      })
      .catch((err) => console.warn('[HeadCount] cloud pull failed', err));
  }, [cloudUserId, state.hydrated]);

  // Persist to local storage whenever contacts change (debounced).
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!state.hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      contactRepository.save(state.contacts).catch((err) =>
        console.warn('[HeadCount] save failed', err)
      );
    }, 250);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.contacts, state.hydrated]);

  const getById = useCallback(
    (id: string) => state.contacts.find((c) => c.id === id),
    [state.contacts]
  );

  const addContact = useCallback((draft: ContactDraft | Contact): Contact => {
    const now = new Date().toISOString();
    const contact: Contact = {
      ...draft,
      id: (draft as Contact).id ?? uid('c_'),
      photos: draft.photos ?? [],
      notes: draft.notes ?? [],
      dates: draft.dates ?? [],
      createdAt: (draft as Contact).createdAt ?? now,
      updatedAt: (draft as Contact).updatedAt ?? now,
    };
    dispatch({ type: 'ADD', contact });
    return contact;
  }, []);

  const updateContact = useCallback((id: string, patch: Partial<Contact>) => {
    dispatch({ type: 'UPDATE', id, patch });
  }, []);

  const removeContact = useCallback((id: string) => {
    dispatch({ type: 'REMOVE', id });
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      const c = state.contacts.find((x) => x.id === id);
      if (c) dispatch({ type: 'UPDATE', id, patch: { favorite: !c.favorite } });
    },
    [state.contacts]
  );

  const toggleActive = useCallback(
    (id: string) => {
      const c = state.contacts.find((x) => x.id === id);
      if (c) dispatch({ type: 'UPDATE', id, patch: { active: !c.active } });
    },
    [state.contacts]
  );

  const addNote = useCallback(
    (id: string, body: string) => {
      const c = state.contacts.find((x) => x.id === id);
      if (!c) return;
      const note: Note = {
        id: uid('n_'),
        body: body.trim(),
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE', id, patch: { notes: [note, ...c.notes] } });
    },
    [state.contacts]
  );

  const removeNote = useCallback(
    (contactId: string, noteId: string) => {
      const c = state.contacts.find((x) => x.id === contactId);
      if (!c) return;
      dispatch({
        type: 'UPDATE',
        id: contactId,
        patch: { notes: c.notes.filter((n) => n.id !== noteId) },
      });
    },
    [state.contacts]
  );

  const addDate = useCallback(
    (id: string, date: Omit<DatePlan, 'id'>) => {
      const c = state.contacts.find((x) => x.id === id);
      if (!c) return;
      const plan: DatePlan = { id: uid('d_'), ...date };
      const dates = [...c.dates, plan].sort(
        (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
      );
      dispatch({ type: 'UPDATE', id, patch: { dates } });
    },
    [state.contacts]
  );

  const removeDate = useCallback(
    (contactId: string, dateId: string) => {
      const c = state.contacts.find((x) => x.id === contactId);
      if (!c) return;
      dispatch({
        type: 'UPDATE',
        id: contactId,
        patch: { dates: c.dates.filter((d) => d.id !== dateId) },
      });
    },
    [state.contacts]
  );

  const markSeenNow = useCallback((id: string) => {
    dispatch({
      type: 'UPDATE',
      id,
      patch: { lastSeen: new Date().toISOString() },
    });
  }, []);

  const resetToSeed = useCallback(() => {
    const seeded = makeSeedContacts();
    dispatch({ type: 'REPLACE_ALL', contacts: seeded });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: 'REPLACE_ALL', contacts: [] });
  }, []);

  const syncToCloud = useCallback(async () => {
    if (!cloudUserId) return;
    await CloudRepository.syncAll(cloudUserId, state.contacts);
  }, [cloudUserId, state.contacts]);

  const value = useMemo<ContactsContextValue>(
    () => ({
      contacts: state.contacts,
      hydrated: state.hydrated,
      cloudUserId,
      getById,
      addContact,
      updateContact,
      removeContact,
      toggleFavorite,
      toggleActive,
      addNote,
      removeNote,
      addDate,
      removeDate,
      markSeenNow,
      resetToSeed,
      clearAll,
      syncToCloud,
    }),
    [
      state.contacts,
      state.hydrated,
      cloudUserId,
      getById,
      addContact,
      updateContact,
      removeContact,
      toggleFavorite,
      toggleActive,
      addNote,
      removeNote,
      addDate,
      removeDate,
      markSeenNow,
      resetToSeed,
      clearAll,
      syncToCloud,
    ]
  );

  return (
    <ContactsContext.Provider value={value}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts(): ContactsContextValue {
  const ctx = useContext(ContactsContext);
  if (!ctx) {
    throw new Error('useContacts must be used within a ContactsProvider');
  }
  return ctx;
}

/** Convenience selector for a single contact that re-renders on changes. */
export function useContact(id?: string): Contact | undefined {
  const { contacts } = useContacts();
  return useMemo(
    () => (id ? contacts.find((c) => c.id === id) : undefined),
    [contacts, id]
  );
}
