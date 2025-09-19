import { notFound } from 'next/navigation';
import { loadRuns } from '../../../lib/data-source';
import { withMetrics } from '../../../lib/mock-data';
import { RunTimeline } from './components/run-timeline';
import { RunTabs } from './components/run-tabs';

interface RunDetailPageProps {
  params: { id: string };
}

export default async function RunDetailPage({ params }: RunDetailPageProps) {
  console.log('🔍 RunDetailPage: Loading run with ID:', params.id);
  
  const runs = withMetrics(await loadRuns());
  console.log('🔍 RunDetailPage: Total runs loaded:', runs.length);
  console.log('🔍 RunDetailPage: Available run IDs:', runs.map(r => r.id));
  
  const run = runs.find((r) => r.id === params.id);
  console.log('🔍 RunDetailPage: Found run:', !!run);

  if (!run) {
    console.error('❌ RunDetailPage: Run not found for ID:', params.id);
    console.log('📋 Available runs:', runs.map(r => ({ id: r.id, theme: r.brief.theme })));
    notFound();
  }

  console.log('✅ RunDetailPage: Rendering run:', run.brief.theme);

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
          <a href="/" className="hover:text-primary transition-colors">Console</a>
          <span>/</span>
          <span>Run {run.id.slice(0, 8)}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">{run.brief.theme}</h1>
            <p className="text-slate-300 mt-2">{run.brief.goal}</p>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(run.status)}`}>
              {run.status.replace('_', ' ')}
            </span>
            <span className="px-4 py-2 rounded-full text-sm font-medium bg-slate-800/50 text-slate-300 border border-slate-700/50">
              {run.phase}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[350px,1fr]">
        <div>
          <RunTimeline run={run} />
        </div>
        <div>
          <RunTabs run={run} />
        </div>
      </div>
    </main>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'awaiting_human':
      return 'bg-warning/20 text-warning border border-warning/30';
    case 'done':
      return 'bg-success/20 text-success border border-success/30';
    case 'failed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'running':
      return 'bg-primary/20 text-primary border border-primary/30';
    default:
      return 'bg-slate-700/20 text-slate-400 border border-slate-700/30';
  }
}

