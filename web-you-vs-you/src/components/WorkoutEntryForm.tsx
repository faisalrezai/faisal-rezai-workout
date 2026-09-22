import { useState } from 'react';
import { format, parseISO, subDays } from 'date-fns';
import { Check, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { dateKey, muscleFor, muscles, workoutInputSchema, type WorkoutInput } from '@/lib/workouts';
import type { WorkoutTracker } from '@/hooks/use-workouts';
import { cn } from '@/lib/utils';

/** A date-first entry form for today and catch-up logging. */
export function WorkoutEntryForm({ tracker }: { tracker: WorkoutTracker }) {
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const { register, handleSubmit, watch, setValue, setFocus, setError, clearErrors, formState: { errors } } = useForm<WorkoutInput>({
    resolver: zodResolver(workoutInputSchema),
    defaultValues: { date: tracker.today, muscleId: tracker.next.id },
  });
  const selectedDate = watch('date');
  const selectedMuscle = watch('muscleId');
  const existing = tracker.entries.find(entry => entry.date === selectedDate);
  const yesterday = dateKey(subDays(parseISO(tracker.today), 1));

  const changeDate = (date: string) => {
    setValue('date', date, { shouldValidate: true });
    clearErrors('root');
    setSavedMessage(null);
  };
  const addAnother = () => {
    let date = subDays(parseISO(selectedDate || tracker.today), 1);
    const recordedDates = new Set(tracker.entries.map(entry => entry.date));
    while (recordedDates.has(dateKey(date))) date = subDays(date, 1);
    changeDate(dateKey(date));
    setFocus('date');
  };
  const submit = (input: WorkoutInput) => {
    const result = tracker.add(input);
    if (!result.success) { setError('root', { message: result.message }); return; }
    setSavedMessage(`${muscleFor(input.muscleId).name} saved for ${format(parseISO(input.date), 'MMM d, yyyy')}.`);
  };

  return <section aria-labelledby="add-heading" className="panel p-5 sm:p-7">
    <div className="mb-6">
      <h2 id="add-heading" className="text-xl font-semibold tracking-tight">Add a completed workout</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">Today or a day you missed logging. It all counts.</p>
    </div>
    <form noValidate onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <label htmlFor="workout-date" className="text-sm font-semibold">When did you train?</label>
          <div className="flex gap-1">
            <Button type="button" variant="ghost" className={cn('h-11 rounded-xl px-3 text-xs', selectedDate === tracker.today && 'bg-accent text-primary')} onClick={() => { changeDate(tracker.today); setValue('muscleId', tracker.next.id); }}>Today</Button>
            <Button type="button" variant="ghost" className={cn('h-11 rounded-xl px-3 text-xs', selectedDate === yesterday && 'bg-accent text-primary')} onClick={() => changeDate(yesterday)}>Yesterday</Button>
          </div>
        </div>
        <Input id="workout-date" type="date" min="0001-01-01" max={tracker.today} className="h-12 min-w-0 rounded-xl bg-background/50 text-base" aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : 'date-hint'} {...register('date', { onChange: () => { setSavedMessage(null); clearErrors('root'); } })} />
        {errors.date ? <p id="date-error" className="mt-2 text-sm text-destructive">Choose a valid date on or before today.</p> : <p id="date-hint" className="mt-2 text-xs text-muted-foreground">You can choose any past date.</p>}
      </div>
      <fieldset>
        <legend className="mb-3 text-sm font-semibold">What did you train?</legend>
        <div className="grid grid-cols-3 gap-2">
          {muscles.map(muscle => <label key={muscle.id} className="relative cursor-pointer">
            <input type="radio" value={muscle.id} className="peer sr-only" {...register('muscleId', { onChange: () => { setSavedMessage(null); clearErrors('root'); } })} />
            <span className={cn('flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-1 text-[13px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 sm:text-sm', selectedMuscle === muscle.id ? 'border-primary bg-accent font-semibold text-primary' : 'border-border bg-white text-muted-foreground hover:border-primary/50')}>
              {selectedMuscle === muscle.id && <Check size={13} aria-hidden="true" />}{muscle.name}
            </span>
          </label>)}
        </div>
      </fieldset>
      {errors.root && <p role="alert" className="rounded-xl bg-destructive/5 p-3 text-sm text-destructive">{errors.root.message}</p>}
      {existing ? <div className="space-y-3">
        <p role="status" className="flex items-start gap-2 rounded-xl bg-accent p-3 text-sm text-primary"><Check size={18} className="mt-0.5 shrink-0" />{savedMessage ?? `${muscleFor(existing.muscleId).name} is already saved for this day.`}</p>
        <Button type="button" variant="outline" className="h-12 w-full rounded-xl border-primary/30 text-primary" onClick={addAnother}><Plus size={18} />Add another day</Button>
      </div> : <Button type="submit" disabled={!!tracker.error} className="h-12 w-full gap-2 rounded-xl text-sm font-semibold"><Plus size={18} />Save workout</Button>}
    </form>
  </section>;
}
