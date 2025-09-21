'use client';

import { useEffect, useState } from 'react';
import { loadRuns } from '../../lib/data-source';
import { DeploymentBoard } from './components/deployment-board';
import { DeploymentBoardSkeleton } from '../../components/skeleton';
import type { RunRecord } from '@gametok/schemas';

export default function DeployPage() {
  const [runs, setRuns] = useState<Array<RunRecord & { 
    hasPrototype?: boolean;
    prototypeData?: unknown;
    metrics?: { progress?: number; playRate?: number; likability?: number } 
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRuns() {
      try {
        const fetchedRuns = await loadRuns();
        setRuns(fetchedRuns);
      } catch (error) {
        console.error('❌ Deploy Page: Failed to load runs:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRuns();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-12">
        <DeploymentBoardSkeleton />
      </main>
    );
  }

  // Only show runs that have completed prototypes and are ready for deployment
  const deployRuns = runs.filter((run) => 
    run.hasPrototype && // Must have a prototype
    (
      // Either currently in deploy/measure phase
      (run.phase === 'deploy' || run.phase === 'measure') ||
      // Or has completed the entire pipeline
      run.status === 'done'
    ) &&
    run.status !== 'queued' // Don't show queued runs
  );
  
  // Only show real deployment data for games that have completed build and QA
  const deployments = deployRuns.length > 0 ? deployRuns.map((run) => ({
    ...run,
    // For now, all completed prototypes start as "to_upload" since we haven't implemented actual deployment
    deploymentStatus: (run.phase === 'measure' ? 'uploading' : 'to_upload') as 'to_upload' | 'uploading' | 'live',
    gameVariants: [], // Will be populated when actual games are built
    metadata: {
      clipcadeId: null, // Will be populated when actually deployed to GameTok/Clipcade feed
      uploadedAt: null
    }
  })) : [];

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
          <a href="/" className="hover:text-primary transition-colors">Console</a>
          <span>/</span>
          <span>Deployment</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white">Deployment Board</h1>
            <p className="text-slate-300 mt-2">
              Manage game uploads and track deployment status to Clipcade feed
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-full bg-primary/20 text-primary border border-primary/40 text-sm font-medium">
              {deployments.length} games ready
            </div>
          </div>
        </div>
      </header>

      <DeploymentBoard deployments={deployments} />
    </main>
  );
}
