'use client';

import type { RunRecord } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { 
  FileText, 
  Activity, 
  CheckSquare, 
  Download,
  ExternalLink,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';
import { PHASES } from '../components/run-timeline';
import { cn } from '../../../../lib/utils';
import { advanceRun, completeTask } from '../../../../lib/data-source';

interface RunTabsProps {
  run: RunRecord & {
    metrics?: {
      progress?: number;
      playRate?: number;
      likability?: number;
    };
  };
  onRunUpdate?: () => void;
}

type TabKey = 'summary' | 'artifacts' | 'activity' | 'tasks';

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'summary', label: 'Summary', icon: FileText },
  { key: 'artifacts', label: 'Artifacts', icon: Download },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
];

export function RunTabs({ run, onRunUpdate }: RunTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur">
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800/50">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative",
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-slate-400 hover:text-slate-300"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.key === 'tasks' && run.blockers.length > 0 && (
              <span className="bg-warning text-black text-xs px-2 py-0.5 rounded-full">
                {run.blockers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'summary' && <SummaryTab run={run} onRunUpdate={onRunUpdate} />}
          {activeTab === 'artifacts' && <ArtifactsTab run={run} />}
          {activeTab === 'activity' && <ActivityTab run={run} />}
          {activeTab === 'tasks' && <TasksTab run={run} onRunUpdate={onRunUpdate} />}
        </motion.div>
      </div>
    </div>
  );
}

function SummaryTab({ run, onRunUpdate }: { run: RunRecord; onRunUpdate?: () => void }) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const isAwaitingHuman = run.status === 'awaiting_human';
  const isRunning = run.status === 'running';
  
  const handleAdvanceRun = async () => {
    console.log('🚀 SummaryTab: Advancing run:', run.id);
    setIsAdvancing(true);
    try {
      await advanceRun(run.id);
      console.log('✅ SummaryTab: Run advanced successfully');
      onRunUpdate?.();
    } catch (error) {
      console.error('❌ SummaryTab: Failed to advance run:', error);
    } finally {
      setIsAdvancing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {isAwaitingHuman && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-warning/40 bg-warning/10 flex items-center gap-3"
        >
          <div className="h-8 w-8 rounded-full bg-warning/20 flex items-center justify-center">
            <User className="h-4 w-4 text-warning" />
          </div>
          <div>
            <h4 className="font-medium text-warning">Human Approval Required</h4>
            <p className="text-sm text-slate-300">This run is paused pending manual review</p>
          </div>
          <button 
            onClick={handleAdvanceRun}
            disabled={isAdvancing}
            className="ml-auto px-4 py-2 bg-warning text-black rounded-lg font-medium hover:bg-warning/90 transition-colors disabled:opacity-50"
          >
            {isAdvancing ? 'Advancing...' : 'Review Now'}
          </button>
        </motion.div>
      )}
      
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-primary/40 bg-primary/10 flex items-center gap-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full" />
          </motion.div>
          <div>
            <h4 className="font-medium text-primary">Run In Progress</h4>
            <p className="text-sm text-slate-300">Agents are actively working on {run.phase} phase</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm font-medium text-white">
              {Math.round(((PHASES.findIndex(p => p.key === run.phase) + 1) / PHASES.length) * 100)}%
            </div>
            <div className="text-xs text-slate-400">Complete</div>
          </div>
        </motion.div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Run Overview</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard label="Industry" value={run.brief.industry} />
          <InfoCard label="Target Audience" value={run.brief.targetAudience || 'General'} />
          <InfoCard label="Theme" value={run.brief.theme} />
          <InfoCard label="Current Phase" value={run.phase.replace('_', ' ')} />
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-white mb-3">Goal</h4>
        <p className="text-slate-300 leading-relaxed bg-slate-900/30 p-4 rounded-2xl border border-slate-800/30">
          {run.brief.goal}
        </p>
      </div>

      {/* Current Phase Details */}
      <div>
        <h4 className="text-md font-medium text-white mb-3">Current Phase: {run.phase}</h4>
        <div className="p-4 rounded-2xl border border-slate-800/30 bg-slate-900/30">
          <p className="text-sm text-slate-300">
            {getPhaseDescription(run.phase)}
          </p>
          {isRunning && (
            <div className="mt-3 flex items-center gap-2 text-xs text-primary">
              <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
              Estimated completion: {getEstimatedCompletion(run.phase)}
            </div>
          )}
        </div>
      </div>

      {run.brief.constraints && (
        <div>
          <h4 className="text-md font-medium text-white mb-3">Constraints</h4>
          <div className="grid gap-3 md:grid-cols-3">
            {run.brief.constraints.maxTokens && (
              <InfoCard label="Max Tokens" value={run.brief.constraints.maxTokens.toLocaleString()} />
            )}
            {run.brief.constraints.budgetUsd && (
              <InfoCard label="Budget" value={`$${run.brief.constraints.budgetUsd}`} />
            )}
            {run.brief.constraints.timeboxHours && (
              <InfoCard label="Timebox" value={`${run.brief.constraints.timeboxHours}h`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getPhaseDescription(phase: string): string {
  const descriptions = {
    'intake': 'Processing initial requirements and setting up the run',
    'market': 'Scanning market trends and identifying opportunities',
    'synthesis': 'Analyzing collected data and generating insights',
    'deconstruct': 'Breaking down successful game mechanics and patterns',
    'prioritize': 'Ranking opportunities and selecting best candidates',
    'build': 'Generating game prototypes and assets',
    'qa': 'Testing game functionality and performance',
    'deploy': 'Uploading games to the distribution platform',
    'measure': 'Collecting performance metrics and user feedback',
    'decision': 'Evaluating results and planning next iteration'
  };
  return descriptions[phase as keyof typeof descriptions] || 'Processing...';
}

function getEstimatedCompletion(phase: string): string {
  const estimates = {
    'intake': '2-5 minutes',
    'market': '10-15 minutes',
    'synthesis': '5-10 minutes',
    'deconstruct': '15-20 minutes',
    'prioritize': '5-8 minutes',
    'build': '30-45 minutes',
    'qa': '10-15 minutes',
    'deploy': '5-10 minutes',
    'measure': '2-4 hours',
    'decision': '5-10 minutes'
  };
  return estimates[phase as keyof typeof estimates] || 'Unknown';
}

function ArtifactsTab({ run }: { run: RunRecord }) {
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  
  // Mock artifacts with content for now
  const artifacts = [
    { 
      id: '1', 
      name: 'market_scan.json', 
      phase: 'market', 
      size: '24.5 KB', 
      createdAt: run.createdAt,
      type: 'json',
      content: JSON.stringify({
        trends: ['hypercasual', 'merge', 'idle'],
        topGames: ['Subway Surfers', 'Candy Crush', 'Among Us'],
        insights: 'Market shows strong preference for quick-session games'
      }, null, 2)
    },
    { 
      id: '2', 
      name: 'theme_analysis.md', 
      phase: 'synthesis', 
      size: '12.1 KB', 
      createdAt: run.createdAt,
      type: 'markdown',
      content: `# Theme Analysis: ${run.brief.theme}\n\n## Key Insights\n\n- **Visual Style**: Modern, minimalist design\n- **Core Mechanics**: Simple tap/swipe interactions\n- **Target Audience**: ${run.brief.targetAudience || 'Casual gamers'}\n\n## Recommendations\n\n1. Focus on immediate feedback loops\n2. Implement progressive difficulty\n3. Add social sharing features\n\n---\n\n*Generated by ThemeSynthesisAgent*`
    },
    { 
      id: '3', 
      name: 'build_brief.md', 
      phase: 'build', 
      size: '8.7 KB', 
      createdAt: run.createdAt,
      type: 'markdown',
      content: `# Build Brief: ${run.brief.theme}\n\n## Technical Requirements\n\n- **Engine**: Phaser 3.70+\n- **Resolution**: 720x1280 (mobile portrait)\n- **File Size**: <2MB total\n- **Performance**: 60fps target, 30fps minimum\n\n## Game Loop\n\n1. Player spawns in center\n2. Obstacles approach from edges\n3. Tap/swipe to avoid\n4. Score increases with survival time\n\n## Success Metrics\n\n- Session length: 60-180 seconds\n- Replay rate: >40%\n- Share rate: >5%`
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Artifacts</h3>
        <span className="text-sm text-slate-400">{artifacts.length} files</span>
      </div>
      
      <div className="grid gap-4">
        {artifacts.map((artifact) => (
          <div key={artifact.id}>
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-800/50 bg-slate-900/40 hover:bg-slate-900/60 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-white">{artifact.name}</h4>
                  <p className="text-sm text-slate-400">{artifact.phase} • {artifact.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedArtifact(selectedArtifact === artifact.id ? null : artifact.id)}
                  className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Artifact Preview */}
            {selectedArtifact === artifact.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 rounded-2xl border border-slate-800/30 bg-slate-950/50 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Preview</span>
                    <span className="text-xs text-slate-500">{artifact.type}</span>
                  </div>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto bg-slate-900/50 p-4 rounded-xl border border-slate-800/30 max-h-64 overflow-y-auto">
                    {artifact.content}
                  </pre>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTab({ run }: { run: RunRecord }) {
  // Mock activity for now
  const activities = [
    { id: '1', type: 'phase_change', message: `Advanced to ${run.phase} phase`, timestamp: run.updatedAt },
    { id: '2', type: 'task_created', message: 'Created manual approval task', timestamp: run.createdAt },
    { id: '3', type: 'run_created', message: 'Run initialized', timestamp: run.createdAt },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Activity Log</h3>
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/30"
          >
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="flex-1">
              <p className="text-sm text-white">{activity.message}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {timeAgo(activity.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TasksTab({ run, onRunUpdate }: { run: RunRecord; onRunUpdate?: () => void }) {
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  
  const handleCompleteTask = async (taskId: string) => {
    console.log('🎯 TasksTab: Completing task:', taskId);
    setCompletingTasks(prev => new Set(prev).add(taskId));
    try {
      await completeTask(taskId);
      console.log('✅ TasksTab: Task completed successfully');
      onRunUpdate?.();
    } catch (error) {
      console.error('❌ TasksTab: Failed to complete task:', error);
    } finally {
      setCompletingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Manual Tasks</h3>
      {run.blockers.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <p className="text-slate-400">No pending tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {run.blockers.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl border border-warning/40 bg-warning/10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <p className="text-sm text-slate-300 mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-warning">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {task.assignee || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(task.createdAt)}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => handleCompleteTask(task.id)}
                  disabled={completingTasks.has(task.id)}
                  className="px-4 py-2 bg-warning text-black rounded-lg font-medium hover:bg-warning/90 transition-colors disabled:opacity-50"
                >
                  {completingTasks.has(task.id) ? 'Resolving...' : 'Resolve'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-2xl border border-slate-800/50 bg-slate-900/40">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="text-sm font-medium text-white mt-1">{value}</p>
    </div>
  );
}

function timeAgo(dateIso: string) {
  const delta = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.round(delta / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}
