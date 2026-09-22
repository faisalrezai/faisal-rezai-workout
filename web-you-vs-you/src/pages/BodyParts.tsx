import { useMemo, useState } from 'react';
import { Repeat2, Target } from 'lucide-react';
import { MuscleCard } from '@/components/workout-ui';
import type { WorkoutTracker } from '@/hooks/use-workouts';
import { muscles, type Muscle } from '@/lib/workouts';
import { cn } from '@/lib/utils';

const filters = ['All body parts', 'Upper body', 'Lower body', 'Core'] as const;
export default function BodyParts({ tracker, onMuscle }: { tracker: WorkoutTracker; onMuscle: (muscle: Muscle) => void }) {
  const [filter, setFilter] = useState<string>('All body parts');
  const counts = useMemo(() => new Map(muscles.map(muscle => [muscle.id, tracker.entries.filter(entry => entry.muscleId === muscle.id).length])), [tracker.entries]);
  const filtered = muscles.filter(muscle => filter === 'All body parts' || muscle.category === filter);
  return <div className="page-enter space-y-7"><div className="flex flex-col gap-4 rounded-2xl border border-[#e5dace] bg-[#f2ebe2] p-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/60 text-primary"><Target size={22} /></div><div><h2 className="text-sm font-bold">A hundred days of showing up. For every muscle.</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Each workout grows your overall progress and one body-part challenge.</p></div></div><span className="eyebrow shrink-0 text-primary">{muscles.filter(m => (counts.get(m.id) ?? 0) >= 100).length} / 9 goals reached</span></div>
  <div className="flex flex-wrap gap-2" role="group" aria-label="Filter muscle groups">{filters.map(item => <button key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} className={cn('min-h-10 rounded-full border px-4 text-xs font-medium transition-colors', filter === item ? 'border-foreground bg-foreground text-white' : 'border-border bg-transparent text-muted-foreground hover:bg-secondary')}>{item}</button>)}</div>
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">{filtered.map(muscle => <MuscleCard key={muscle.id} muscle={muscle} count={counts.get(muscle.id) ?? 0} active={tracker.next.id === muscle.id} onClick={() => onMuscle(muscle)} />)}</div>
  <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"><Repeat2 size={15} className="mt-0.5 shrink-0" />Your next focus is {tracker.next.name}. Keep following your rotation, at your own pace. Tap any body part to explore its 100-day tracker and workout history.</p>
  </div>;
}
