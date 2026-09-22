import { emptyPosterProgress, importWorkoutProgress, parsePosterProgress, POSTER_DAYS, togglePosterDay, totalCompletedDays, TOTAL_POSTER_DAYS } from '@/lib/poster-progress';
import { muscles, type Workout } from '@/lib/workouts';

describe('numbered poster progress', () => {
  test('starts with nine independent empty posters and 100 available days each', () => {
    const progress = emptyPosterProgress();
    expect(Object.keys(progress)).toHaveLength(9);
    expect(totalCompletedDays(progress)).toBe(0);
    expect(POSTER_DAYS).toHaveLength(100);
    expect(POSTER_DAYS[0]).toBe(1);
    expect(POSTER_DAYS.at(-1)).toBe(100);
    expect(TOTAL_POSTER_DAYS).toBe(900);
  });

  test('checks any days in any order without filling skipped squares', () => {
    let progress = emptyPosterProgress();
    for (const day of [4, 1, 100, 2, 3]) progress = togglePosterDay(progress, 'biceps', day);
    expect(progress.biceps).toEqual([1, 2, 3, 4, 100]);
    expect(totalCompletedDays(progress)).toBe(5);
  });

  test('tapping a completed square again removes only that square', () => {
    let progress = emptyPosterProgress();
    for (const day of [1, 2, 3, 4, 2]) progress = togglePosterDay(progress, 'biceps', day);
    expect(progress.biceps).toEqual([1, 3, 4]);
    expect(totalCompletedDays(progress)).toBe(3);
  });

  test('identical day numbers on different posters remain independent', () => {
    const initial = emptyPosterProgress();
    const biceps = togglePosterDay(initial, 'biceps', 1);
    const chest = togglePosterDay(biceps, 'chest', 1);
    expect(initial.biceps).toEqual([]);
    expect(biceps.chest).toEqual([]);
    expect(chest.biceps).toEqual([1]);
    expect(chest.chest).toEqual([1]);
    expect(totalCompletedDays(chest)).toBe(2);
  });

  test('can fill all 900 squares without date restrictions', () => {
    let progress = emptyPosterProgress();
    for (const muscle of muscles) for (const day of POSTER_DAYS) progress = togglePosterDay(progress, muscle.id, day);
    expect(totalCompletedDays(progress)).toBe(900);
    expect(progress.glutes).toHaveLength(100);
    expect(totalCompletedDays(togglePosterDay(progress, 'glutes', 100))).toBe(899);
  });

  test('rejects invalid square numbers', () => {
    for (const day of [0, -1, 101, 1.5, NaN, Infinity]) {
      expect(() => togglePosterDay(emptyPosterProgress(), 'abs', day)).toThrow();
    }
  });
});

describe('poster storage and migration', () => {
  const entries: Workout[] = [
    { id: 'a', muscleId: 'biceps', date: '2026-09-01' },
    { id: 'b', muscleId: 'chest', date: '2026-09-02' },
    { id: 'c', muscleId: 'biceps', date: '2026-09-03' },
  ];

  test('imports earlier workout counts without changing their records', () => {
    const original = JSON.stringify(entries);
    const progress = importWorkoutProgress(entries);
    expect(progress.biceps).toEqual([1, 2]);
    expect(progress.chest).toEqual([1]);
    expect(totalCompletedDays(progress)).toBe(3);
    expect(JSON.stringify(entries)).toBe(original);
    expect(parsePosterProgress(null, JSON.stringify({ version: 1, entries }))).toEqual(progress);
  });

  test('loads new-format data instead of reimporting days the user unchecked', () => {
    const empty = emptyPosterProgress();
    expect(parsePosterProgress(JSON.stringify({ version: 1, days: empty }), JSON.stringify({ version: 1, entries }))).toEqual(empty);
    expect(parsePosterProgress(null)).toEqual(empty);
  });

  test('round-trips nonsequential selections', () => {
    const progress = togglePosterDay(togglePosterDay(emptyPosterProgress(), 'glutes', 100), 'glutes', 4);
    expect(parsePosterProgress(JSON.stringify({ version: 1, days: progress }))).toEqual(progress);
  });

  test('rejects invalid saved data rather than replacing it with empty progress', () => {
    expect(() => parsePosterProgress('{bad')).toThrow();
    expect(() => parsePosterProgress(null, '{bad')).toThrow();
    expect(() => parsePosterProgress(JSON.stringify({ version: 2, days: emptyPosterProgress() }))).toThrow();
    expect(() => parsePosterProgress(JSON.stringify({ version: 1, days: { biceps: [1] } }))).toThrow();
    for (const biceps of [[101], [0], [1, 1], [1.5], ['1']]) {
      expect(() => parsePosterProgress(JSON.stringify({ version: 1, days: { ...emptyPosterProgress(), biceps } }))).toThrow();
    }
  });
});
