import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return <section className="panel flex min-h-[350px] flex-col items-center justify-center p-8 text-center"><p className="eyebrow mb-3 text-primary">A little off track</p><h2 className="display-type text-6xl">Page not found.</h2><p className="mt-4 text-sm text-muted-foreground">Your posters and progress are right where you left them.</p><Button asChild className="mt-6"><Link to="/"><ArrowLeft size={16} />Back to posters</Link></Button></section>;
}
