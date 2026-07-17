// Generates assets/sounds/ember-complete.wav — the session-complete chime.
// Warm two-note chime (F4 -> C5): raised-cosine bloom instead of a strike,
// detuned fundamentals for glow, a sub-octave for body, and NO partials above
// the fundamentals — small phone speakers sharpen everything above ~700 Hz.
// Run: node scripts/make-chime.js
// IMPORTANT: the notification copy is snapshotted into ios/Ember/ at prebuild —
// after regenerating, run `npx expo prebuild -p ios --no-install` or the
// notification keeps playing the old sound while the in-app player uses the new.
const fs = require('fs');
const path = require('path');

const SR = 44100;
const DURATION = 2.8;
const PEAK = 0.38;
const FADE_OUT = 0.1;

// Each note: fundamental, start, decay, level, attack, detune, partial stack.
const NOTES = [
  { freq: 349.23, t0: 0.0, tau: 1.15, amp: 1.0, attack: 0.13, detune: 0.0025,
    partials: [[0.5, 0.16], [1, 1.0]] }, // F4 + sub-octave body
  { freq: 523.25, t0: 0.45, tau: 1.4, amp: 0.68, attack: 0.13, detune: 0.0025,
    partials: [[0.5, 0.16], [1, 1.0]] }, // C5 + sub-octave body
];

const n = Math.round(SR * DURATION);
const samples = new Float64Array(n);
for (const { freq, t0, tau, amp, attack, detune, partials } of NOTES) {
  for (const [mult, level] of partials) {
    // Detune pair on the fundamental only — gentle beating reads as warmth.
    const freqs = mult === 1 ? [freq * (1 + detune), freq * (1 - detune)] : [freq * mult];
    for (const f of freqs) {
      const lvl = level / freqs.length;
      for (let i = 0; i < n; i++) {
        const t = i / SR - t0;
        if (t < 0) continue;
        const att = t < attack ? 0.5 * (1 - Math.cos((Math.PI * t) / attack)) : 1;
        // Highs die faster = felt mallet; the sub-octave is capped so it
        // lingers as body without outliving the note.
        const env = att * Math.exp(-t / (tau / Math.max(mult, 0.7)));
        samples[i] += amp * lvl * env * Math.sin(2 * Math.PI * f * t);
      }
    }
  }
}

let peak = 0;
for (const s of samples) peak = Math.max(peak, Math.abs(s));
const gain = PEAK / peak;
const fadeStart = n - Math.round(SR * FADE_OUT);
const pcm = Buffer.alloc(n * 2);
for (let i = 0; i < n; i++) {
  const fade = i >= fadeStart ? (n - i) / (n - fadeStart) : 1;
  pcm.writeInt16LE(Math.round(samples[i] * gain * fade * 32767), i * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + pcm.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(pcm.length, 40);

const out = path.join(__dirname, '..', 'assets', 'sounds', 'ember-complete.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([header, pcm]));
console.log(`wrote ${out} (${((44 + pcm.length) / 1024).toFixed(0)} KB, ${DURATION}s)`);
