# App Store submission — Ember: Focus Timer

Working checklist for the v1.0 submission. Tick items as they land.
Companion doc: [IAP-SETUP.md](IAP-SETUP.md) style — this one is the paperwork.

---

## 1.0.1 — Ruby theme + review prompt (code built 2026-08-11)

First release under the **Ciel Labs LLC org account** (app transferred
2026-08-11). Code is done and web-verified; what remains is signing + ASC:

- [ ] **Org Team ID** into `app.json` → `ios.appleTeamId` (currently still the
      Individual `7Y5KKUDQ6F`). Find it in the org ASC → Membership, with Xcode
      signed in as `hello@ciellabs.app`.
- [ ] Back up `ios/ExportOptions.plist`, then `npx expo prebuild -p ios` (new
      team + expo-store-review pod). Restore the plist and **update its
      `teamID`** to the org team.
- [ ] First archive re-mints org signing: `xcodebuild archive
      -allowProvisioningUpdates DEVELOPMENT_TEAM=<ORG_TEAM>` (§5 flow).
- [ ] **ASC (org account): create IAP** `com.captainnate.ember.theme.ruby`,
      non-consumable, $0.99, name "Ruby theme". Reuse the legacy-size
      `iap-review.png` trick for its review screenshot (§4). **Attach it — and
      only it — to the 1.0.1 submission** (the other 7 are already approved).
- [ ] Bundle needs no ASC change — `.themes.all` already sells "every future
      theme"; the app now grants new themes to bundle owners automatically
      (`ownsBundle` flag + legacy migration in `src/lib/entitlements.ts`).
- [ ] Listing screenshots stay valid (shop screenshot shows 7 products, now 8
      in-app — acceptable drift, reshoot only if convenient).
- [ ] What's New: new Ruby theme; polish.

Code in this update: `ruby` in `themes.ts` **and** `Themes.swift` (keep in
sync) + `store/Ember.storekit`; bundle forward-entitlement (above); milestone
review ask via `expo-store-review` (`src/lib/review-ask.ts`, fires after the
3rd/15th/40th completed session, 2.8s after the done screen). Version 1.0.1
(build 3).

> ⚠️ Swatch-row headroom: 8 swatches fit every verified window (row ≈402pt on
> iPad vs the preset row's 440pt). At **9 themes** the swatch row becomes the
> widest control (~454pt) and at **10** it breaks the ~488pt minimum window —
> the row needs wrapping/redesign before a 10th theme ships.

**State at the time of writing (2026-07-22):** repo clean at `7c4182c`,
`version` 1.0.0, `DEV_UNLOCK_ALL = false`, dev reset button is `__DEV__`-gated
(cannot ship), `ios.supportsTablet` unset so the app is **iPhone-only** — no
iPad screenshots required. IAP purchase + restore already verified on device
with fresh sandbox testers.

---

## 0a. Build 1 was REJECTED (2026-08-04) — what changed for build 2

Two findings, both fixed:

1. **Guideline 4.0 Design** — "crowded, laid out … difficult to use" on
   **iPad Air 11-inch (M3) / iPadOS 26.5.2**. Reproduced exactly: the app was
   iPhone-only, so it ran in iPhone **compatibility mode** on a ~375×667pt
   canvas, where the fixed 284pt ring + 150pt flame + controls (~743pt) could
   not fit — the ring overlapped the header and the theme swatches were buried
   under the primary button. *The same bug was live on iPhone SE*, which every
   screenshot (all shot on 16 Pro Max, 956pt) had hidden.
2. **Background audio** — `UIBackgroundModes: ["audio"]` with no feature using
   it. It was injected by the `expo-audio` config plugin, whose
   `enableBackgroundPlayback` defaults to `true`; Ember's only audio is the
   foreground completion chime, and the locked/background sound comes from the
   notification, not background audio.

Fixes: `app.json` passes `enableBackgroundPlayback/enableBackgroundRecording/
recordAudioAndroid: false` and `microphonePermission: false` to `expo-audio`
(this also drops the unused `NSMicrophoneUsageDescription`), and the timer
screen is now responsive — see §0b.

**The app is now universal** (`supportsTablet: true`, device family `1,2`, all
four iPad orientations), so **iPad screenshots are now REQUIRED** — see §4.

## 0b. Layout rules that must not regress

- The ring/flame/clock scale to fit; **the controls never scale below their
  phone size** (44pt tap targets). iPad may scale art *up* to 1.35×; iPhone is
  capped at 1.0 so the existing iPhone screenshots stay accurate.
- `CONTROLS_H` / `FOOTER_H` / `HEADER_H` in `src/app/index.tsx` are **derived**
  from the same `padSize()`d metrics the stylesheet uses. If you hard-code them
  again they will drift and the overlap comes back.
- Every screen holds content to `CONTENT_MAX_WIDTH` (560pt) and starts its
  header below `HEADER_TOP_PAD` — iPadOS 26 draws window controls over the
  top-left of a windowed app and they will land on the wordmark otherwise.
- The timer screen's content sits in a `ScrollView` that centres when it fits
  and scrolls when it doesn't, so no window size can clip it.

- iPad type and tap targets are scaled by `PAD_TEXT_SCALE` (**1.45×**) in
  `src/constants/layout.ts`. Raising it costs vertical room, because the same
  factor grows the control rows.
- `MIN_ART_SCALE` (**0.35**) must stay low enough that a short canvas can shrink
  the art until the content fits. **iPad Air 11" landscape leaves only ~135pt
  for the art**; the old 0.55 floor demanded ~193pt, so the content was 26pt
  taller than its container.
- `centerScroll` carries `overflow: 'hidden'`. Without it the scroll area does
  **not** clip, and overflowing content paints *on top of* the footer button
  rather than scrolling. This is what caused the landscape overlap.

Verified on iPad Air 11" (windowed, fullscreen **and landscape**, including the
theme-preview state where the footer carries both the Unlock button and the
bundle hint), iPad Pro 13" (fullscreen), iPhone SE, and iPhone 16 Pro Max.
Portrait geometry is byte-identical before/after the landscape fix, so the
listing screenshots remain valid.

**Correction to an earlier assumption:** landscape overflow was expected to
degrade into harmless scrolling. It did not — it overlapped the button. Never
assume the ScrollView fallback saves you; check the orientation directly.

---

## 0. Two things that will bite you

- **`expo prebuild` wipes `ios/`.** Build 2 *required* it (the audio and
  iPad config live in `app.json`), and it deleted `ios/ExportOptions.plist` —
  which §5 needs. It is gitignored, so **back it up before any prebuild** and
  restore it after; the `store/Ember.storekit` scheme attachment is lost too
  (Run-only, harmless for Archive). Once prebuilt, archive from that `ios/`
  and do not prebuild again.
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
Every finished session lights a candle for your collection, sized to how long you stayed. Give up, and the flame goes out. Free, private, no account.
```

### Keywords (100 max — this is 90; do NOT repeat words already in the name or subtitle)
```
pomodoro,productivity,study,concentration,adhd,habit,streak,candle,deep,work,exam,revision
```

### Description
```
Ember is a focus timer with something at stake.

Start a session and a small flame begins to burn. Stay out of other apps and it
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
• Focus guard — switching apps puts the flame out; locking your device doesn't
• Runs on your Lock Screen while you work, and in the Dynamic Island on
  supported iPhones
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

### Screenshots

- [ ] **iPhone 6.9"** — the existing set in `~/Desktop/ember-screenshots/`.
      Still valid: the responsive work left iPhone layout unchanged (verified
      pixel-for-pixel on 16 Pro Max).
- [ ] **iPad 13"** — **newly required** now that the app supports iPad.
      Captured 2026-08-04 at **2064×2752** into
      `~/Desktop/ember-screenshots/ipad13/`: `01-focus`, `02-candles`,
      `03-shop`, `04-session`, `05-complete`. Shot on an iPad Pro 13" (M4) sim
      with a seeded 22-session history (13-day streak, 5 themes owned) so the
      shelf and shop both look lived-in.

### Privacy labels

Ember stores everything locally and transmits nothing. Answer:

- [ ] **Data Not Collected** — that's the whole questionnaire

No tracking, no ATT prompt, no third-party SDKs. (Purchases are Apple's own
transaction; that is not data you collect.)

---

## 5. Build and upload

- [ ] Version **1.0.0**, build **2** (`ios.buildNumber` in `app.json`)
- [ ] Xcode → scheme **Ember**, destination **Any iOS Device (arm64)**
- [ ] Product → **Archive**
- [ ] Distribute App → App Store Connect → Upload
- [ ] **Export compliance:** no prompt any more —
      `ITSAppUsesNonExemptEncryption: false` is baked into `app.json` and the
      generated Info.plist.
- [ ] Sanity-check the archived binary before uploading:
      `/usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" <App>/Info.plist`
      must say **Does Not Exist** (this is the build-1 rejection), and
      `Print :UIDeviceFamily` must list **1 and 2**.
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
      core "focus guard" feature, not a crash. Locking the device is safe and
      the session keeps running. On iPad this also applies when you move
      focus to another app window.

      Theme purchases are one-time non-consumables. Open the shop with the
      "Shop" button in the top-right of the home screen.
      ```
- [ ] Submit for Review

---

## 7. After approval

- [ ] Release manually when ready
- [ ] Update the portfolio site status line for Ember
- [ ] 1.0.1 backlog: `ITSAppUsesNonExemptEncryption=false` in `app.json`
      `ios.infoPlist`, the streak-earned Midnight theme, an
      `expo-store-review` prompt after a few completed sessions
