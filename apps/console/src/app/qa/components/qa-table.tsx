'use client';

import type { RunRecord } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  CheckCircle, 
  Play,
  ExternalLink,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface QATableProps {
  runs: Array<RunRecord & {
    qaMetrics: {
      ttfi: number;
      fps: number;
      errorCount: number;
      loadTime: number;
      memoryUsage: number;
      crashRate: number;
    };
  }>;
}

export function QATable({ runs }: QATableProps) {
  const [selectedRun, setSelectedRun] = useState<string | null>(null);

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur overflow-hidden">
      <header className="p-6 border-b border-slate-800/50">
        <h2 className="text-lg font-semibold text-white">QA Test Results</h2>
        <p className="text-sm text-slate-400 mt-1">Autoplayer performance metrics and manual verification status</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 sticky top-0">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Game</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">TTFI</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">FPS</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Errors</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Memory</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Crash Rate</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Status</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, index) => (
              <motion.tr
                key={run.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "border-b border-slate-800/30 hover:bg-slate-900/30 transition-colors",
                  selectedRun === run.id && "bg-primary/5"
                )}
                onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
              >
                <td className="p-4">
                  <div>
                    <h4 className="font-medium text-white">{run.brief.theme}</h4>
                    <p className="text-sm text-slate-400">{run.brief.industry}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-medium",
                      run.qaMetrics.ttfi < 2000 ? "text-success" : 
                      run.qaMetrics.ttfi < 3000 ? "text-warning" : "text-red-400"
                    )}>
                      {Math.round(run.qaMetrics.ttfi)}ms
                    </span>
                    {run.qaMetrics.ttfi < 2000 ? (
                      <TrendingUp className="h-3 w-3 text-success" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-400" />
                    )}
                  </div>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "text-sm font-medium",
                    run.qaMetrics.fps > 50 ? "text-success" : 
                    run.qaMetrics.fps > 30 ? "text-warning" : "text-red-400"
                  )}>
                    {Math.round(run.qaMetrics.fps)}
                  </span>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "text-sm font-medium",
                    run.qaMetrics.errorCount === 0 ? "text-success" : 
                    run.qaMetrics.errorCount < 3 ? "text-warning" : "text-red-400"
                  )}>
                    {run.qaMetrics.errorCount}
                  </span>
                </td>
                <td className="p-4">
                  <span className="text-sm text-slate-300">
                    {Math.round(run.qaMetrics.memoryUsage)}MB
                  </span>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "text-sm font-medium",
                    run.qaMetrics.crashRate < 0.01 ? "text-success" : 
                    run.qaMetrics.crashRate < 0.03 ? "text-warning" : "text-red-400"
                  )}>
                    {(run.qaMetrics.crashRate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    run.status === 'awaiting_human' 
                      ? "bg-warning/20 text-warning" 
                      : "bg-primary/20 text-primary"
                  )}>
                    {run.status === 'awaiting_human' ? 'Needs Review' : 'Testing'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors">
                      <Play className="h-4 w-4" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    {run.status === 'awaiting_human' && (
                      <button className="px-3 py-1 bg-success text-black rounded-lg text-xs font-medium hover:bg-success/90 transition-colors">
                        Approve
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRun && (
        <QADetailModal 
          run={runs.find(r => r.id === selectedRun)!} 
          onClose={() => setSelectedRun(null)} 
        />
      )}
    </div>
  );
}

function QADetailModal({ 
  run, 
  onClose 
}: { 
  run: QATableProps['runs'][0]; 
  onClose: () => void; 
}) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  
  const checklistItems = [
    { id: 'gameplay', label: 'Core gameplay functions correctly' },
    { id: 'controls', label: 'Touch controls are responsive' },
    { id: 'performance', label: 'Maintains 30+ FPS throughout' },
    { id: 'audio', label: 'Audio plays without issues' },
    { id: 'completion', label: 'Game can be completed successfully' },
    { id: 'telemetry', label: 'Analytics events fire correctly' },
  ];

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const allChecked = checklistItems.every(item => checkedItems.has(item.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-slate-800 rounded-3xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6">
          <h3 className="text-lg font-semibold text-white">Manual QA Checklist</h3>
          <p className="text-sm text-slate-400 mt-1">{run.brief.theme}</p>
        </header>

        <div className="space-y-3 mb-6">
          {checklistItems.map((item) => (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-900/30 transition-colors cursor-pointer"
              onClick={() => toggleCheck(item.id)}
            >
              <div className={cn(
                "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                checkedItems.has(item.id) 
                  ? "bg-success border-success" 
                  : "border-slate-600 hover:border-slate-500"
              )}>
                {checkedItems.has(item.id) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <CheckCircle className="h-3 w-3 text-black" />
                  </motion.div>
                )}
              </div>
              <span className={cn(
                "text-sm transition-colors",
                checkedItems.has(item.id) ? "text-white" : "text-slate-300"
              )}>
                {item.label}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!allChecked}
            className={cn(
              "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
              allChecked 
                ? "bg-success text-black hover:bg-success/90" 
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            )}
          >
            {allChecked ? "Confirm QA" : `${checkedItems.size}/${checklistItems.length} checked`}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
