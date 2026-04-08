import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from './lib/api';
import {
  getPorts,
  getVulnerabilities,
  runScan,
  type ScanResult,
  type ScanPort,
  type VulnerabilityRecord,
} from './services/api';

export interface ScanRecord {
  id: string;
  type: 'Quick' | 'Deep' | 'Targeted' | 'Normal';
  date: string;
  duration: string;
  threats: number;
  filesScanned: number;
  status: 'Clean' | 'Threats Found' | 'Scanning';
  details: string[];
}

export interface ScheduleItem {
  id: string;
  type: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
  time: string;
  customDate?: string;
  enabled: boolean;
}

export interface SettingsState {
  general: {
    autoScan: boolean;
    realTime: boolean;
    darkMode: boolean;
    autoUpdate: boolean;
  };
  notifications: {
    notifThreats: boolean;
    notifUpdates: boolean;
    notifComplete: boolean;
    notifWeekly: boolean;
    notifBreach: boolean;
  };
  privacy: {
    privClear: boolean;
    privBlock: boolean;
    privSafe: boolean;
    privAnon: boolean;
  };
  network: {
    netAuto: boolean;
    netVpn: boolean;
    netPublic: boolean;
    netDns: boolean;
  };
}

type SecurityStoreState = {
  scanResult: ScanResult | null;
  ports: ScanPort[];
  vulnerabilities: VulnerabilityRecord[];
  loading: {
    scan: boolean;
    ports: boolean;
    vulnerabilities: boolean;
  };
  errors: {
    scan: string | null;
    ports: string | null;
    vulnerabilities: string | null;
  };
  lastUpdatedAt: string | null;
};

const initialSecurityState: SecurityStoreState = {
  scanResult: null,
  ports: [],
  vulnerabilities: [],
  loading: {
    scan: false,
    ports: false,
    vulnerabilities: false,
  },
  errors: {
    scan: null,
    ports: null,
    vulnerabilities: null,
  },
  lastUpdatedAt: null,
};

let securityState = initialSecurityState;
const securityListeners = new Set<() => void>();
let portsPromise: Promise<ScanPort[]> | null = null;
let vulnerabilitiesPromise: Promise<VulnerabilityRecord[]> | null = null;
let scanPromise: Promise<ScanResult> | null = null;

function emitSecurityChange() {
  securityListeners.forEach((listener) => listener());
}

function updateSecurityState(
  updater: Partial<SecurityStoreState> | ((current: SecurityStoreState) => SecurityStoreState)
) {
  securityState =
    typeof updater === 'function'
      ? updater(securityState)
      : { ...securityState, ...updater };
  emitSecurityChange();
}

function subscribeSecurity(listener: () => void) {
  securityListeners.add(listener);
  return () => {
    securityListeners.delete(listener);
  };
}

function getSecuritySnapshot() {
  return securityState;
}

export async function refreshPorts(force = false) {
  if (portsPromise && !force) {
    return portsPromise;
  }

  updateSecurityState((current) => ({
    ...current,
    loading: { ...current.loading, ports: true },
    errors: { ...current.errors, ports: null },
  }));

  portsPromise = getPorts()
    .then((ports) => {
      updateSecurityState((current) => ({
        ...current,
        ports,
        loading: { ...current.loading, ports: false },
        errors: { ...current.errors, ports: null },
        lastUpdatedAt: new Date().toISOString(),
      }));
      return ports;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load ports';
      updateSecurityState((current) => ({
        ...current,
        loading: { ...current.loading, ports: false },
        errors: { ...current.errors, ports: message },
      }));
      throw error;
    })
    .finally(() => {
      portsPromise = null;
    });

  return portsPromise;
}

export async function refreshVulnerabilities(force = false) {
  if (vulnerabilitiesPromise && !force) {
    return vulnerabilitiesPromise;
  }

  updateSecurityState((current) => ({
    ...current,
    loading: { ...current.loading, vulnerabilities: true },
    errors: { ...current.errors, vulnerabilities: null },
  }));

  vulnerabilitiesPromise = getVulnerabilities()
    .then((vulnerabilities) => {
      updateSecurityState((current) => ({
        ...current,
        vulnerabilities,
        loading: { ...current.loading, vulnerabilities: false },
        errors: { ...current.errors, vulnerabilities: null },
        lastUpdatedAt: new Date().toISOString(),
      }));
      return vulnerabilities;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to load vulnerabilities';
      updateSecurityState((current) => ({
        ...current,
        loading: { ...current.loading, vulnerabilities: false },
        errors: { ...current.errors, vulnerabilities: message },
      }));
      throw error;
    })
    .finally(() => {
      vulnerabilitiesPromise = null;
    });

  return vulnerabilitiesPromise;
}

export async function runSecurityScan(target: string) {
  if (scanPromise) {
    return scanPromise;
  }

  updateSecurityState((current) => ({
    ...current,
    loading: { ...current.loading, scan: true },
    errors: { ...current.errors, scan: null },
  }));

  scanPromise = runScan(target)
    .then(({ scan, ports, vulnerabilities }) => {
      updateSecurityState((current) => ({
        ...current,
        scanResult: scan,
        ports,
        vulnerabilities,
        loading: {
          ...current.loading,
          scan: false,
          ports: false,
          vulnerabilities: false,
        },
        errors: {
          ...current.errors,
          scan: null,
          ports: null,
          vulnerabilities: null,
        },
        lastUpdatedAt: new Date().toISOString(),
      }));
      return scan;
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unable to run scan';
      updateSecurityState((current) => ({
        ...current,
        loading: { ...current.loading, scan: false },
        errors: { ...current.errors, scan: message },
      }));
      throw error;
    })
    .finally(() => {
      scanPromise = null;
    });

  return scanPromise;
}

export async function refreshSecurityData(force = false) {
  const [portsResult, vulnerabilitiesResult] = await Promise.allSettled([
    refreshPorts(force),
    refreshVulnerabilities(force),
  ]);

  if (portsResult.status === 'rejected' && vulnerabilitiesResult.status === 'rejected') {
    throw portsResult.reason;
  }
}

export function clearSecurityError(scope: keyof SecurityStoreState['errors']) {
  updateSecurityState((current) => ({
    ...current,
    errors: {
      ...current.errors,
      [scope]: null,
    },
  }));
}

export function useSecurityStore() {
  const state = useSyncExternalStore(subscribeSecurity, getSecuritySnapshot, getSecuritySnapshot);

  return {
    ...state,
    counts: {
      totalThreats: state.scanResult?.threats ?? state.vulnerabilities.length,
      openPorts: state.ports.filter((port) => port.status === 'open').length,
      vulnerabilities: state.vulnerabilities.length,
    },
    runSecurityScan,
    refreshPorts,
    refreshVulnerabilities,
    refreshSecurityData,
    clearSecurityError,
  };
}

export function useScanHistory() {
  const [history, setHistory] = useState<ScanRecord[]>([]);

  const refresh = useCallback(async () => {
    setHistory(await apiGet<ScanRecord[]>('/scan-history'));
  }, []);

  useEffect(() => {
    refresh().catch(() => setHistory([]));
  }, [refresh]);

  const deleteScan = useCallback(async (id: string) => {
    await apiDelete(`/scan-history/${id}`);
    setHistory(prev => prev.filter(s => s.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    await apiDelete('/scan-history');
    setHistory([]);
  }, []);

  return { history, deleteScan, clearAll, refresh };
}

export function useSchedules() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const refresh = useCallback(async () => {
    setSchedules(await apiGet<ScheduleItem[]>('/schedules'));
  }, []);

  useEffect(() => {
    refresh().catch(() => setSchedules([]));
  }, [refresh]);

  const addSchedule = useCallback(async (schedule: ScheduleItem) => {
    const created = await apiPost<ScheduleItem>('/schedules', schedule);
    setSchedules(prev => [created, ...prev]);
  }, []);

  const removeSchedule = useCallback(async (id: string) => {
    await apiDelete(`/schedules/${id}`);
    setSchedules(prev => prev.filter(s => s.id !== id));
  }, []);

  const toggleSchedule = useCallback(async (id: string) => {
    const updated = await apiPatch<ScheduleItem>(`/schedules/${id}/toggle`);
    setSchedules(prev => prev.map(s => s.id === id ? updated : s));
  }, []);

  return { schedules, addSchedule, removeSchedule, toggleSchedule, refresh };
}

export function useAppSettings() {
  const [settings, setSettings] = useState<SettingsState | null>(null);

  const refresh = useCallback(async () => {
    const data = await apiGet<SettingsState & { key?: string }>('/settings');
    setSettings({
      general: data.general,
      notifications: data.notifications,
      privacy: data.privacy,
      network: data.network,
    });
  }, []);

  useEffect(() => {
    refresh().catch(() => setSettings(null));
  }, [refresh]);

  const patchSettings = useCallback(async (payload: Partial<SettingsState>) => {
    const data = await apiPatch<SettingsState & { key?: string }>('/settings', payload);
    setSettings({
      general: data.general,
      notifications: data.notifications,
      privacy: data.privacy,
      network: data.network,
    });
  }, []);

  return { settings, patchSettings, refresh };
}

export function getDeviceInfo() {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let device = 'Unknown Device';
  let browser = 'Unknown Browser';

  if (ua.includes('Windows NT 10')) os = 'Windows 10/11';
  else if (ua.includes('Windows NT')) os = 'Windows';
  else if (ua.includes('Mac OS X')) {
    const v = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    os = v ? `macOS ${v[1].replace(/_/g, '.')}` : 'macOS';
  }
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) device = 'Mobile';
  else if (ua.includes('Tablet') || ua.includes('iPad')) device = 'Tablet';
  else device = 'Desktop / Laptop';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Microsoft Edge';

  const lang = navigator.language || 'en';
  const cores = navigator.hardwareConcurrency || 0;
  const ram = (navigator as any).deviceMemory || 0;
  const online = navigator.onLine;
  const platform = navigator.platform || 'Unknown';

  return { os, device, browser, lang, cores, ram, online, platform, userAgent: ua };
}

export function getPerformanceMetrics() {
  const perf = performance as any;
  let memoryUsed = 0;
  let memoryTotal = 0;
  let memoryLimit = 0;

  if (perf.memory) {
    memoryUsed = Math.round(perf.memory.usedJSHeapSize / 1048576);
    memoryTotal = Math.round(perf.memory.totalJSHeapSize / 1048576);
    memoryLimit = Math.round(perf.memory.jsHeapSizeLimit / 1048576);
  }

  return { memoryUsed, memoryTotal, memoryLimit };
}

export async function getStorageInfo() {
  if (navigator.storage && navigator.storage.estimate) {
    const est = await navigator.storage.estimate();
    return {
      used: Math.round((est.usage || 0) / 1048576),
      total: Math.round((est.quota || 0) / 1048576),
    };
  }
  return { used: 0, total: 0 };
}
