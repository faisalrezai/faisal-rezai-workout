import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEY, type MuscleId } from '@/lib/workouts';
import { emptyPosterProgress, parsePosterProgress, POSTER_STORAGE_KEY, togglePosterDay, totalCompletedDays, type PosterProgress } from '@/lib/poster-progress';

type ProgressState = { days: PosterProgress; error: string | null };

function readProgress(): PosterProgress {
  const saved = localStorage.getItem(POSTER_STORAGE_KEY);
  return parsePosterProgress(saved, saved === null ? localStorage.getItem(STORAGE_KEY) : null);
}

function initialState(): ProgressState {
  try { return { days: readProgress(), error: null }; }
  catch { return { days: emptyPosterProgress(), error: 'Your saved progress could not be loaded. Allow browser storage and retry. Nothing has been changed.' }; }
}

/** Owns saved poster selections; read before every write so rapid taps use the latest data. */
export function usePosterProgress() {
  const [state, setState] = useState<ProgressState>(initialState);
  const [announcement, setAnnouncement] = useState<string>('');

  const refresh = useCallback(() => {
    try { setState({ days: readProgress(), error: null }); }
    catch { setState(previous => ({ ...previous, error: 'Your saved progress could not be loaded. Allow browser storage and retry. Nothing has been changed.' })); }
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === POSTER_STORAGE_KEY || event.key === STORAGE_KEY || event.key === null) refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', refresh); };
  }, [refresh]);

  const toggle = useCallback((muscleId: MuscleId, day: number) => {
    try {
      const updated = togglePosterDay(readProgress(), muscleId, day);
      localStorage.setItem(POSTER_STORAGE_KEY, JSON.stringify({ version: 1, days: updated }));
      setState({ days: updated, error: null });
      setAnnouncement(`Day ${day} ${updated[muscleId].includes(day) ? 'completed' : 'unchecked'}. ${updated[muscleId].length} of 100 completed. Saved.`);
    } catch {
      setState(previous => ({ ...previous, error: 'That change could not be saved. Allow browser storage, then retry. Your previous progress is unchanged.' }));
      setAnnouncement('Change not saved.');
    }
  }, []);

  return { ...state, total: totalCompletedDays(state.days), toggle, refresh, announcement };
}

export type PosterTracker = ReturnType<typeof usePosterProgress>;
