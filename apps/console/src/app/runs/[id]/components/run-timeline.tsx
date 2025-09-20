'use client';

import type { RunRecord, RunPhase } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { 
  Search, 
  Lightbulb, 
  Layers, 
  Target, 
  Hammer, 
  TestTube, 
  Rocket, 
  BarChart, 
  CheckCircle,
  Circle,
  Clock
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface RunTimelineProps {
  run: RunRecord & {
    metrics?: {
      progress?: number;
      playRate?: number;
      likability?: number;
    };
  };
  selectedStage?: RunPhase;
  onStageSelect?: (stage: RunPhase) => void;
}

export const PHASES: Array<{
  key: RunPhase;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'intake', label: 'Intake', description: 'Initial brief and constraints', icon: Circle },
  { key: 'market', label: 'Market Scan', description: 'Research trends and opportunities', icon: Search },
  { key: 'synthesis', label: 'Synthesis', description: 'Analyze market signals', icon: Lightbulb },
  { key: 'deconstruct', label: 'Deconstruct', description: 'Break down winning concepts', icon: Layers },
  { key: 'prioritize', label: 'Prioritize', description: 'Select best opportunities', icon: Target },
  { key: 'build', label: 'Build', description: 'Generate game prototypes', icon: Hammer },
  { key: 'qa', label: 'QA', description: 'Quality assurance testing', icon: TestTube },
  { key: 'deploy', label: 'Deploy', description: 'Upload to game feed', icon: Rocket },
  { key: 'measure', label: 'Measure', description: 'Collect performance data', icon: BarChart },
  { key: 'decision', label: 'Decision', description: 'Evaluate and decide next steps', icon: CheckCircle },
];

export function RunTimeline({ run, selectedStage, onStageSelect }: RunTimelineProps) {
  const currentPhaseIndex = PHASES.findIndex(p => p.key === run.phase);
  
  // If run is awaiting human review, we've completed the current phase work
  // and are waiting for approval to continue
  const effectiveCurrentIndex = run.status === 'awaiting_human' ? currentPhaseIndex : currentPhaseIndex;
  
  return (
    <div className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
      <header className="mb-6">
        <h2 className="text-lg font-semibold text-white">Timeline</h2>
        <p className="text-sm text-slate-400">Phase progression and status</p>
      </header>

      <div className="space-y-4">
        {PHASES.map((phase, index) => {
          const isCompleted = index < effectiveCurrentIndex || 
                             (index === effectiveCurrentIndex && run.status === 'awaiting_human');
          const isCurrent = index === effectiveCurrentIndex && run.status !== 'awaiting_human';
          const isPending = index > effectiveCurrentIndex;
          
          return (
            <motion.div
              key={phase.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={cn(
                "relative flex items-center gap-4 cursor-pointer rounded-lg p-2 -m-2 transition-colors",
                selectedStage === phase.key && "bg-primary/10 border border-primary/30",
                "hover:bg-slate-800/50"
              )}
              onClick={() => onStageSelect?.(phase.key)}
            >
              {/* Timeline connector */}
              {index < PHASES.length - 1 && (
                <div 
                  className={cn(
                    "absolute left-6 top-12 w-0.5 h-8 transition-colors duration-500",
                    isCompleted ? "bg-primary" : "bg-slate-700"
                  )}
                />
              )}
              
              {/* Phase icon */}
              <div className={cn(
                "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300",
                isCompleted && "bg-primary border-primary text-white",
                isCurrent && "bg-warning border-warning text-black",
                isPending && "bg-slate-800 border-slate-700 text-slate-500"
              )}>
                {isCurrent && run.status === 'running' ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full"
                  />
                ) : (
                  <phase.icon className="h-5 w-5" />
                )}
                
                {/* Pulse animation for current phase */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-warning"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
              
              {/* Phase content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={cn(
                    "font-medium transition-colors",
                    isCompleted && "text-white",
                    isCurrent && "text-warning",
                    isPending && "text-slate-500"
                  )}>
                    {phase.label}
                  </h3>
                  {isCurrent && (
                    <div className="flex items-center gap-1 text-xs text-warning">
                      <Clock className="h-3 w-3" />
                      In progress
                    </div>
                  )}
                </div>
                <p className={cn(
                  "text-sm mt-1 transition-colors",
                  isCompleted && "text-slate-300",
                  isCurrent && "text-slate-300",
                  isPending && "text-slate-500"
                )}>
                  {phase.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Progress indicator */}
      <div className="mt-6 pt-6 border-t border-slate-800/50">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-400">Overall Progress</span>
          <span className="text-white font-medium">
            {Math.round(((currentPhaseIndex + 1) / PHASES.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((currentPhaseIndex + 1) / PHASES.length) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gradient-to-r from-primary to-accent h-2 rounded-full"
          />
        </div>
      </div>
    </div>
  );
}
