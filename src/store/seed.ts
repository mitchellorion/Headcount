import { Contact } from '@/types';
import { uid } from '@/utils/id';

/**
 * Demo roster shown on first launch (and restorable from Settings).
 * Mirrors the three contacts from the original mockup, fully fleshed out.
 */
export function makeSeedContacts(): Contact[] {
  const now = new Date();
  const iso = (daysAgo: number) =>
    new Date(now.getTime() - daysAgo * 86_400_000).toISOString();

  const friday = nextFriday(now, 20, 30).toISOString();

  return [
    {
      id: uid('c_'),
      name: 'Mason',
      age: 31,
      role: 'Architect',
      location: 'Atlanta',
      photoUri:
        'https://images.pexels.com/photos/6322948/pexels-photo-6322948.jpeg?auto=compress&cs=tinysrgb&w=400',
      active: true,
      favorite: true,
      chemistry: 'High',
      vibe: 'Easy',
      lastSeen: iso(7),
      tagline: 'Smart, dry humor. Old fashioneds.',
      notes: [
        {
          id: uid('n_'),
          body: 'Loves old fashioneds. Mentioned the renovation project in Inman Park.',
          createdAt: iso(7),
        },
      ],
      dates: [
        {
          id: uid('d_'),
          at: friday,
          place: 'Little Trouble',
          label: 'Drinks',
        },
      ],
      createdAt: iso(20),
      updatedAt: iso(2),
    },
    {
      id: uid('c_'),
      name: 'Theo',
      age: 29,
      role: 'Trainer',
      location: 'Atlanta',
      photoUri:
        'https://images.pexels.com/photos/17545511/pexels-photo-17545511.jpeg?auto=compress&cs=tinysrgb&w=400',
      active: false,
      favorite: false,
      chemistry: 'Medium',
      vibe: 'Playful',
      lastSeen: iso(14),
      tagline: 'Tall, funny, tattoos',
      notes: [
        {
          id: uid('n_'),
          body: 'Great energy at the gym meetup. Easy to talk to.',
          createdAt: iso(14),
        },
      ],
      dates: [],
      createdAt: iso(18),
      updatedAt: iso(14),
    },
    {
      id: uid('c_'),
      name: 'Julian',
      age: 34,
      role: 'Designer',
      location: 'Atlanta',
      photoUri:
        'https://images.pexels.com/photos/12955710/pexels-photo-12955710.jpeg?auto=compress&cs=tinysrgb&w=400',
      active: false,
      favorite: false,
      chemistry: 'Unsure',
      vibe: 'Slow burn',
      lastSeen: iso(21),
      tagline: 'Met in Midtown',
      notes: [],
      dates: [],
      createdAt: iso(21),
      updatedAt: iso(21),
    },
  ];
}

function nextFriday(from: Date, hour: number, minute: number): Date {
  const d = new Date(from);
  const day = d.getDay();
  let add = (5 - day + 7) % 7; // 5 = Friday
  if (add === 0) add = 7; // always look ahead
  d.setDate(d.getDate() + add);
  d.setHours(hour, minute, 0, 0);
  return d;
}
