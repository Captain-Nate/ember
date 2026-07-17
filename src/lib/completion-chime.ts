import { Platform } from 'react-native';

type AudioModule = typeof import('expo-audio');
type AudioPlayer = import('expo-audio').AudioPlayer;

let Audio: AudioModule | null = null;
if (Platform.OS === 'ios' || Platform.OS === 'android') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Audio = require('expo-audio');
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CHIME = require('../../assets/sounds/ember-complete.wav');

let player: AudioPlayer | null = null;

function ensurePlayer(): AudioPlayer | null {
  if (!Audio) return null;
  if (!player) {
    // Respect the silent switch and mix over the user's audio instead of pausing it.
    Audio.setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
      () => {},
    );
    player = Audio.createAudioPlayer(CHIME);
  }
  return player;
}

/** Preload the chime so the first completion plays without a load hitch. */
export function initCompletionChime(): void {
  ensurePlayer();
}

/** Foreground completion chime — backgrounded completions get the same sound
 *  via the notification, so callers must only fire this for live finishes. */
export function playCompletionChime(): void {
  try {
    const p = ensurePlayer();
    if (!p) return;
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    player = null;
  }
}
