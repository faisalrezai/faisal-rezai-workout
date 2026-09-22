import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { muscles } from '@/lib/workouts';
import { TOTAL_POSTER_DAYS } from '@/lib/poster-progress';
import type { PosterTracker } from '@/hooks/use-poster-progress';

/** The nine original posters and their combined progress. */
export default function PosterGallery({ tracker }: { tracker: PosterTracker }) {
  return <>
    <section aria-labelledby="overall-heading" className="mb-7 rounded-2xl border border-primary/15 bg-accent p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div><h1 id="overall-heading" className="text-base font-semibold">Overall progress</h1><p className="mt-1 text-xs text-muted-foreground">All 9 challenges · 100 days each</p></div>
        <p className="whitespace-nowrap text-sm tabular-nums text-primary"><strong className="text-3xl font-semibold tracking-tight">{tracker.total}</strong> / {TOTAL_POSTER_DAYS}</p>
      </div>
      <progress className="progress-track h-2.5" value={tracker.total} max={TOTAL_POSTER_DAYS} aria-label="Overall progress">{tracker.total} of {TOTAL_POSTER_DAYS}</progress>
    </section>
    <h2 className="text-xl font-semibold tracking-tight">Your posters</h2>
    <p className="mb-5 mt-1 text-sm text-muted-foreground">Open a poster. Tap the days you’ve completed.</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
      {muscles.map(muscle => <Link key={muscle.id} to={`/poster/${muscle.id}`} aria-label={`Open ${muscle.name} poster`} className="group overflow-hidden rounded-xl border bg-white transition-colors hover:border-primary/50 focus-visible:ring-offset-4">
        <img src={`/anatomy/${muscle.id}-interactive-v1.jpeg`} alt={`${muscle.name} 100 day challenge poster`} width={1024} height={1536} loading="lazy" decoding="async" className="block h-auto w-full" />
        <div className="border-t p-3 sm:p-4"><div className="mb-2 flex items-center justify-between gap-1"><h3 className="text-sm font-semibold sm:text-base">{muscle.name}</h3><ArrowUpRight size={15} className="shrink-0 text-primary" aria-hidden="true" /></div><div className="mb-2 flex items-baseline justify-between text-xs text-muted-foreground"><span>Completed</span><span className="tabular-nums"><strong className="font-medium text-primary">{tracker.days[muscle.id].length}</strong> / 100</span></div><progress className="progress-track h-1.5" value={tracker.days[muscle.id].length} max={100} aria-label={`${muscle.name} progress`}>{tracker.days[muscle.id].length} of 100</progress></div>
      </Link>)}
    </div>
  </>;
}
