import { format, isValid, parseISO } from 'date-fns';
import { z } from 'zod';

/** The personal rotation; rest days never advance this order. */
export const muscles = [
  { id: 'biceps', name: 'Biceps', category: 'Upper body', message: 'Stronger arms. Stronger you.', description: 'Small steps. Bigger results. Show up for yourself today.' },
  { id: 'legs', name: 'Legs', category: 'Lower body', message: 'Build your foundation.', description: 'Strength starts from the ground up. Make every rep count.' },
  { id: 'chest', name: 'Chest', category: 'Upper body', message: 'Push toward your potential.', description: 'One workout closer to a stronger version of yourself.' },
  { id: 'back', name: 'Back', category: 'Upper body', message: 'Strength has your back.', description: 'Build the strength that supports everything you do.' },
  { id: 'abs', name: 'Abs', category: 'Core', message: 'Strong at the center.', description: 'A stronger core. A steadier you. Keep showing up.' },
  { id: 'shoulders', name: 'Shoulders', category: 'Upper body', message: 'Lift your expectations.', description: 'Your progress is built one honest workout at a time.' },
  { id: 'triceps', name: 'Triceps', category: 'Upper body', message: 'Find your pushing power.', description: 'Put in the work today. Let consistency do the rest.' },
  { id: 'forearms', name: 'Forearms', category: 'Upper body', message: 'Get a grip on progress.', description: 'Little details make a big difference. This is your time.' },
  { id: 'glutes', name: 'Glutes', category: 'Lower body', message: 'Move yourself forward.', description: 'Finish the rotation strong. Then come back even stronger.' },
] as const;

export type Muscle = (typeof muscles)[number];
export type MuscleId = Muscle['id'];
export const STORAGE_KEY = 'you-vs-you.workouts.v1';
const entrySchema = z.object({
  id: z.string().min(1),
  muscleId: z.enum(['biceps', 'legs', 'chest', 'back', 'abs', 'shoulders', 'triceps', 'forearms', 'glutes']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => isValid(parseISO(value)) && format(parseISO(value), 'yyyy-MM-dd') === value),
});
export type Workout = z.infer<typeof entrySchema>;

/** A local calendar key, deliberately not a UTC timestamp. */
export function dateKey(date: Date = new Date()): string { return format(date, 'yyyy-MM-dd'); }
export function muscleFor(id: MuscleId): Muscle { return muscles.find(m => m.id === id) ?? muscles[0]; }
export function nextMuscle(entries: Workout[]): Muscle {
  const last = entries.at(-1);
  return muscles[last ? (muscles.findIndex(m => m.id === last.muscleId) + 1) % muscles.length : 0];
}
export function parseWorkouts(raw: string | null): Workout[] {
  if (raw === null) return [];
  const result = z.object({ version: z.literal(1), entries: z.array(entrySchema) }).parse(JSON.parse(raw));
  if (new Set(result.entries.map(e => e.date)).size !== result.entries.length || new Set(result.entries.map(e => e.id)).size !== result.entries.length) throw new Error('Invalid workout history');
  return result.entries.sort((a, b) => a.date.localeCompare(b.date));
}
/** Form values share the same date and muscle validation as saved history. */
export const workoutInputSchema = entrySchema.omit({ id: true }).refine(
  input => input.date <= dateKey(),
  { path: ['date'], message: 'Choose today or a past date.' },
);
export type WorkoutInput = z.infer<typeof workoutInputSchema>;

/** Inserts a dated workout without changing the body parts of existing records. */
export function addWorkout(entries: Workout[], input: WorkoutInput, id: string): Workout[] {
  const validated = workoutInputSchema.parse(input);
  if (entries.some(entry => entry.date === validated.date)) return entries;
  if (!id || entries.some(entry => entry.id === id)) throw new Error('Invalid workout identifier');
  return [...entries, { ...validated, id }].sort((a, b) => a.date.localeCompare(b.date));
}

/** Uses the rotation as a default; past dates are allowed too. */
export function completeWorkout(entries: Workout[], date: string, id: string): Workout[] {
  return addWorkout(entries, { date, muscleId: nextMuscle(entries.filter(entry => entry.date < date)).id }, id);
}
