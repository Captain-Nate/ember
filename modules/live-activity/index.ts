import { requireOptionalNativeModule } from 'expo-modules-core';

interface LiveActivityNative {
  start(endAtMs: number, startedAtMs: number, themeId: string): boolean;
  end(): void;
}

const native = requireOptionalNativeModule<LiveActivityNative>('EmberLiveActivity');

/** Start the lock-screen/Dynamic Island session activity. No-op where unsupported. */
export function startLiveActivity(endAtMs: number, startedAtMs: number, themeId: string): boolean {
  try {
    return native?.start(endAtMs, startedAtMs, themeId) ?? false;
  } catch {
    return false;
  }
}

/** End any running session activity. No-op where unsupported. */
export function endLiveActivity(): void {
  try {
    native?.end();
  } catch {}
}
