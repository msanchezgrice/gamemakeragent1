'use client';

import type { RunRecord } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Loader, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Image
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DeploymentBoardProps {
  deployments: Array<RunRecord & {
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
  const groupedDeployments = COLUMNS.reduce((acc, column) => {
    acc[column.key] = deployments.filter(d => d.deploymentStatus === column.key);
    return acc;
  }, {} as Record<ColumnKey, typeof deployments>);

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
                <DeploymentCard deployment={deployment} />
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DeploymentCard({ 
  deployment 
}: { 
  deployment: DeploymentBoardProps['deployments'][0] 
}) {
  const variant = deployment.gameVariants[0];
  
  return (
    <div className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4 hover:bg-slate-900/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className="h-16 w-12 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Image className="h-6 w-6 text-slate-400" aria-label="Game thumbnail placeholder" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{deployment.brief.theme}</h3>
          <p className="text-sm text-slate-400">{deployment.brief.industry}</p>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span>{variant.orientation}</span>
            <span>{variant.buildSize}KB</span>
            {deployment.metadata.clipcadeId && (
              <span className="text-success">ID: {deployment.metadata.clipcadeId}</span>
            )}
          </div>

          {deployment.deploymentStatus === 'uploading' && (
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
        {deployment.deploymentStatus === 'to_upload' && (
          <button className="flex-1 px-3 py-2 bg-warning text-black rounded-lg text-sm font-medium hover:bg-warning/90 transition-colors">
            Upload to Clipcade
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
        
        <button className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors">
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
