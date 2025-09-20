'use client';

import { useEffect, useState } from 'react';
import { loadRuns } from '../../lib/data-source';
import { QATable } from './components/qa-table';
import { QAStats } from './components/qa-stats';
import { QATableSkeleton } from '../../components/skeleton';
import type { RunRecord } from '@gametok/schemas';

export default function QADashboard() {
  const [runs, setRuns] = useState<Array<RunRecord & { metrics?: { progress?: number; playRate?: number; likability?: number } }>>([]);
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

  const qaRuns = runs.filter((run) => run.phase === 'qa' || run.status === 'awaiting_human');
  
  // Mock QA data
  const qaData = qaRuns.map((run) => ({
    ...run,
    qaMetrics: {
      ttfi: Math.random() * 3000 + 500, // Time to first interaction (ms)
      fps: Math.random() * 20 + 40, // FPS
      errorCount: Math.floor(Math.random() * 5),
      loadTime: Math.random() * 2000 + 1000,
      memoryUsage: Math.random() * 50 + 20, // MB
      crashRate: Math.random() * 0.05, // 0-5%
    }
  }));

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
