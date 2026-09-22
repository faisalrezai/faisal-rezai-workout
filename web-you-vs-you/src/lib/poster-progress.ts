import { z } from 'zod';
import { muscles, parseWorkouts, type MuscleId, type Workout } from '@/lib/workouts';

export const POSTER_STORAGE_KEY = 'you-vs-you.poster-days.v1';
export const DAYS_PER_POSTER = 100;
export const TOTAL_POSTER_DAYS = DAYS_PER_POSTER * muscles.length;
export const POSTER_DAYS = Array.from({ length: DAYS_PER_POSTER }, (_, index) => index + 1);

/** Each poster owns its numbered checkboxes, independent of dates or other posters. */
export type PosterProgress = Record<MuscleId, number[]>;
const dayListSchema = z.array(z.number().int().min(1).max(DAYS_PER_POSTER))
  .refine(days => new Set(days).size === days.length);
const progressSchema = z.object({
  biceps: dayListSchema, legs: dayListSchema, chest: dayListSchema,
  back: dayListSchema, abs: dayListSchema, shoulders: dayListSchema,
  triceps: dayListSchema, forearms: dayListSchema, glutes: dayListSchema,
}).strict();

export function emptyPosterProgress(): PosterProgress {
  return { biceps: [], legs: [], chest: [], back: [], abs: [], shoulders: [], triceps: [], forearms: [], glutes: [] };
}

/** Import legacy counts into the first numbered days; the original history stays untouched. */
export function importWorkoutProgress(entries: Workout[]): PosterProgress {
  const progress = emptyPosterProgress();
  for (const entry of entries) {
    const days = progress[entry.muscleId];
    if (days.length < DAYS_PER_POSTER) days.push(days.length + 1);
  }
  return progress;
}

/** Invalid saved data must fail visibly instead of being silently overwritten. */
export function parsePosterProgress(raw: string | null, legacyRaw: string | null = null): PosterProgress {
  if (raw === null) return importWorkoutProgress(parseWorkouts(legacyRaw));
  const parsed = z.object({ version: z.literal(1), days: progressSchema }).parse(JSON.parse(raw));
  return parsed.days;
}

/** Toggle exactly one square, allowing gaps and any order. */
export function togglePosterDay(progress: PosterProgress, muscleId: MuscleId, day: number): PosterProgress {
  if (!Number.isInteger(day) || day < 1 || day > DAYS_PER_POSTER) throw new Error('Invalid challenge day');
  const current = progress[muscleId];
  const days = current.includes(day) ? current.filter(value => value !== day) : [...current, day].sort((a, b) => a - b);
  return { ...progress, [muscleId]: days };
}

export function totalCompletedDays(progress: PosterProgress): number {
  return muscles.reduce((total, muscle) => total + progress[muscle.id].length, 0);
}

/** The supplied posters, with artwork above and below the printed grid preserved. */
export const posterArtwork: Record<MuscleId, { headerHeight: number; footerHeight: number }> = {
  biceps: { headerHeight: 834, footerHeight: 156 },
  chest: { headerHeight: 832, footerHeight: 156 },
  abs: { headerHeight: 838, footerHeight: 164 },
  back: { headerHeight: 880, footerHeight: 164 },
  legs: { headerHeight: 874, footerHeight: 168 },
  shoulders: { headerHeight: 892, footerHeight: 164 },
  forearms: { headerHeight: 906, footerHeight: 164 },
  triceps: { headerHeight: 902, footerHeight: 164 },
  glutes: { headerHeight: 908, footerHeight: 164 },
};
