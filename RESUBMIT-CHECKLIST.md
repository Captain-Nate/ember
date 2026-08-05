# Ember 1.0.0 build 2 — pre-resubmit review

> **RESUBMITTED 2026-08-04.** Every step below is done; this file is now the
> record of what build 2 changed and why. On approval: press Release (manual).

Everything done on **2026-08-04** after Apple rejected build 1, in one place.
Read this first when you come back to it; the deep detail lives in
[APP-STORE-SUBMISSION.md](APP-STORE-SUBMISSION.md) §0a/§0b.

Code: `bfa18c0` + `6cf9242`, pushed to `origin/main`.

---

## 1. Why build 1 was rejected

**a. Guideline 4.0 Design** — "crowded, laid out … difficult to use" on
**iPad Air 11-inch (M3) / iPadOS 26.5.2**.

Reproduced exactly. The app was iPhone-only, so it ran in iPhone
**compatibility mode** on a ~375×667pt canvas. A fixed 284pt ring + 150pt flame
+ the control stack needs ~743pt, so the ring overlapped the header and the
theme swatches sat *underneath* the primary button.

> The same bug was live on **iPhone SE**. Every listing screenshot was shot on a
> 956pt iPhone 16 Pro Max, which hid it.

**b. Background audio** — `UIBackgroundModes: ["audio"]` with nothing using it.
Not hand-written: the `expo-audio` config plugin defaults
`enableBackgroundPlayback` to `true`. Ember's only audio is the foreground
completion chime; the locked/background sound comes from the notification.

---

## 2. What changed

| Area | Change |
|---|---|
| Background audio | `expo-audio` plugin now gets explicit `false` options; also drops an unused `NSMicrophoneUsageDescription` |
| Device support | **Universal** — `supportsTablet: true`, device family `1,2`, all four iPad orientations |
| Timer layout | Ring/flame/clock scale to available space; **controls never scale below phone size** so tap targets stay ≥44pt |
| iPad sizing | Art up to **1.35×**, type and tap targets **1.45×**. iPhone capped at 1.0 → renders as before |
| All screens | Content held to a **560pt centred column**; header inset below the iPadOS 26 window controls |
| Robustness | `CONTROLS_H`/`FOOTER_H`/`HEADER_H` are **derived** from the same metrics the stylesheet uses, so they can't drift back out of sync |
| Build | `ios.buildNumber` → **2** |

New file: `src/constants/layout.ts` (`CONTENT_MAX_WIDTH`, `IS_PAD`,
`HEADER_TOP_PAD`, `padSize()`).

### Two more overlaps found while verifying

- **Preset row overflowed its column.** Horizontal padding was being scaled with
  the type, making the row **518pt inside a 512pt column** — already over at
  full screen. Horizontal spacing no longer scales → **440pt, 72pt headroom**.
- **Landscape put the button on top of the swatches.** Two causes: React Native
  **does not clip by default**, so overflowing content painted over the footer
  instead of scrolling; and the `0.55` art floor demanded ~193pt where 11"
  landscape offers only ~135pt. Fixed with `overflow: 'hidden'` on the scroll
  area and `MIN_ART_SCALE = 0.35`.

> Earlier assumption that landscape overflow would "just scroll harmlessly" was
> **wrong**. Don't trust the scroll fallback — rotate and look.

### Metadata corrections (all in APP-STORE-SUBMISSION.md)

- **Reviewer notes pointed at a "+" beside the swatches** to open the shop. That
  control hasn't existed since the shop moved to the header chip. A reviewer who
  can't find the purchase is a rejection. Now says to use the **Shop** button,
  and warns the focus guard also fires when focus moves to another iPad window.
- **Description advertised the Dynamic Island** — doesn't exist on iPad, and the
  app is now sold as an iPad app. Reworded to "on supported iPhones".
- **"your phone" → "your device"** in the description and the in-app hint.

---

## 3. Verified

Built artifact (not just source):

| Check | Result |
|---|---|
| `UIBackgroundModes` | **absent** — the rejection reason |
| `NSMicrophoneUsageDescription` | absent |
| `UIDeviceFamily` | `[1, 2]` |
| `CFBundleVersion` | `2` (widget matches) |
| `ITSAppUsesNonExemptEncryption` | `false` — no compliance prompt |
| `PlugIns/EmberActivity.appex` | present — Live Activity survived the clean prebuild |
| chime in bundle | 247,004 bytes, matches source |

Devices: **iPad Air 11"** (windowed, fullscreen and **landscape**, including the
Glacier-preview state where the footer carries both the Unlock button and the
bundle hint) · **iPad Pro 13"** portrait · **iPhone SE** · **iPhone 16 Pro Max**.

Also: a real 1-minute session run end-to-end (completes, logs a candle, done
screen renders). iPad portrait geometry diffed before/after the landscape fix —
**identical**, so the listing screenshots stayed valid. iPhone re-checked after
every change; `padSize()` is a no-op off iPad and the iPhone art scale is capped
at 1.0, so iPhone rendering is unchanged.

Audited clean: privacy manifests present · `DEV_UNLOCK_ALL = false` · dev reset
`__DEV__`-gated · Live Activity guarded (`#available` + `areActivitiesEnabled` +
catch, so no iPad crash) · support and privacy URLs live, bundle correctly
described as one-time not a subscription · no external purchase links · Restore
present · no other-platform mentions · no placeholders · app-icon alpha is fully
opaque (benign — build 1 cleared upload).

---

## 4. Do these before resubmitting

- [x] **Re-attach all 7 IAPs to build 2** in App Store Connect. First-time IAPs
      are only reviewed if attached to the submitted version.
- [x] **Upload the iPad screenshots** — now mandatory. Five at **2064×2752** in
      `~/Desktop/ember-screenshots/ipad13/` (`01-focus`, `02-candles`,
      `03-shop`, `04-session`, `05-complete`). The **iPhone** set in
      `~/Desktop/ember-screenshots/` is still valid.
- [x] **Completion chime verified on device** (Nate, 2026-08-04) — 1.0.0(2)
      Release build on the iPhone 15 Pro; foreground chime sounds right. File
      sizes match between `assets/sounds/` and `ios/Ember/` (247,004 bytes).
- [x] **Paste the updated reviewer notes** from APP-STORE-SUBMISSION.md §6.
- [x] **Update the description** with the Dynamic Island / "device" wording.
- [x] Archive and upload (see §0 — back up `ios/ExportOptions.plist` before any
      prebuild; it's gitignored and prebuild deletes it).
- [x] **Reply in Resolution Center** stating both fixes.

---

## 5. Known limits, accepted

- **iPad windows narrower than ~488pt** would still clip the preset row. Fixing
  it means letting the row wrap, which breaks the derived height math that is
  currently preventing the original overlap — a deliberate piece of work, not a
  tweak.
- **`PAD_TEXT_SCALE` is at 1.45×.** Raising it costs vertical room, because the
  same factor grows the control rows. Lower it if anything ever stops fitting.

---

## 6. Re-verify quickly

```bash
# built artifact must NOT list UIBackgroundModes, and must list device family 1 and 2
/usr/libexec/PlistBuddy -c "Print :UIBackgroundModes" <Ember.app>/Info.plist
/usr/libexec/PlistBuddy -c "Print :UIDeviceFamily"    <Ember.app>/Info.plist
```
