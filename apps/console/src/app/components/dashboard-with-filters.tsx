'use client';

import { useState, useMemo } from 'react';
import { Filter, Play, Copy, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RunRecord } from '@gametok/schemas';
import { BlockerDrawer } from '../../components/blocker-drawer';
import { RunCard } from '../../components/run-card';
import { FilterDrawer, type RunFilters } from '../../components/filter-drawer';
import { cn } from '../../lib/utils';

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
  console.log('🎯 DashboardWithFilters: Received runs:', runs.length);
  console.log('🎯 DashboardWithFilters: Run themes:', runs.map(r => r.brief?.theme || 'No theme'));
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<RunFilters>({
    search: '',
    status: [],
    phase: [],
    industry: []
  });

  // Filter runs based on current filters
  const filteredRuns = useMemo(() => {
    console.log('🔄 DashboardWithFilters: Filtering runs, input count:', runs.length);
    const filtered = runs.filter((run) => {
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
    console.log('🔄 DashboardWithFilters: Filtered result count:', filtered.length);
    return filtered;
  }, [runs, filters]);

  const queued = filteredRuns.filter((run) => run.status === 'queued');
  const awaiting = filteredRuns.filter((run) => run.status === 'awaiting_human');
  const inFlight = filteredRuns.filter((run) => run.status === 'running');
  const tasks = filteredRuns.flatMap((run) => run.blockers);
  
  console.log('📊 Dashboard sections:');
  console.log('  - Queued runs:', queued.length);
  console.log('  - In flight runs:', inFlight.length);
  console.log('  - Awaiting runs:', awaiting.length);

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
            <SummaryBadge label="Queued" value={queued.length} tone="primary" />
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

        {/* Recent Games Row */}
        <RecentGamesRow runs={runs} />

        <section className="mt-10 grid gap-8 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <SectionHeading title="Queued" subtitle="New runs ready to start processing" count={queued.length} />
            {queued.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No runs in queue</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {queued.map((run) => (
                  <RunCard key={run.id} run={run} />
                ))}
              </div>
            )}

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

interface RecentGamesRowProps {
  runs: Array<RunRecord & {
    hasPrototype?: boolean;
    prototypeData?: unknown;
    metrics?: {
      progress?: number;
      playRate?: number;
      likability?: number;
    };
  }>;
}

function RecentGamesRow({ runs }: RecentGamesRowProps) {
  const [playingGame, setPlayingGame] = useState<string | null>(null);
  
  // Get completed runs with prototypes, sorted by most recent
  const completedGames = useMemo(() => {
    return runs
      .filter(run => 
        run.status === 'done' || 
        (run.phase === 'qa' && run.hasPrototype) ||
        (run.phase === 'deploy' && run.hasPrototype)
      )
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6); // Show max 6 recent games
  }, [runs]);

  if (completedGames.length === 0) {
    return null; // Don't show the section if no games are available
  }

  const handleRemix = (run: RunRecord) => {
    // Navigate to new run page with pre-filled data
    const remixData = {
      industry: run.brief.industry,
      targetAudience: run.brief.targetAudience,
      theme: `${run.brief.theme} (Remix)`,
      goal: `Remix of: ${run.brief.goal}`,
      gameType: (run.brief as { gameType?: string }).gameType || '',
      controlType: (run.brief as { controlType?: string }).controlType || ''
    };
    
    // Store remix data in localStorage and navigate
    localStorage.setItem('remixData', JSON.stringify(remixData));
    window.location.href = '/runs/new?remix=true';
  };

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Recent Games</h2>
          <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">
            Completed prototypes ready for testing and remixing
          </p>
        </div>
        <span className="text-sm text-slate-300">{completedGames.length}</span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
        {completedGames.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-64 rounded-2xl border border-slate-800/50 bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-200 overflow-hidden group"
          >
            {/* Game Thumbnail */}
            <div className="h-32 bg-gradient-to-br from-primary/20 to-purple-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white mb-1">
                    {game.brief.theme}
                  </div>
                  <div className="text-xs text-slate-300 uppercase tracking-wider">
                    {game.brief.industry}
                  </div>
                </div>
              </div>
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => setPlayingGame(game.id)}
                  className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors"
                >
                  <Play className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Game Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{game.brief.theme}</h3>
                  <p className="text-xs text-slate-400 truncate">{game.brief.targetAudience}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    game.status === 'done' ? "bg-success" : 
                    game.phase === 'qa' ? "bg-warning" : "bg-primary"
                  )} />
                  <span className="text-xs text-slate-400 capitalize">
                    {game.status === 'done' ? 'Complete' : game.phase}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                {game.brief.goal}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPlayingGame(game.id)}
                  className="flex-1 px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-xs font-medium hover:bg-primary/30 transition-colors flex items-center justify-center gap-1"
                >
                  <Play className="h-3 w-3" />
                  Play
                </button>
                <button
                  onClick={() => handleRemix(game)}
                  className="flex-1 px-3 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Remix
                </button>
                <button
                  onClick={() => window.open(`/runs/${game.id}`, '_blank')}
                  className="px-2 py-1.5 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Game Player Modal */}
      {playingGame && (
        <GamePlayerModal 
          run={completedGames.find(g => g.id === playingGame)!} 
          onClose={() => setPlayingGame(null)} 
        />
      )}
    </section>
  );
}

function GamePlayerModal({ 
  run, 
  onClose 
}: { 
  run: RunRecord & { prototypeData?: unknown }; 
  onClose: () => void; 
}) {
  const prototypeHTML = (run.prototypeData as { data?: string })?.data || '';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-slate-800 rounded-3xl p-6 w-full max-w-2xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-white">Game Testing</h3>
            <p className="text-sm text-slate-400 mt-1">{run.brief.theme}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </header>

        <div className="bg-black rounded-2xl overflow-hidden flex-1 min-h-0">
          {prototypeHTML ? (
            <iframe
              srcDoc={prototypeHTML}
              className="w-full h-full border-0"
              title={run.brief.theme}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No prototype available</p>
                <p className="text-sm mt-2">Build phase may not be complete</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
