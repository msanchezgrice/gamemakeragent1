'use client';

import { useEffect, useState } from 'react';
import { loadRuns } from '../lib/data-source';
import { DashboardWithFilters } from './components/dashboard-with-filters';
import { RunCardSkeleton } from '../components/skeleton';
import type { RunRecord } from '@gametok/schemas';

export default function DashboardPage() {
  const [runs, setRuns] = useState<Array<RunRecord & { metrics?: { progress?: number; playRate?: number; likability?: number } }>>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchRuns = async (isBackgroundRefresh = false) => {
    console.log('🏠 Dashboard: Loading runs...', isBackgroundRefresh ? '(background)' : '(initial)');
    
    if (isBackgroundRefresh) {
      setBackgroundRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // Trigger auto-processing first (only for background refreshes to avoid blocking initial load)
      if (isBackgroundRefresh) {
        try {
          console.log('🤖 Dashboard: Triggering auto-processing...');
          const processResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/process-runs`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (processResponse.ok) {
            const result = await processResponse.json();
            console.log('✅ Dashboard: Auto-processing result:', result);
          } else {
            console.warn('⚠️ Dashboard: Auto-processing failed:', processResponse.status);
          }
        } catch (processError) {
          console.warn('⚠️ Dashboard: Auto-processing error:', processError);
        }
      }

      const fetchedRuns = await loadRuns();
      console.log('🏠 Dashboard: Loaded runs count:', fetchedRuns.length);
      console.log('🏠 Dashboard: Run themes:', fetchedRuns.map(r => r.brief.theme));
      console.log('🏠 Dashboard: Setting runs state with:', fetchedRuns);
      setRuns(fetchedRuns);
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('❌ Dashboard: Failed to load runs:', error);
    } finally {
      if (isBackgroundRefresh) {
        setBackgroundRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchRuns(false); // Initial load
  }, []);

  // Auto-refresh every 30 seconds for more responsive updates (background only)
  useEffect(() => {
    const interval = setInterval(() => fetchRuns(true), 30000);
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
          onClick={() => fetchRuns(false)}
          disabled={loading || backgroundRefreshing}
          className="mb-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : backgroundRefreshing ? 'Updating...' : 'Refresh Data'}
        </button>
        <div className="text-xs text-slate-400">
          Last refresh: {new Date(lastRefresh).toLocaleTimeString()} | Runs in state: {runs.length}
          {backgroundRefreshing && <span className="ml-2 text-primary">• Auto-updating...</span>}
        </div>
      </div>
      <DashboardWithFilters runs={runs} />
    </div>
  );
}

