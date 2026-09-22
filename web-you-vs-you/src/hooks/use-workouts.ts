import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { addWorkout, dateKey, nextMuscle, parseWorkouts, STORAGE_KEY, workoutInputSchema, type Workout, type WorkoutInput } from '@/lib/workouts';

type StoredState = { entries: Workout[]; error: string | null };
type SaveResult = { success: true } | { success: false; message: string };
function load(): StoredState {
  try { return { entries: parseWorkouts(localStorage.getItem(STORAGE_KEY)), error: null }; }
  catch { return { entries: [], error: 'Your saved history could not be opened. Allow browser storage and retry. Your existing data has not been changed.' }; }
}

/** Preserves existing local history and supports adding past workouts in any order. */
export function useWorkouts() {
  const [state, setState] = useState<StoredState>(load);
  const [today, setToday] = useState<string>(() => dateKey());
  const refresh = useCallback(() => { setToday(dateKey()); setState(load()); }, []);
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) refresh(); };
    const timer = window.setInterval(() => setToday(dateKey()), 15000);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('storage', onStorage); window.removeEventListener('focus', refresh); };
  }, [refresh]);

  const add = useCallback((input: WorkoutInput): SaveResult => {
    const validation = workoutInputSchema.safeParse(input);
    if (!validation.success) return { success: false, message: 'Choose a valid date on or before today and a body part.' };
    try {
      const current = parseWorkouts(localStorage.getItem(STORAGE_KEY));
      setToday(dateKey());
      const updated = addWorkout(current, validation.data, crypto.randomUUID());
      if (updated === current) {
        setState({ entries: current, error: null });
        return { success: false, message: 'A workout is already saved for this date. Choose another day.' };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: updated }));
      setState({ entries: updated, error: null });
      return { success: true };
    } catch {
      return { success: false, message: 'Could not save. Allow browser storage and try again. Your existing workouts are unchanged.' };
    }
  }, []);

  const complete = useCallback(() => {
    const result = add({ date: dateKey(), muscleId: nextMuscle(state.entries).id });
    if (!result.success) toast.error(result.message);
    else toast.success('Workout saved.');
  }, [add, state.entries]);

  const undo = useCallback((id: string): boolean => {
    try {
      const current = parseWorkouts(localStorage.getItem(STORAGE_KEY));
      const updated = current.filter(entry => entry.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: updated }));
      setState({ entries: updated, error: null });
      toast.success('Workout removed. Progress updated.');
      return true;
    } catch {
      toast.error('Could not remove this workout. Allow browser storage and try again.');
      return false;
    }
  }, []);

  return { ...state, today, add, complete, undo, refresh, next: nextMuscle(state.entries), todayEntry: state.entries.find(e => e.date === today) };
}
export type WorkoutTracker = ReturnType<typeof useWorkouts>;
