'use client';

import type { RunRecord } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
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
  const [artifacts, setArtifacts] = useState<Array<{
    id: string;
    name: string;
    phase: string;
    size: string;
    createdAt: string;
    type: string;
    content: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtifacts() {
      try {
        // Fetch real artifacts from Supabase
        const { data: dbArtifacts, error } = await supabase
          .from('orchestrator_artifacts')
          .select('*')
          .eq('run_id', run.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Failed to load artifacts:', error);
        }

        console.log('🎨 ArtifactsTab: Raw DB artifacts:', dbArtifacts);
        console.log('🎨 ArtifactsTab: Run ID:', run.id);

        const realArtifacts = (dbArtifacts || []).map(artifact => ({
          id: artifact.id,
          name: artifact.meta?.filename || `${artifact.kind}.${artifact.meta?.contentType?.includes('json') ? 'json' : 'md'}`,
          phase: artifact.phase,
          size: artifact.meta?.size ? `${Math.round(artifact.meta.size / 1024 * 10) / 10} KB` : 'Unknown',
          createdAt: artifact.created_at,
          type: artifact.meta?.contentType?.includes('json') ? 'json' : 'markdown',
          content: artifact.meta?.contentType?.includes('json') 
            ? JSON.stringify(artifact.meta?.data, null, 2)
            : artifact.meta?.data || 'Content not available'
        }));

        setArtifacts(realArtifacts);
      } catch (error) {
        console.error('Failed to fetch artifacts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchArtifacts();
  }, [run.id, run.brief.targetAudience, run.brief.theme, run.createdAt]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Artifacts</h3>
          <div className="animate-pulse h-4 w-16 bg-slate-700 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse h-16 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

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
  // Enhanced activity with agent thinking traces
  const activities = [
    { 
      id: '1', 
      type: 'agent_thinking', 
      agent: 'deconstruct-agent',
      message: `Analyzing successful ${run.brief.industry} games for ${run.brief.theme} patterns`, 
      timestamp: new Date(Date.now() - 60000).toISOString(),
      thinking: `Examining top-performing games in ${run.brief.industry} space. Key patterns identified: 1) Progressive difficulty scaling, 2) Clear visual feedback, 3) Immediate reward loops. Focusing on ${run.brief.theme} theme integration.`,
      status: 'in_progress'
    },
    { 
      id: '2', 
      type: 'phase_change', 
      message: `Advanced to ${run.phase} phase`, 
      timestamp: run.updatedAt,
      details: `Completed previous phase work, now processing ${run.phase} requirements`
    },
    { 
      id: '3', 
      type: 'artifact_generated', 
      message: 'Generated market analysis artifact', 
      timestamp: new Date(Date.now() - 300000).toISOString(),
      details: 'Market scan completed with 85% confidence. Found 3 direct competitors and identified market gap.'
    },
    { 
      id: '4', 
      type: 'agent_thinking', 
      agent: 'synthesis-agent',
      message: `Synthesizing insights for ${run.brief.theme} concept`, 
      timestamp: new Date(Date.now() - 600000).toISOString(),
      thinking: `Combining market data with theme requirements. ${run.brief.theme} shows strong potential in ${run.brief.industry} vertical. Confidence level: 0.85. Recommending focus on ${run.brief.targetAudience} demographic.`,
      status: 'completed'
    },
    { 
      id: '5', 
      type: 'task_created', 
      message: 'Created manual approval task', 
      timestamp: run.createdAt,
      details: 'Human review required for market analysis results'
    },
    { 
      id: '6', 
      type: 'run_created', 
      message: 'Run initialized', 
      timestamp: run.createdAt,
      details: `Started ${run.brief.theme} development pipeline`
    },
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
            className={`p-4 rounded-xl border ${
              activity.type === 'agent_thinking' 
                ? 'border-primary/40 bg-primary/5' 
                : activity.type === 'artifact_generated'
                ? 'border-success/40 bg-success/5'
                : 'border-slate-800/30'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`h-3 w-3 rounded-full mt-1 ${
                activity.type === 'agent_thinking' 
                  ? activity.status === 'in_progress' 
                    ? 'bg-primary animate-pulse' 
                    : 'bg-primary'
                  : activity.type === 'artifact_generated'
                  ? 'bg-success'
                  : 'bg-slate-400'
              }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">{activity.message}</p>
                  {activity.agent && (
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                      {activity.agent}
                    </span>
                  )}
                  {activity.status === 'in_progress' && (
                    <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded-full animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                
                {activity.thinking && (
                  <div className="mt-2 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                    <p className="text-xs text-slate-300 leading-relaxed">{activity.thinking}</p>
                  </div>
                )}
                
                {activity.details && !activity.thinking && (
                  <p className="text-xs text-slate-400 mt-1">{activity.details}</p>
                )}
                
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-2">
                  <Clock className="h-3 w-3" />
                  {timeAgo(activity.timestamp)}
                </p>
              </div>
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
