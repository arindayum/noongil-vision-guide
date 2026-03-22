import { useState, useCallback } from 'react';

export interface AnalyticsData {
  objectDetections: number;
  textReads: number;
  emergencyActivations: number;
  hazardDetections: number;
  offlineOCRUses: number;
  totalSessions: number;
  firstUsed: number | null;
  lastUsed: number | null;
}

const ANALYTICS_KEY = 'noongil_analytics';

const EMPTY: AnalyticsData = {
  objectDetections: 0,
  textReads: 0,
  emergencyActivations: 0,
  hazardDetections: 0,
  offlineOCRUses: 0,
  totalSessions: 0,
  firstUsed: null,
  lastUsed: null,
};

const load = (): AnalyticsData => {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
};

const persist = (data: AnalyticsData) => {
  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch {}
};

export const useAnalytics = () => {
  const [data, setData] = useState<AnalyticsData>(load);

  const track = useCallback((event: keyof Omit<AnalyticsData, 'firstUsed' | 'lastUsed'>) => {
    setData(prev => {
      const now = Date.now();
      const next: AnalyticsData = {
        ...prev,
        [event]: prev[event] + 1,
        lastUsed: now,
        firstUsed: prev.firstUsed ?? now,
      };
      persist(next);
      return next;
    });
  }, []);

  const incrementSession = useCallback(() => {
    track('totalSessions');
  }, [track]);

  const resetAnalytics = useCallback(() => {
    setData(EMPTY);
    localStorage.removeItem(ANALYTICS_KEY);
  }, []);

  return { data, track, incrementSession, resetAnalytics };
};
