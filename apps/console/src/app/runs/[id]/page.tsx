'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { loadRuns } from '../../../lib/data-source';
import { withMetrics } from '../../../lib/mock-data';
import { RunTimeline } from './components/run-timeline';
import { RunTabs } from './components/run-tabs';
import { TimelineSkeleton } from '../../../components/skeleton';
import { supabase } from '../../../lib/supabase';
import type { RunRecord } from '@gametok/schemas';

export default function RunDetailPage() {
  const params = useParams();
  const runId = params.id as string;
  
  const [run, setRun] = useState<(RunRecord & { metrics?: { progress?: number; playRate?: number; likability?: number } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchRun() {
      console.log('🔍 RunDetailPage: Loading run with ID:', runId);
      console.log('🔍 RunDetailPage: Timestamp:', new Date().toISOString());
      
      try {
        // Try direct database query first for this specific run
        console.log('🎯 RunDetailPage: Trying direct database query...');
        
        const { data: directRun, error: directError } = await supabase
          .from('orchestrator_runs')
          .select(`
            *,
            blockers:orchestrator_manual_tasks(*)
          `)
          .eq('id', runId)
          .single();

        if (directError) {
          console.error('❌ RunDetailPage: Direct query error:', directError);
        } else if (directRun) {
          console.log('✅ RunDetailPage: Found run via direct query:', directRun.brief?.theme);
          
          // Transform the direct result
          const transformedRun = {
            id: directRun.id,
            status: directRun.status,
            phase: directRun.phase,
            createdAt: directRun.created_at,
            updatedAt: directRun.updated_at,
            brief: directRun.brief,
            blockers: (directRun.blockers || []).map((task: any) => ({
              id: task.id,
              runId: task.run_id,
              phase: task.phase,
              type: task.task_type,
              title: task.title,
              description: task.description,
              createdAt: task.created_at,
              dueAt: task.due_at,
              completedAt: task.completed_at,
              assignee: task.assignee
            })),
            metrics: {
              progress: Math.random() * 0.8 + 0.1,
              playRate: Math.random() * 0.6 + 0.2,
              likability: Math.random() * 0.8 + 0.1
            }
          };
          
          console.log('✅ RunDetailPage: Setting direct run data:', transformedRun);
          setRun(transformedRun);
          setLoading(false);
          return;
        }
        
        // Fallback to loadRuns if direct query fails
        console.log('🔄 RunDetailPage: Falling back to loadRuns...');
        const runs = withMetrics(await loadRuns());
        console.log('🔍 RunDetailPage: Total runs loaded:', runs.length);
        console.log('🔍 RunDetailPage: Available run IDs:', runs.map(r => r.id));
        
        const foundRun = runs.find((r) => r.id === runId);
        console.log('🔍 RunDetailPage: Found run via loadRuns:', !!foundRun);

        if (!foundRun) {
          console.error('❌ RunDetailPage: Run not found for ID:', runId);
          console.log('📋 Available runs:', runs.map(r => ({ id: r.id, theme: r.brief.theme })));
          setNotFound(true);
        } else {
          console.log('✅ RunDetailPage: Setting run data:', foundRun.brief.theme);
          setRun(foundRun);
        }
      } catch (error) {
        console.error('❌ RunDetailPage: Error loading runs:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRun();
  }, [runId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-[350px,1fr]">
          <TimelineSkeleton />
          <div className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-slate-700 rounded w-1/3"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
              <div className="h-32 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (notFound || !run) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="text-center py-12">
          <h1 className="text-2xl font-semibold text-white mb-4">Run Not Found</h1>
          <p className="text-slate-400 mb-6">The requested run could not be found.</p>
          <a
            href="/"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </main>
    );
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

