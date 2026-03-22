import { useState, useCallback } from 'react';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  mode: 'object' | 'text';
  imageSrc: string;
  summary: string;
  warnings: string[];
  objects: { name: string; distance?: string; position?: string }[];
  detectedText?: string;
  confidence: 'high' | 'medium' | 'low';
  language: string;
}

const HISTORY_KEY = 'noongil_history';
const MAX_ENTRIES = 10;

const loadHistory = (): HistoryEntry[] => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveHistory = (entries: HistoryEntry[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // Storage quota exceeded — silently skip
  }
};

export const useHistory = () => {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);

  const addEntry = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setEntries(prev => {
      const updated = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      saveHistory(updated);
      return updated;
    });
    return newEntry.id;
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(HISTORY_KEY);
  }, []);

  return { entries, addEntry, removeEntry, clearHistory };
};
