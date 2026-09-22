import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronLeft, ChevronRight, CircleCheck, Flame, Repeat2, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Anatomy, DayGrid, MuscleCard, ProgressBar, WorkoutHistory } from '@/components/workout-ui';
import type { WorkoutTracker } from '@/hooks/use-workouts';
import { cn } from '@/lib/utils';
import { dateKey, muscleFor, muscles, type Muscle, type Workout } from '@/lib/workouts';

type Props = { tracker: WorkoutTracker; onMuscle: (muscle: Muscle) => void; onUndo: (entry: Workout) => void };
export default function Today({ tracker, onMuscle, onUndo }: Props) {
  const { entries, today, todayEntry, next } = tracker;
  const current = todayEntry ? muscleFor(todayEntry.muscleId) : next;
  const count = entries.filter(e => e.muscleId === current.id).length;
  const [showChallenge, setShowChallenge] = useState<boolean>(false);
  const carousel = useRef<HTMLDivElement>(null);
  const weekStart = startOfWeek(parseISO(today), { weekStartsOn: 1 });
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekCount = entries.filter(e => e.date >= dateKey(weekStart) && e.date <= dateKey(addDays(weekStart, 6))).length;
  const currentIndex = muscles.findIndex(m => m.id === next.id);
  return <div className="page-enter space-y-8">
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_305px]">
      <section className="relative isolate flex min-h-[380px] flex-col overflow-hidden rounded-2xl border border-[#e9ded5] bg-[#f3ece4] sm:min-h-[396px]" aria-label="Today's workout">
        <div aria-hidden="true" className="absolute -right-14 -top-9 -z-10 h-[420px] w-[420px] rounded-full border border-white/70" />
        <div aria-hidden="true" className="absolute -right-4 top-5 -z-10 h-[320px] w-[320px] rounded-full border border-white/70" />
        <div className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-8"><span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/50 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-primary"><span className={cn('h-1.5 w-1.5 rounded-full bg-primary', !todayEntry && 'motion-safe:animate-pulse')} />{todayEntry ? 'WORKOUT COMPLETE' : 'TODAY’S FOCUS'}</span><span className="eyebrow text-[#89796b]">{String(muscles.findIndex(m => m.id === current.id) + 1).padStart(2, '0')} / 09</span></div>
        <div className="pointer-events-none absolute bottom-[73px] right-[-18px] top-[50px] w-[61%] sm:bottom-10 sm:right-0 sm:top-6 sm:w-[59%]"><Anatomy muscle={current} className="object-right-bottom" /></div>
        <div className="relative z-10 flex flex-1 flex-col items-start px-6 pb-5 pt-7 sm:px-8 sm:pt-8">
          <p className="eyebrow text-[#8b7d70]">{todayEntry ? 'You put in the work.' : 'Let’s get stronger.'}</p>
          <h2 className={cn('display-type mt-2 text-[78px] leading-none sm:text-[98px]', current.name.length > 6 && 'text-[55px] sm:text-[70px]')}>{current.name}</h2>
          <h3 className="mt-2 max-w-[170px] text-[15px] font-semibold leading-snug sm:max-w-[240px]">{current.message}</h3>
          <p className="mt-2 hidden max-w-[200px] text-xs leading-relaxed text-[#81766d] sm:block">{current.description}</p>
          <div className="mt-auto pt-7"><Button onClick={tracker.complete} disabled={!!todayEntry || !!tracker.error} className={cn('h-12 gap-3 rounded-lg px-5 text-[13px] font-semibold shadow-md shadow-primary/10 sm:px-6', todayEntry && 'bg-[#48775a] disabled:opacity-100')}>
            {todayEntry ? <CheckCheck size={18} /> : <Check size={18} />} {todayEntry ? `Day ${entries.length} completed` : `Complete Day ${entries.length + 1}`} {!todayEntry && <ArrowRight size={17} className="ml-2" />}
          </Button></div>
        </div>
        <div className="relative z-10 flex items-center justify-between gap-3 border-t border-[#e3d8ce] bg-[#f5eee7]/90 px-6 py-3.5 text-[11px] sm:px-8"><span className="flex items-center gap-2 text-[#756c61]"><CircleCheck size={14} />{todayEntry ? 'Saved to your calendar' : 'One workout. One step forward.'}</span><button onClick={() => onMuscle(current)} className="flex items-center gap-1.5 font-semibold text-[#5e5147] hover:text-primary">{count} / 100 <ArrowUpRight size={13} /></button></div>
      </section>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <section className="relative overflow-hidden rounded-2xl bg-[#292b28] p-6 text-white">
          <div className="flex items-center justify-between"><p className="eyebrow text-white/65">The 100-workout journey</p><Target size={17} className="text-[#efae96]" /></div>
          <div className="mt-4 flex items-end gap-2"><span className="display-type text-[66px] leading-none">{entries.length.toString().padStart(2, '0')}</span><span className="mb-1.5 text-xl font-light text-white/35">/ 100</span><span className="mb-2 ml-auto rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-[#f0bda9]">{Math.min(entries.length, 100)}%</span></div>
          <ProgressBar value={entries.length} label="Overall challenge progress" className="mt-4 h-1.5 bg-white/15 [&::-webkit-progress-bar]:bg-white/15 [&::-webkit-progress-value]:bg-[#e39274] [&::-moz-progress-bar]:bg-[#e39274]" />
          <p className="mt-3 text-[11px] text-white/50">{entries.length === 0 ? 'Every great journey starts with Day 1.' : entries.length >= 100 ? 'Goal achieved. Your journey keeps going.' : `${100 - entries.length} workouts to your next version.`}</p>
          <button onClick={() => setShowChallenge(true)} className="mt-4 flex min-h-7 w-full items-center justify-between border-t border-white/10 pt-3 text-[11px] font-medium text-white/80 hover:text-white">View your 100 days <ArrowUpRight size={14} /></button>
        </section>
        <section className="panel p-5"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold">This week</h3><span className="text-[10px] text-muted-foreground">{weekCount} {weekCount === 1 ? 'workout' : 'workouts'}</span></div>
          <div className="mt-4 grid grid-cols-7 gap-1.5">{week.map(day => { const key = dateKey(day); const done = entries.some(e => e.date === key); return <Link to={`/calendar?date=${key}`} key={key} aria-label={`${format(day, 'EEEE, MMMM d')}${done ? ', workout completed' : ''}`} className="flex flex-col items-center gap-2"><span className="text-[9px] text-muted-foreground">{format(day, 'EEEEE')}</span><span className={cn('flex h-8 w-8 items-center justify-center rounded-full border text-[11px] transition hover:border-primary', done ? 'border-primary bg-primary text-white' : key === today ? 'border-primary bg-accent font-bold text-primary' : 'border-transparent bg-secondary/70 text-muted-foreground')}>{done ? <Check size={14} /> : format(day, 'd')}</span></Link>; })}</div>
        </section>
      </div>
    </div>

    <section><div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><h2 className="text-lg font-bold tracking-tight">Your rotation</h2><span className="hidden rounded-full bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground sm:inline">9 body parts · repeat</span></div><Link to="/body-parts" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">View all <ArrowRight size={14} /></Link></div>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-xl border bg-white px-4 py-4 sm:justify-between sm:px-5">{muscles.map((muscle, index) => <div className="flex items-center" key={muscle.id}><button onClick={() => onMuscle(muscle)} className={cn('flex min-h-9 items-center gap-2 rounded-lg px-2 py-2 text-[11px] transition-colors hover:bg-secondary', currentIndex === index && 'bg-accent font-bold text-primary')}><span className={cn('flex h-4 w-4 items-center justify-center rounded-full text-[9px]', currentIndex === index ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground')}>{index + 1}</span>{muscle.name}</button>{index !== 8 && <ChevronRight size={11} className="mx-0.5 text-border" />}</div>)}<Repeat2 size={16} className="ml-2 text-muted-foreground" /></div>
      <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground"><Repeat2 size={12} />{todayEntry ? `Next up: ${next.name}. Come back when you’re ready.` : 'Your rotation moves forward when you do. Rest days are part of the process.'}</p>
    </section>

    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold tracking-tight">Stronger, part by part.</h2><p className="mt-1 text-xs text-muted-foreground">Nine goals. One stronger you.</p></div><div className="flex gap-1.5"><Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-transparent" aria-label="Previous body parts" onClick={() => carousel.current?.scrollBy({ left: -400, behavior: 'smooth' })}><ChevronLeft size={15} /></Button><Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-transparent" aria-label="Next body parts" onClick={() => carousel.current?.scrollBy({ left: 400, behavior: 'smooth' })}><ChevronRight size={15} /></Button></div></div>
      <div ref={carousel} className="scroll-clean -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3 pt-1">{muscles.map(muscle => <div className="w-[160px] shrink-0 snap-start sm:w-[calc((100%-48px)/4)] 2xl:w-[calc((100%-64px)/5)]" key={muscle.id}><MuscleCard muscle={muscle} count={entries.filter(e => e.muscleId === muscle.id).length} active={next.id === muscle.id} onClick={() => onMuscle(muscle)} /></div>)}</div>
    </section>

    <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]"><div className="panel px-5 py-5"><div className="flex items-center justify-between"><h2 className="text-sm font-bold">Recently in the books</h2><Link to="/calendar" className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">View history <ArrowUpRight size={13} /></Link></div><WorkoutHistory entries={entries.slice(-3)} onUndo={onUndo} latestId={entries.at(-1)?.id} compact /></div>
      <div className="relative flex flex-col justify-center overflow-hidden rounded-2xl border border-[#e9e2d7] bg-[#eeeae1] p-6 sm:p-8"><Flame size={22} strokeWidth={1.5} className="mb-3 text-primary" /><p className="display-type max-w-[330px] text-3xl leading-[1.08]">Discipline today.<br />Stronger tomorrow.</p><p className="eyebrow mt-4 text-[#8b8375]">Your only competition is you.</p><Trophy size={125} strokeWidth={0.65} className="absolute -bottom-6 -right-4 -rotate-12 text-[#d7d0c1]" /></div>
    </section>
    <Dialog open={showChallenge} onOpenChange={setShowChallenge}><DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto rounded-2xl p-5 sm:p-8"><DialogHeader className="text-left"><p className="eyebrow mb-2 text-primary">Small steps. Big results.</p><DialogTitle className="display-type text-4xl">Your 100-workout journey</DialogTitle><DialogDescription>{entries.length} completed · {Math.max(0, 100 - entries.length)} to your goal. Tap the next day to log today’s workout, or a completed day to see its date.</DialogDescription></DialogHeader><ProgressBar value={entries.length} label="100-workout journey" className="my-3" /><DayGrid entries={entries} canComplete={!todayEntry && !tracker.error} onComplete={tracker.complete} /></DialogContent></Dialog>
  </div>;
}
