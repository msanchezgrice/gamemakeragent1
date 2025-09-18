import { loadRuns } from '../lib/data-source';
import { withMetrics } from '../lib/mock-data';
import { BlockerDrawer } from '../components/blocker-drawer';
import { RunCard } from '../components/run-card';

export default async function DashboardPage() {
  const runs = withMetrics(await loadRuns());
  const awaiting = runs.filter((run) => run.status === 'awaiting_human');
  const inFlight = runs.filter((run) => run.status === 'running');
  const tasks = runs.flatMap((run) => run.blockers);

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <header className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">GameTok Orchestrator</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">Operator Console</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Monitor automated runs, respond to human checkpoints, and keep Clipcade’s feed stocked with high-likelihood hits.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SummaryBadge label="Active runs" value={runs.length} tone="primary" />
          <SummaryBadge label="Awaiting approval" value={awaiting.length} tone="warning" />
        </div>
      </header>

      <section className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <SectionHeading title="In flight" subtitle="High-priority runs currently automating" count={inFlight.length} />
          <div className="grid gap-6 md:grid-cols-2">
            {inFlight.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>

          <SectionHeading
            title="Awaiting human review"
            subtitle="Runs paused until approval or QA verification"
            count={awaiting.length}
          />
          <div className="grid gap-6 md:grid-cols-2">
            {awaiting.map((run) => (
              <RunCard key={run.id} run={run} />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <BlockerDrawer tasks={tasks} />
        </div>
      </section>
    </main>
  );
}

function SummaryBadge({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: 'primary' | 'warning';
}) {
  const palette = tone === 'primary' ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-warning/20 text-warning border border-warning/50';
  return (
    <div className={`rounded-2xl px-5 py-3 text-sm font-medium ${palette}`}>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-300/80">{label}</div>
      <div className="mt-1 text-xl">{value}</div>
    </div>
  );
}

function SectionHeading({ title, subtitle, count }: { title: string; subtitle: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">{subtitle}</p>
      </div>
      <span className="text-sm text-slate-300">{count}</span>
    </div>
  );
}
