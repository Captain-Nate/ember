# App Store submission — Ember: Focus Timer

Working checklist for the v1.0 submission. Tick items as they land.
Companion doc: [IAP-SETUP.md](IAP-SETUP.md) style — this one is the paperwork.

**State at the time of writing (2026-07-22):** repo clean at `7c4182c`,
`version` 1.0.0, `DEV_UNLOCK_ALL = false`, dev reset button is `__DEV__`-gated
(cannot ship), `ios.supportsTablet` unset so the app is **iPhone-only** — no
iPad screenshots required. IAP purchase + restore already verified on device
with fresh sandbox testers.

---

## 0. Two things that will bite you

- **Do NOT run `expo prebuild` before archiving.** It regenerates `ios/` and
  wipes hand-applied native config. Archive from the `ios/` you already have.
- The local `store/Ember.storekit` scheme setting only affects **Run**, not
  **Archive** — leave it alone, it cannot leak into the uploaded binary.

---

## 1. URLs — blocking, do these first

App Store Connect will not let you submit without a support URL and a privacy
policy URL. Both pages are written and live in [`docs/`](docs/).

- [x] **Support mailbox: `emberfocustimer@gmail.com`** (matches the
      `1moreswinggame@gmail.com` convention). Already wired into
      `docs/index.html`, `docs/privacy.html` and `docs/support.html`.
      Profile photo: `~/Desktop/ember-email-icon.png` (the 1024² app icon).
- [ ] Commit and push `docs/`
- [ ] GitHub → `Captain-Nate/ember` → Settings → Pages → Source: **Deploy from a
      branch**, branch `main`, folder **`/docs`**
- [ ] Wait ~1 min, then confirm both load:
      - Support: `https://captain-nate.github.io/ember/support.html`
      - Privacy: `https://captain-nate.github.io/ember/privacy.html`

`docs/.nojekyll` is included so GitHub serves the files as-is.

---

## 2. Screenshots

Apple's 6.9" iPhone slot needs **1290×2796 or 1320×2868**. Your iPhone 15 Pro is
1179×2556 — **not accepted**, so these have to come from a simulator.

Captured 2026-07-22 into `~/Desktop/ember-screenshots/` at native
1320×2868 (iPhone 16 Pro Max sim, seeded 22-session history, 9:41 status bar):

- [x] `01-flame-session.png` — mid-session, "The flame is lit — stay with it"
- [x] `02-candle-collection.png` — 20 lit · 2 snuffed shelf
- [x] `03-theme-preview.png` — Glacier preview, "Unlock Glacier · $0.99"
- [x] `04-theme-shop.png` — all 7 products with live StoreKit prices
- [ ] `05-done-screen.png` — "Ember has lit a new candle"
- [x] `06-doused-bonus.png` — spare (stakes shot; optional in listing)

Upload order on the listing: 01, 02, 03, 04, 05.

### IAP review screenshots (7)

Apple only wants an image showing **where the purchase appears in the app**. It
does *not* have to be the purchase sheet. Upload the SAME full shop screenshot
(`04-theme-shop.png`, shows all 7 products with prices) for each of the 7
products — standard practice, and full-size device screenshots avoid any
dimension-rejection risk that cropped rows would carry.

- [ ] verdant · [ ] glacier · [ ] amethyst · [ ] rose · [ ] sapphire ·
      [ ] moonlight · [ ] the all-themes bundle

---

## 3. Listing copy

### App name (30 max)
```
Ember: Focus Timer
```

### Subtitle (30 max — this is exactly 30)
```
A flame that keeps you focused
```

### Promotional text (170 max — editable later without review)
```
New: your finished sessions now become candles. Every focus session lights one, sized to how long you stayed. Watch the shelf fill up.
```

### Keywords (100 max — this is 90; do NOT repeat words already in the name or subtitle)
```
pomodoro,productivity,study,concentration,adhd,habit,streak,candle,deep,work,exam,revision
```

### Description
```
Ember is a focus timer with something at stake.

Start a session and a small flame begins to burn. Stay off your phone and it
holds steady to the end. Leave to scroll and it goes out — quietly, and you'll
see it happen.

Finish, and Ember lights a candle for your collection. Longer sessions make
bigger candles, so the shelf becomes an honest record of how you've actually
spent your attention. Sessions you gave up on leave a melted stub. Those stay
too.

WHY IT WORKS

Most timers just count down. Ember gives you something small to protect, and
that turns out to be the difference between closing the app and staying with
the work.

FEATURES

• 15, 25, and 50 minute presets, or any length from 1 to 180 minutes
• Focus guard — switching apps puts the flame out; locking your phone doesn't
• Runs on your Lock Screen and in the Dynamic Island while you work
• Home Screen widget with a live countdown
• A candle for every finished session, sized to its length
• Daily streaks — keep the flame alive
• A warm chime when you're done, so you can look away entirely
• Seven themes that recolor the whole app, flame included

PRIVATE BY DEFAULT

No account. No sign-up. No ads, no analytics, no tracking of any kind. Every
session you run stays on your device and is never sent anywhere.

Ember is free. Six extra themes are available as one-time purchases, or take
the bundle for every theme including all future ones.
```

### What's New (v1.0)
```
The first release of Ember. Light a flame, focus, collect a candle.
```

---

## 4. App Store Connect fields

- [ ] **Category:** Productivity (primary). Secondary: Health & Fitness
- [ ] **Price:** Free
- [ ] **Age rating:** no ads, no contests, no user-generated content, no
      unrestricted web → **4+**
- [ ] **Copyright:** `© 2026 Nathaniel Mason`
- [ ] **Support URL / Privacy Policy URL:** from step 1
- [ ] **Version Release:** Manual — so you pick the day
- [ ] Attach **all 7 IAPs** to the version (first-time IAPs submit *with* the
      app version; if you skip this they don't get reviewed)

### Privacy labels

Ember stores everything locally and transmits nothing. Answer:

- [ ] **Data Not Collected** — that's the whole questionnaire

No tracking, no ATT prompt, no third-party SDKs. (Purchases are Apple's own
transaction; that is not data you collect.)

---

## 5. Build and upload

- [ ] Version **1.0.0**, build **1**
- [ ] Xcode → scheme **Ember**, destination **Any iOS Device (arm64)**
- [ ] Product → **Archive**
- [ ] Distribute App → App Store Connect → Upload
- [ ] **Export compliance:** `ITSAppUsesNonExemptEncryption` is *not* in
      Info.plist yet, so Xcode will ask. Answer **exempt** — the app uses only
      standard OS encryption (HTTPS). Add the key in 1.0.1 to stop the prompt.
- [ ] Wait for the processing email (~5–30 min), then select the build on the
      version page

---

## 6. Submit

- [ ] Build selected, all 7 IAPs attached, screenshots uploaded, metadata filled
- [ ] Sign-in info: not required (no account in the app)
- [ ] Notes for reviewer:
      ```
      Ember is a focus timer. No account or login is needed.

      To see a full session quickly, choose the 1-minute custom duration
      (tap Custom, then the minus stepper down to 1).

      Note: switching away from the app for more than ~10 seconds during a
      running session intentionally ends that session — this is the app's
      core "focus guard" feature, not a crash.

      Theme purchases are one-time non-consumables, available in the shop
      (the "+" next to the theme swatches on the home screen).
      ```
- [ ] Submit for Review

---

## 7. After approval

- [ ] Release manually when ready
- [ ] Update the portfolio site status line for Ember
- [ ] 1.0.1 backlog: `ITSAppUsesNonExemptEncryption=false` in `app.json`
      `ios.infoPlist`, the streak-earned Midnight theme, an
      `expo-store-review` prompt after a few completed sessions
