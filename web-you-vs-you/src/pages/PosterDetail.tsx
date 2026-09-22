import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { muscles } from '@/lib/workouts';
import { POSTER_DAYS, posterArtwork, TOTAL_POSTER_DAYS } from '@/lib/poster-progress';
import { cn } from '@/lib/utils';
import type { PosterTracker } from '@/hooks/use-poster-progress';
import NotFound from '@/pages/NotFound';

/** The original artwork surrounds real number buttons, rather than an untappable printed grid. */
export default function PosterDetail({ tracker }: { tracker: PosterTracker }) {
  const { muscleId } = useParams<{ muscleId: string }>();
  const muscle = muscles.find(item => item.id === muscleId);
  const completed = useMemo(() => new Set(muscle ? tracker.days[muscle.id] : []), [muscle, tracker.days]);
  if (!muscle) return <NotFound />;
  const artwork = posterArtwork[muscle.id];

  return <div className="mx-auto max-w-3xl">
    <Button asChild variant="ghost" className="-ml-3 mb-3 h-11 gap-2 text-muted-foreground"><Link to="/"><ArrowLeft size={18} />All posters</Link></Button>
    <section className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 pb-4 pt-2 backdrop-blur-sm" aria-label={`${muscle.name} challenge progress`}>
      <div className="mb-3 flex items-baseline justify-between gap-3"><h1 className="text-xl font-semibold">{muscle.name}</h1><p className="text-sm tabular-nums text-muted-foreground"><strong className="font-semibold text-primary">{completed.size}</strong> / 100 completed</p></div>
      <progress className="progress-track" value={completed.size} max={100} aria-label={`${muscle.name} progress`}>{completed.size} of 100</progress>
      <p id="day-instructions" className="mt-3 text-xs text-muted-foreground">Tap a number to turn it green. Tap again to undo.</p>
    </section>

    <article aria-label={`${muscle.name} interactive poster`} className="overflow-hidden rounded-xl border bg-white text-black">
      <img src={`/anatomy/${muscle.id}-header-v1.webp`} width={1024} height={artwork.headerHeight} alt={`${muscle.name} 100 day challenge artwork`} decoding="async" className="block h-auto w-full" />
      <div role="group" aria-label={`${muscle.name} days`} aria-describedby="day-instructions" className="mx-[4.8%] grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-1">
        {POSTER_DAYS.map(day => {
          const isCompleted = completed.has(day);
          return <button key={day} type="button" aria-label={`${muscle.name} day ${day}`} aria-pressed={isCompleted} disabled={!!tracker.error} onClick={() => tracker.toggle(muscle.id, day)} className={cn('relative flex min-h-11 min-w-0 touch-manipulation items-center justify-center border text-lg font-bold tabular-nums transition-colors focus-visible:z-10 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xl', isCompleted ? 'border-primary bg-primary text-white hover:bg-primary/90' : 'border-neutral-700 bg-white text-black hover:border-primary hover:bg-secondary')}>
            {isCompleted && <Check size={9} strokeWidth={3} className="absolute right-1 top-1" aria-hidden="true" />}{day}
          </button>;
        })}
      </div>
      <img src={`/anatomy/${muscle.id}-footer-v1.webp`} width={1024} height={artwork.footerHeight} alt="" decoding="async" className="block h-auto w-full" />
    </article>
    <div className="mt-5 rounded-xl border bg-card p-4"><div className="mb-2 flex justify-between gap-4 text-xs"><span className="text-muted-foreground">Overall · all posters</span><span className="tabular-nums text-primary">{tracker.total} / {TOTAL_POSTER_DAYS}</span></div><progress className="progress-track h-1.5" value={tracker.total} max={TOTAL_POSTER_DAYS} aria-label="Overall progress">{tracker.total} of {TOTAL_POSTER_DAYS}</progress></div>
  </div>;
}
