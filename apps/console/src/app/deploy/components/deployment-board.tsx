'use client';

import type { RunRecord } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  Upload, 
  Loader, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Play
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DeploymentBoardProps {
  deployments: Array<RunRecord & {
    hasPrototype?: boolean;
    prototypeData?: unknown;
    deploymentStatus: 'to_upload' | 'uploading' | 'live';
    gameVariants: Array<{
      id: string;
      orientation: 'portrait' | 'landscape';
      buildSize: number;
      thumbnailUrl: string;
      uploadProgress: number;
    }>;
    metadata: {
      clipcadeId: string | null;
      uploadedAt: string | null;
    };
  }>;
}

type ColumnKey = 'to_upload' | 'uploading' | 'live';

const COLUMNS: Array<{
  key: ColumnKey;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = [
  {
    key: 'to_upload',
    title: 'To Upload',
    description: 'Ready for deployment',
    icon: Upload,
    color: 'border-warning/30 bg-warning/5'
  },
  {
    key: 'uploading',
    title: 'Uploading',
    description: 'In progress',
    icon: Loader,
    color: 'border-primary/30 bg-primary/5'
  },
  {
    key: 'live',
    title: 'Live',
    description: 'Deployed to feed',
    icon: CheckCircle,
    color: 'border-success/30 bg-success/5'
  }
];

export function DeploymentBoard({ deployments }: DeploymentBoardProps) {
  const [playingGame, setPlayingGame] = useState<string | null>(null);
  const [uploadingGames, setUploadingGames] = useState<Set<string>>(new Set());
  const groupedDeployments = COLUMNS.reduce((acc, column) => {
    acc[column.key] = deployments.filter(d => d.deploymentStatus === column.key);
    return acc;
  }, {} as Record<ColumnKey, typeof deployments>);

  const handleUploadToClipcade = async (runId: string) => {
    setUploadingGames(prev => new Set([...prev, runId]));
    
    try {
      console.log(`🎮 Uploading game ${runId} to Clipcade...`);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs/${runId}/upload-to-clipcade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Game uploaded successfully:', result.game_id);
        alert(`Game uploaded to Clipcade successfully! Game ID: ${result.game_id}\nStatus: ${result.status}`);
        // Refresh the page to update the deployment status
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.error('❌ Upload failed:', result.error);
        alert(`Failed to upload game: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert(`Error uploading game: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploadingGames(prev => {
        const newSet = new Set(prev);
        newSet.delete(runId);
        return newSet;
      });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {COLUMNS.map((column, columnIndex) => (
        <div
          key={column.key}
          className={cn(
            "rounded-3xl border backdrop-blur p-6 min-h-[400px]",
            column.color
          )}
        >
          <header className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-slate-900/50">
              <column.icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">{column.title}</h2>
              <p className="text-sm text-slate-400">{column.description}</p>
            </div>
            <span className="ml-auto text-sm font-medium text-slate-300">
              {groupedDeployments[column.key].length}
            </span>
          </header>

          <div className="space-y-4">
            {groupedDeployments[column.key].map((deployment, index) => (
              <motion.div
                key={deployment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (columnIndex * 0.1) + (index * 0.05), duration: 0.3 }}
              >
                <DeploymentCard 
                  deployment={deployment} 
                  onPlayGame={setPlayingGame} 
                  onUploadToClipcade={handleUploadToClipcade}
                  isUploading={uploadingGames.has(deployment.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {playingGame && (
        <GamePlayerModal 
          deployment={deployments.find(d => d.id === playingGame)!} 
          onClose={() => setPlayingGame(null)} 
        />
      )}
    </div>
  );
}

function DeploymentCard({ 
  deployment,
  onPlayGame,
  onUploadToClipcade,
  isUploading
}: { 
  deployment: DeploymentBoardProps['deployments'][0];
  onPlayGame: (id: string) => void;
  onUploadToClipcade: (id: string) => void;
  isUploading: boolean;
}) {
  const variant = deployment.gameVariants[0];
  const prototypeData = deployment.prototypeData as { data?: string; size?: number } | undefined;
  const prototypeSize = prototypeData?.size ? Math.round(prototypeData.size / 1024) : 0;
  
  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 hover:bg-slate-900/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-16 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 relative">
          <Play className="h-6 w-6 text-white" />
          {deployment.hasPrototype && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border border-slate-900"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{deployment.brief.theme}</h3>
          <p className="text-sm text-slate-400">{deployment.brief.industry}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>Portrait</span>
            <span>{variant?.buildSize || prototypeSize}KB</span>
            {deployment.metadata.clipcadeId && (
              <span className="text-success">ID: {deployment.metadata.clipcadeId}</span>
            )}
          </div>

          {deployment.deploymentStatus === 'uploading' && variant && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-400">Upload Progress</span>
                <span className="text-white">{variant.uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${variant.uploadProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-primary h-1.5 rounded-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        {deployment.hasPrototype && (
          <button 
            onClick={() => onPlayGame(deployment.id)}
            className="px-3 py-2 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors flex items-center gap-1"
          >
            <Play className="h-3 w-3" />
            Test
          </button>
        )}
        
        {deployment.deploymentStatus === 'to_upload' && (
          <button 
            onClick={() => onUploadToClipcade(deployment.id)}
            disabled={isUploading}
            className="flex-1 px-3 py-2 bg-warning text-black rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isUploading && <Loader className="h-3 w-3 animate-spin" />}
            {isUploading ? 'Uploading...' : 'Upload to Clipcade'}
          </button>
        )}
        
        {deployment.metadata.clipcadeId && (
          <button 
            className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors"
            onClick={() => navigator.clipboard.writeText(deployment.metadata.clipcadeId!)}
          >
            <Copy className="h-4 w-4" />
          </button>
        )}
        
        <button 
          className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors"
          onClick={() => window.open(`/runs/${deployment.id}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function GamePlayerModal({ 
  deployment, 
  onClose 
}: { 
  deployment: DeploymentBoardProps['deployments'][0]; 
  onClose: () => void; 
}) {
  const prototypeHTML = (deployment.prototypeData as { data?: string })?.data || '';
  
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
            <p className="text-sm text-slate-400 mt-1">{deployment.brief.theme}</p>
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
              title={`${deployment.brief.theme} Game`}
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
