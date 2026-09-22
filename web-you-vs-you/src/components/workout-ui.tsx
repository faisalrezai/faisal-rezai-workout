import { memo, useState } from 'react';
import { ArrowUpRight, Check, Dumbbell, Undo2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { muscleFor, type Muscle, type Workout } from '@/lib/workouts';
import type { WorkoutTracker } from '@/hooks/use-workouts';

export const Anatomy = memo(function Anatomy({ muscle, className = '' }: { muscle: Muscle; className?: string }) {
  return <img src={`/anatomy/${muscle.id === 'back' ? 'back-v2' : muscle.id}.webp`} alt={`${muscle.name} muscle anatomy`} className={cn('h-full w-full object-contain mix-blend-multiply', className)} />;
});

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  return <progress className={cn('progress-track', className)} value={Math.min(value, 100)} max={100} aria-label={label}>{Math.min(value, 100)}%</progress>;
}

export function MuscleCard({ muscle, count, active, onClick }: { muscle: Muscle; count: number; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} aria-label={`Open ${muscle.name} challenge`} className={cn('group panel relative w-full min-w-0 overflow-hidden text-left transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-black/[0.03]', active && 'border-primary/50 bg-[#fcf3ef]')}>
    <div className="flex items-center justify-between px-4 pt-4"><span className="eyebrow text-muted-foreground">{muscle.category}</span><ArrowUpRight size={15} className="text-muted-foreground transition group-hover:text-primary" /></div>
    <div className="mx-5 mt-2 h-32 overflow-hidden"><Anatomy muscle={muscle} className="transition-transform duration-500 group-hover:scale-105" /></div>
    <div className="p-4 pt-3"><div className="mb-3 flex items-center justify-between gap-1"><h3 className="text-base font-bold">{muscle.name}</h3><span className="text-[11px] text-muted-foreground"><strong className="font-semibold text-foreground">{count}</strong> / 100</span></div><ProgressBar value={count} label={`${muscle.name} progress`} /></div>
  </button>;
}

export function WorkoutHistory({ entries, onUndo, latestId, compact = false }: { entries: Workout[]; onUndo?: (entry: Workout) => void; latestId?: string; compact?: boolean }) {
  if (!entries.length) return <div className="flex flex-col items-center justify-center px-5 py-9 text-center"><div className="mb-3 rounded-full bg-secondary p-3"><Dumbbell size={21} className="text-muted-foreground" /></div><p className="text-sm font-semibold">Your story starts with Day 1.</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">Complete a workout and it will appear here, with the body part and date.</p></div>;
  return <div className="divide-y">{[...entries].reverse().map(entry => <div key={entry.id} className={cn('flex items-center gap-3 py-4', compact && 'py-3')}>
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Check size={18} /></div>
    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{muscleFor(entry.muscleId).name}</p><p className="mt-0.5 text-xs text-muted-foreground">{format(parseISO(entry.date), 'EEEE, MMM d, yyyy')}</p></div>
    {onUndo && entry.id === latestId ? <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground" aria-label={`Undo ${muscleFor(entry.muscleId).name} workout`} onClick={() => onUndo(entry)}><Undo2 size={16} /></Button> : <span className="eyebrow hidden text-primary sm:block">Completed</span>}
  </div>)}</div>;
}

export function DayGrid({ entries, canComplete, onComplete }: { entries: Workout[]; canComplete: boolean; onComplete: () => void }) {
  const [selected, setSelected] = useState<Workout | null>(null);
  return <><div className="grid grid-cols-5 gap-2 sm:grid-cols-10">{Array.from({ length: 100 }, (_, index) => {
    const entry = entries[index];
    const isNext = index === entries.length;
    return <button key={index} disabled={!entry && !(isNext && canComplete)} aria-label={entry ? `Day ${index + 1}, ${muscleFor(entry.muscleId).name}, ${entry.date}` : `Day ${index + 1}${isNext && canComplete ? ', mark complete' : ', not completed'}`} onClick={() => entry ? setSelected(entry) : onComplete()} className={cn('flex min-h-11 items-center justify-center rounded-lg border text-xs font-semibold transition-colors', entry ? 'border-primary bg-primary text-white hover:bg-primary/90' : isNext ? 'border-primary/50 bg-accent text-primary' : 'border-border bg-secondary/40 text-muted-foreground/60', !entry && !(isNext && canComplete) && 'cursor-default')}>
      {entry ? <span className="flex items-center gap-1"><Check size={11} />{index + 1}</span> : String(index + 1).padStart(2, '0')}
    </button>;
  })}</div><p className="mt-4 text-xs leading-relaxed text-muted-foreground">Numbered days are completed workouts, not consecutive calendar days. Rest days never reset your progress.</p>
  <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="w-[calc(100%-2rem)] rounded-2xl"><DialogHeader><DialogTitle>Day {selected ? entries.indexOf(selected) + 1 : ''} complete</DialogTitle><DialogDescription>{selected && `${muscleFor(selected.muscleId).name} · ${format(parseISO(selected.date), 'EEEE, MMMM d, yyyy')}`}</DialogDescription></DialogHeader><div className="mx-auto my-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-primary"><Check size={40} /></div><p className="text-center text-sm text-muted-foreground">A little stronger than yesterday.</p></DialogContent></Dialog></>;
}

export function MuscleDetail({ muscle, onClose, tracker, onUndo }: { muscle: Muscle | null; onClose: () => void; tracker: WorkoutTracker; onUndo: (entry: Workout) => void }) {
  if (!muscle) return null;
  const entries = tracker.entries.filter(e => e.muscleId === muscle.id);
  const canComplete = !tracker.error && !tracker.todayEntry && tracker.next.id === muscle.id;
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-2xl p-5 sm:p-8"><DialogHeader className="text-left"><p className="eyebrow mb-2 text-primary">Your 100-workout challenge</p><DialogTitle className="display-type text-5xl">{muscle.name}</DialogTitle><DialogDescription>{muscle.message}</DialogDescription></DialogHeader>
    <div className="my-2 grid grid-cols-[1fr_140px] items-center gap-5 rounded-xl bg-secondary/60 p-5"><div><span className="display-type text-5xl">{entries.length}</span><span className="ml-2 text-sm text-muted-foreground">/ 100 workouts</span><ProgressBar value={entries.length} label={`${muscle.name} challenge progress`} className="my-4" /><p className="text-xs text-muted-foreground">{entries.length >= 100 ? 'Challenge complete. Keep your story going.' : `${100 - entries.length} more moments of showing up.`}</p></div><div className="h-32"><Anatomy muscle={muscle} /></div></div>
    {canComplete && <Button className="h-12" onClick={tracker.complete}><Check />Complete Day {tracker.entries.length + 1} · {muscle.name}</Button>}
    {!canComplete && !tracker.todayEntry && <p className="text-xs text-muted-foreground">Your next workout is {tracker.next.name}. Follow your rotation from Today.</p>}
    <h3 className="mt-3 text-sm font-semibold">Every workout counts</h3><DayGrid entries={entries} canComplete={canComplete} onComplete={tracker.complete} />
    <h3 className="mt-5 text-sm font-semibold">Workout history</h3><WorkoutHistory entries={entries} latestId={tracker.entries.at(-1)?.id} onUndo={onUndo} />
  </DialogContent></Dialog>;
}
