'use client';

import { useState, useMemo } from 'react';
import { Filter } from 'lucide-react';
import type { RunRecord } from '@gametok/schemas';
import { BlockerDrawer } from '../../components/blocker-drawer';
import { RunCard } from '../../components/run-card';
import { FilterDrawer, type RunFilters } from '../../components/filter-drawer';

interface DashboardWithFiltersProps {
  runs: Array<RunRecord & {
    metrics?: {
      progress?: number;
      playRate?: number;
      likability?: number;
    };
  }>;
}

export function DashboardWithFilters({ runs }: DashboardWithFiltersProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<RunFilters>({
    search: '',
    status: [],
    phase: [],
    industry: []
  });

  // Filter runs based on current filters
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          run.brief.theme.toLowerCase().includes(searchLower) ||
          run.brief.industry.toLowerCase().includes(searchLower) ||
          run.brief.goal.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(run.status)) {
        return false;
      }

      // Phase filter
      if (filters.phase.length > 0 && !filters.phase.includes(run.phase)) {
        return false;
      }

      // Industry filter
      if (filters.industry.length > 0 && !filters.industry.includes(run.brief.industry)) {
        return false;
      }

      return true;
    });
  }, [runs, filters]);

  const awaiting = filteredRuns.filter((run) => run.status === 'awaiting_human');
  const inFlight = filteredRuns.filter((run) => run.status === 'running');
  const tasks = filteredRuns.flatMap((run) => run.blockers);

  const hasActiveFilters = filters.search || 
    filters.status.length > 0 || 
    filters.phase.length > 0 || 
    filters.industry.length > 0;

  return (
    <>
      <main className="mx-auto max-w-7xl px-8 py-12">
        <header className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">GameTok Orchestrator</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Operator Console</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Monitor automated runs, respond to human checkpoints, and keep Clipcade&apos;s feed stocked with high-likelihood hits.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SummaryBadge label="Active runs" value={filteredRuns.length} tone="primary" />
            <SummaryBadge label="Awaiting approval" value={awaiting.length} tone="warning" />
            <button
              onClick={() => setIsFilterOpen(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                hasActiveFilters 
                  ? "border-primary/40 bg-primary/10 text-primary" 
                  : "border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                  {[filters.status, filters.phase, filters.industry].reduce((count, arr) => count + arr.length, 0) + (filters.search ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
        </header>

        <section className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <SectionHeading title="In flight" subtitle="High-priority runs currently automating" count={inFlight.length} />
            {inFlight.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No runs currently in flight</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {inFlight.map((run) => (
                  <RunCard key={run.id} run={run} />
                ))}
              </div>
            )}

            <SectionHeading
              title="Awaiting human review"
              subtitle="Runs paused until approval or QA verification"
              count={awaiting.length}
            />
            {awaiting.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No runs awaiting review</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {awaiting.map((run) => (
                  <RunCard key={run.id} run={run} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <BlockerDrawer tasks={tasks} />
          </div>
        </section>
      </main>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilters={setFilters}
        currentFilters={filters}
      />
    </>
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
