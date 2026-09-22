import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePosterProgress } from '@/hooks/use-poster-progress';
import PosterGallery from '@/pages/PosterGallery';
import PosterDetail from '@/pages/PosterDetail';
import NotFound from '@/pages/NotFound';

export default function Index() {
  const tracker = usePosterProgress();
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname]);

  return <div className="min-h-screen">
    <header className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-2 px-4 py-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6 sm:py-7">
      <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2.5 text-lg font-bold leading-snug tracking-tight" aria-label="Faisal Rezai Unique Workout Routine home"><Dumbbell size={23} className="shrink-0 text-primary" aria-hidden="true" /><span>Faisal Rezai Unique Workout Routine</span></Link>
      <span className="shrink-0 text-xs text-muted-foreground">100 day challenges</span>
    </header>
    <main className="mx-auto max-w-4xl px-4 pb-8 sm:px-6">
      {tracker.error && <div role="alert" className="mb-5 rounded-xl border border-destructive/30 bg-card p-4 text-sm text-destructive"><p>{tracker.error}</p><Button variant="outline" className="mt-3 h-11" onClick={tracker.refresh}>Retry loading progress</Button></div>}
      <Routes>
        <Route index element={<PosterGallery tracker={tracker} />} />
        <Route path="poster/:muscleId" element={<PosterDetail tracker={tracker} />} />
        <Route path="body-parts" element={<Navigate to="/" replace />} />
        <Route path="calendar" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <p role="status" aria-live="polite" className="sr-only">{tracker.announcement}</p>
      <footer className="mt-7 text-center text-[11px] leading-relaxed text-muted-foreground">Progress saves in this browser.<br />Clearing browser data removes it.</footer>
    </main>
  </div>;
}
