'use client';

import { useEffect, useState } from 'react';
import { loadRuns } from '../lib/data-source';
import { DashboardWithFilters } from './components/dashboard-with-filters';
import { RunCardSkeleton } from '../components/skeleton';
import type { RunRecord } from '@gametok/schemas';

export default function DashboardPage() {
  const [runs, setRuns] = useState<Array<RunRecord & { metrics?: { progress?: number; playRate?: number; likability?: number } }>>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchRuns = async () => {
    console.log('🏠 Dashboard: Loading runs...');
    setLoading(true);
    try {
        const fetchedRuns = await loadRuns();
      console.log('🏠 Dashboard: Loaded runs count:', fetchedRuns.length);
      console.log('🏠 Dashboard: Run themes:', fetchedRuns.map(r => r.brief.theme));
      console.log('🏠 Dashboard: Setting runs state with:', fetchedRuns);
      setRuns(fetchedRuns);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('❌ Dashboard: Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  // Auto-refresh every 10 seconds for more responsive updates
  useEffect(() => {
    const interval = setInterval(fetchRuns, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <RunCardSkeleton />
          <RunCardSkeleton />
          <RunCardSkeleton />
        </div>
      </main>
    );
  }
  
  return (
    <div>
      <div className="mx-auto max-w-7xl px-8 pt-4">
        <button
          onClick={fetchRuns}
          disabled={loading}
          className="mb-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <div className="text-xs text-slate-400">
          Last refresh: {new Date(lastRefresh).toLocaleTimeString()} | Runs in state: {runs.length}
        </div>
      </div>
      <DashboardWithFilters runs={runs} />
    </div>
  );
}

