import { addDays } from 'date-fns';
import { completeWorkout, dateKey, muscles, nextMuscle, parseWorkouts, type Workout } from '@/lib/workouts';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 8, 22, 12)); });
afterEach(() => { vi.useRealTimers(); });

describe('personal workout rotation', () => {
  test('starts with biceps and follows the exact nine-part rotation', () => {
    let entries: Workout[] = [];
    for (let i = 0; i < 18; i++) {
      expect(nextMuscle(entries).id).toBe(muscles[i % 9].id);
      entries = completeWorkout(entries, dateKey(addDays(new Date(2026, 0, 1), i)), String(i));
    }
    expect(nextMuscle(entries).id).toBe('biceps');
    expect(entries.filter(e => e.muscleId === 'glutes')).toHaveLength(2);
  });
  test('prevents duplicate completions on the same local date', () => {
    const entries = completeWorkout([], '2026-09-22', 'first');
    expect(completeWorkout(entries, '2026-09-22', 'second')).toBe(entries);
    expect(entries).toHaveLength(1);
  });
  test('rest days do not advance the rotation and undo restores the previous step', () => {
    const first = completeWorkout([], '2026-09-01', 'first');
    const second = completeWorkout(first, '2026-09-22', 'second');
    expect(second[1].muscleId).toBe('legs');
    expect(nextMuscle(second).id).toBe('chest');
    expect(nextMuscle(second.slice(0, -1)).id).toBe('legs');
  });
  test('continues beyond the 100-workout milestone', () => {
    let entries: Workout[] = [];
    for (let i = 0; i < 101; i++) entries = completeWorkout(entries, dateKey(addDays(new Date(2025, 0, 1), i)), String(i));
    expect(entries).toHaveLength(101);
    expect(nextMuscle(entries).id).toBe('chest');
  });
  test('preserves earlier date entries in chronological order', () => {
    const entries = completeWorkout([], '2026-09-22', 'one');
    const updated = completeWorkout(entries, '2026-09-21', 'two');
    expect(updated.map(entry => entry.date)).toEqual(['2026-09-21', '2026-09-22']);
    expect(updated[1]).toEqual(entries[0]);
  });
});

describe('local history validation', () => {
  test('loads empty and valid history', () => {
    expect(parseWorkouts(null)).toEqual([]);
    const entries = completeWorkout([], '2026-09-22', 'first');
    expect(parseWorkouts(JSON.stringify({ version: 1, entries }))).toEqual(entries);
  });
  test('rejects corrupt storage and duplicate dates instead of discarding data silently', () => {
    expect(() => parseWorkouts('{broken')).toThrow();
    expect(() => parseWorkouts(JSON.stringify({ version: 1, entries: [{ id: 'one', muscleId: 'biceps', date: '2026-02-30' }] }))).toThrow();
    const entries = completeWorkout([], '2026-09-22', 'first');
    expect(() => parseWorkouts(JSON.stringify({ version: 1, entries: [...entries, { ...entries[0], id: 'second' }] }))).toThrow();
  });
  test('uses the local date rather than the UTC calendar date', () => {
    expect(dateKey(new Date(2026, 8, 22, 0, 1))).toBe('2026-09-22');
  });
});
