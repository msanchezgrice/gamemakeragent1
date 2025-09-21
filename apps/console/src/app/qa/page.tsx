'use client';

import { useEffect, useState } from 'react';
import { loadRuns } from '../../lib/data-source';
import { QATable } from './components/qa-table';
import { QAStats } from './components/qa-stats';
import { QATableSkeleton } from '../../components/skeleton';
import type { RunRecord } from '@gametok/schemas';

interface PrototypeData {
  data?: string;
  filename?: string;
  playable?: boolean;
  specifications?: {
    engine?: string;
    resolution?: string;
    fileSize?: string;
    features?: string[];
  };
}

export default function QADashboard() {
  const [runs, setRuns] = useState<Array<RunRecord & { 
    hasPrototype?: boolean; 
    prototypeData?: PrototypeData;
    metrics?: { progress?: number; playRate?: number; likability?: number } 
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const fetchedRuns = await loadRuns();
        setRuns(fetchedRuns);
      } catch (error) {
        console.error('❌ QA Dashboard: Failed to load runs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRuns();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-12">
        <QATableSkeleton />
      </main>
    );
  }

  // Show all runs that have completed prototypes (regardless of current phase)
  const qaRuns = runs.filter((run) => 
    run.hasPrototype && // Must have a prototype
    (
      // Either currently in QA phase
      (run.phase === 'qa' && (run.status === 'running' || run.status === 'awaiting_human')) ||
      // Or has completed QA and moved to later phases (deploy, decision, etc.)
      (['deploy', 'measure', 'decision'].includes(run.phase)) ||
      // Or is done
      run.status === 'done'
    )
  );
  
  // Only show real QA data if we have actual games to test
  const qaData = qaRuns.length > 0 ? qaRuns.map((run) => ({
    ...run,
    qaMetrics: {
      ttfi: 0, // Will be populated when actual testing occurs
      fps: 0,
      errorCount: 0,
      loadTime: 0,
      memoryUsage: 0,
      crashRate: 0,
    }
  })) : [];

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
          <a href="/" className="hover:text-primary transition-colors">Console</a>
          <span>/</span>
          <span>QA Dashboard</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">QA Dashboard</h1>
            <p className="text-slate-300 mt-2">
              Monitor autoplayer performance and manual verification status
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/40 text-sm font-medium">
              {qaRuns.length} games in QA
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        <QAStats runs={qaData} />
        <QATable runs={qaData} />
      </div>
    </main>
  );
}
