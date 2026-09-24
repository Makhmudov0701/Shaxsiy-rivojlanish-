import { NativeModules, Platform } from 'react-native';

export type InstalledApp = {
  packageName: string;
  appName: string;
};

export type AppLimit = {
  packageName: string;
  appName: string;
  limitMinutes: number;
};

export type UsageSnapshot = {
  day: string;
  usageMillis: Record<string, number>;
  blockedPackages: string[];
  activePackage: string;
  serviceConnected: boolean;
};

type AppBlockerBridge = {
  getAppsAsync: () => Promise<InstalledApp[]>;
  getLimitsAsync: () => Promise<AppLimit[]>;
  saveLimitsAsync: (json: string) => Promise<void>;
  getUsageSnapshotAsync: () => Promise<UsageSnapshot>;
  hasUsageAccessAsync: () => Promise<boolean>;
  openUsageAccessSettingsAsync: () => Promise<void>;
  isAccessibilityServiceEnabledAsync: () => Promise<boolean>;
  openAccessibilitySettingsAsync: () => Promise<void>;
};

type ExpoRuntime = {
  modules?: Record<string, unknown>;
};

function isAppBlockerBridge(value: unknown): value is AppBlockerBridge {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AppBlockerBridge>;
  return (
    typeof candidate.getAppsAsync === 'function' &&
    typeof candidate.getLimitsAsync === 'function' &&
    typeof candidate.saveLimitsAsync === 'function' &&
    typeof candidate.getUsageSnapshotAsync === 'function' &&
    typeof candidate.hasUsageAccessAsync === 'function' &&
    typeof candidate.openUsageAccessSettingsAsync === 'function' &&
    typeof candidate.isAccessibilityServiceEnabledAsync === 'function' &&
    typeof candidate.openAccessibilitySettingsAsync === 'function'
  );
}

function findNativeBridge(): AppBlockerBridge | null {
  if (Platform.OS !== 'android') return null;

  const runtime = (globalThis as typeof globalThis & { expo?: ExpoRuntime }).expo;
  const candidate = runtime?.modules?.AppBlocker ?? NativeModules.AppBlocker;
  return isAppBlockerBridge(candidate) ? candidate : null;
}

export const appBlockerNative = findNativeBridge();