import { useEffect, useRef, useCallback, useState } from 'react';

export interface AutoSaveResult {
  hasDraft: () => boolean;
  restoreDraft: () => Record<string, unknown> | null;
  clearDraft: () => void;
  savedAt: () => Date | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
}

/**
 * useAutoSave — lightweight localStorage draft hook.
 * Debounces saves by `debounceMs` (default 1500ms).
 * Exposes reactive `isSaving` (true while debounce is pending) and
 * `lastSavedAt` (Date when last save completed).
 * Call `clearDraft()` after a successful form submission.
 */
export function useAutoSave(
  key: string,
  data: Record<string, unknown>,
  debounceMs = 1500,
): AutoSaveResult {
  const storageKey = `medrise_draft_${key}`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const isEmpty = Object.values(data).every(
      (v) => v === '' || v === null || v === undefined,
    );
    if (isEmpty) {
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ data, savedAt: Date.now() }),
        );
        setLastSavedAt(new Date());
      } catch {
        // storage unavailable
      } finally {
        setIsSaving(false);
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, storageKey, debounceMs]);

  const hasDraft = useCallback((): boolean => {
    try {
      return !!localStorage.getItem(storageKey);
    } catch {
      return false;
    }
  }, [storageKey]);

  const restoreDraft = useCallback((): Record<string, unknown> | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        data: Record<string, unknown>;
        savedAt: number;
      };
      return parsed.data;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearDraft = useCallback((): void => {
    try {
      localStorage.removeItem(storageKey);
      setLastSavedAt(null);
      setIsSaving(false);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const savedAt = useCallback((): Date | null => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const { savedAt: ts } = JSON.parse(raw) as { savedAt: number };
      return new Date(ts);
    } catch {
      return null;
    }
  }, [storageKey]);

  return { hasDraft, restoreDraft, clearDraft, savedAt, isSaving, lastSavedAt };
}
