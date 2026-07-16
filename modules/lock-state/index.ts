import { requireOptionalNativeModule } from 'expo-modules-core';

interface LockStateNative {
  getLastLockAt(): number;
  getLastUnlockAt(): number;
}

const native = requireOptionalNativeModule<LockStateNative>('LockState');

/** Epoch ms of the most recent device lock, or 0 if unknown/unavailable. */
export function getLastLockAt(): number {
  return native?.getLastLockAt() ?? 0;
}

/** Epoch ms of the most recent device unlock, or 0 if unknown/unavailable. */
export function getLastUnlockAt(): number {
  return native?.getLastUnlockAt() ?? 0;
}
