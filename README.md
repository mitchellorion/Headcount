# HeadCount

A private, on-device personal CRM for keeping track of the people you're dating — built for gay men. Dark UI, electric-lime accent. Built with **Expo (React Native) + Expo Router + TypeScript**, designed to ship to the Google Play Store.

---

## What's inside

- **Roster** — searchable, sortable list of contacts (recent / active / A–Z). Add, edit, delete, favorite.
- **Contact detail** — photo header, timestamped notes, next planned date, "quick read" facts (chemistry, vibe, last seen), active/idle toggle, mark-seen.
- **Dates** — upcoming and logged meetups across everyone; schedule a date with quick time presets, place, and label.
- **Faves** — your starred contacts.
- **More** — data export (JSON backup via share sheet), restore sample data, delete all, and a privacy summary.
- **Local-first storage** — everything lives on the device via AsyncStorage, behind a `ContactRepository` interface so a cloud sync backend can be dropped in later without touching the screens.

## Project structure

```
app/                      # Expo Router routes
  _layout.tsx             # fonts, providers (Contacts, Toast), root stack
  (tabs)/                 # bottom tab navigator
    _layout.tsx           # Roster / Dates / Faves / More
    index.tsx             # Roster (home) + search + sort
    dates.tsx             # Dates list + schedule modal
    faves.tsx             # Favorites
    more.tsx              # Settings / data / privacy
  contact/
    [id].tsx              # Contact detail
    form.tsx              # Add / edit (modal)
src/
  theme/                  # colors + typography/spacing tokens
  types/                  # domain types (Contact, Note, DatePlan)
  store/                  # ContactsContext, AsyncStorage repository, seed data
  components/             # Avatar, ContactCard, Button, Field, ChipSelect, Toast, etc.
  utils/                  # date formatting, id generation
assets/                   # icon, adaptive icon, splash
```

## Run it locally

You need Node 18+ and the Expo tooling.

```bash
npm install
# align native package versions to the installed Expo SDK
npx expo install --fix

# start the dev server
npx expo start
```

Then press `a` for an Android emulator/device (Expo Go is fine for a first look), or scan the QR code with the Expo Go app.

> Note: this project was authored and statically verified, but not compiled on the author's machine. On first `npm install`, run `npx expo install --fix` and `npx tsc --noEmit` to confirm versions line up with your local Expo SDK.

## Build for the Play Store

Uses [EAS Build](https://docs.expo.dev/build/introduction/) (config in `eas.json`).

```bash
npm install -g eas-cli
eas login
eas build:configure

# internal test build (APK) you can sideload
eas build --profile preview --platform android

# production build (AAB) for Play Console upload
eas build --profile production --platform android

# optional: upload straight to Play Console
eas submit --platform android
```

Before submitting:

1. Set a unique `android.package` (currently `com.ctrlaltorion.headcount`) and bump `android.versionCode` for each release.
2. In Play Console, complete the **Data safety** form. This app collects user-entered contact info and stores it **only on the device** — declare no data collection/sharing if that stays true.
3. Host a **privacy policy** and update the URL in `app/(tabs)/more.tsx` (and Play Console). Google requires one.

## Privacy by design

There is no account and no server. The roster — including notes about real people on a sensitive topic — never leaves the phone. Uninstalling the app deletes the data. Export produces a JSON file the user shares deliberately via the OS share sheet.

## Where to take it next

- **Cloud sync / multi-device:** implement the existing `ContactRepository` interface (`src/store/storage.ts`) against a backend; the UI needs no changes.
- **Native date/time picker:** swap the Dates quick-presets for `@react-native-community/datetimepicker` for arbitrary times.
- **iOS:** the codebase is cross-platform; add an iOS build profile and `bundleIdentifier` is already set.
- **Reminders/notifications:** `expo-notifications` to nudge before an upcoming date.
