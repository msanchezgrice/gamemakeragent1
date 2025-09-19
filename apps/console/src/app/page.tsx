'use client';

import { useEffect, useState } from 'react';
import { loadRuns } from '../lib/data-source';
import { withMetrics } from '../lib/mock-data';
import { DashboardWithFilters } from './components/dashboard-with-filters';
import { RunCardSkeleton } from '../components/skeleton';
import type { RunRecord } from '@gametok/schemas';

export default function DashboardPage() {
  const [runs, setRuns] = useState<Array<RunRecord & { metrics?: { progress?: number; playRate?: number; likability?: number } }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      console.log('🏠 Dashboard: Loading runs...');
      try {
        const fetchedRuns = withMetrics(await loadRuns());
        console.log('🏠 Dashboard: Loaded runs count:', fetchedRuns.length);
        console.log('🏠 Dashboard: Run themes:', fetchedRuns.map(r => r.brief.theme));
        setRuns(fetchedRuns);
      } catch (error) {
        console.error('❌ Dashboard: Failed to load runs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRuns();
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
  
  return <DashboardWithFilters runs={runs} />;
}

