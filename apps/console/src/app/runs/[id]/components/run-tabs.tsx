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
  CheckCircle,
  Settings,
  Layers
} from 'lucide-react';
import { PHASES } from '../components/run-timeline';
import { cn } from '../../../../lib/utils';
import { completeTask } from '../../../../lib/data-source';

interface RunTabsProps {
  run: RunRecord & {
    metrics?: {
      progress?: number;
      playRate?: number;
      likability?: number;
    };
  };
  onRunUpdate?: () => void;
  initialTab?: TabKey;
}

type TabKey = 'summary' | 'stage' | 'artifacts' | 'activity' | 'tasks' | 'controls';

const TABS: Array<{
  key: TabKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'summary', label: 'Summary', icon: FileText },
  { key: 'stage', label: 'Stage', icon: Layers },
  { key: 'artifacts', label: 'Artifacts', icon: Download },
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'tasks', label: 'Tasks', icon: CheckSquare },
  { key: 'controls', label: 'Controls', icon: Settings },
];

export function RunTabs({ run, onRunUpdate, initialTab = 'summary' }: RunTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur" data-tabs-container>
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-800/50">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            data-tab={tab.key}
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
                {activeTab === 'summary' && <SummaryTab run={run} onRunUpdate={onRunUpdate} setActiveTab={setActiveTab} />}
                {activeTab === 'stage' && <StageTab run={run} onRunUpdate={onRunUpdate} />}
                {activeTab === 'artifacts' && <ArtifactsTab run={run} />}
                {activeTab === 'activity' && <ActivityTab run={run} />}
                {activeTab === 'tasks' && <TasksTab run={run} onRunUpdate={onRunUpdate} />}
                {activeTab === 'controls' && <ControlsTab run={run} onRunUpdate={onRunUpdate} />}
        </motion.div>
      </div>
    </div>
  );
}

function SummaryTab({ run, setActiveTab }: { run: RunRecord; onRunUpdate?: () => void; setActiveTab?: (tab: TabKey) => void }) {
  const isAwaitingHuman = run.status === 'awaiting_human';
  const isRunning = run.status === 'running';
  
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
                onClick={() => setActiveTab?.('artifacts')}
                className="ml-auto px-4 py-2 bg-warning text-black rounded-lg font-medium hover:bg-warning/90 transition-colors"
              >
                Review Artifacts
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

function StageTab({ run, onRunUpdate }: { run: RunRecord; onRunUpdate?: () => void }) {
  const [stageData, setStageData] = useState<{
    artifacts: any[];
    inputs: any[];
    decisions: any[];
    context: any[];
  }>({
    artifacts: [],
    inputs: [],
    decisions: [],
    context: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStageData = async () => {
      console.log(`🎭 StageTab: Fetching stage data for ${run.phase} phase of run ${run.id}`);
      try {
        // Fetch artifacts via Edge Function API
        const artifactsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs/${run.id}/artifacts`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        let artifacts = [];
        if (artifactsResponse.ok) {
          artifacts = await artifactsResponse.json();
        } else {
          console.error('❌ StageTab: Failed to fetch artifacts:', artifactsResponse.status);
        }

        // Fetch logs for context (direct Supabase query for now)
        const { data: logs, error: logsError } = await supabase
          .from('orchestrator_logs')
          .select('*')
          .eq('run_id', run.id)
          .order('created_at', { ascending: false });

        if (logsError) {
          console.error('❌ StageTab: Failed to fetch logs:', logsError);
        }

        // Organize data by relevance to current stage
        const currentPhaseArtifacts = artifacts?.filter(a => a.phase === run.phase) || [];
        const previousPhaseArtifacts = artifacts?.filter(a => a.phase !== run.phase) || [];
        
        setStageData({
          artifacts: currentPhaseArtifacts,
          inputs: previousPhaseArtifacts,
          decisions: logs?.filter(l => l.level === 'info' && l.message.includes('completed')) || [],
          context: logs?.filter(l => l.thinking_trace) || []
        });

        console.log(`✅ StageTab: Loaded stage data - ${currentPhaseArtifacts.length} current artifacts, ${previousPhaseArtifacts.length} inputs, ${logs?.length || 0} logs`);
      } catch (error) {
        console.error('❌ StageTab: Error fetching stage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStageData();
  }, [run.id, run.phase]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">{run.phase.charAt(0).toUpperCase() + run.phase.slice(1)} Stage</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Loading stage content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          {run.phase.charAt(0).toUpperCase() + run.phase.slice(1)} Stage
        </h3>
        <span className="text-sm text-slate-400">
          Phase {PHASES.findIndex(p => p.key === run.phase) + 1} of {PHASES.length}
        </span>
      </div>

      {/* Current Phase Outputs */}
      {stageData.artifacts.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-white flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Current Phase Outputs ({stageData.artifacts.length})
          </h4>
          <div className="grid gap-3">
            {stageData.artifacts.map((artifact) => (
              <div key={artifact.id} className="p-4 rounded-2xl border border-primary/30 bg-primary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-white">
                      {artifact.meta?.filename || `${artifact.kind}.json`}
                    </h5>
                    <p className="text-sm text-slate-400">
                      {artifact.kind} • {artifact.meta?.size ? `${Math.round(artifact.meta.size / 1024 * 10) / 10} KB` : 'Unknown size'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                    {artifact.phase}
                  </span>
                </div>
                {artifact.meta?.data && (
                  <details className="mt-3">
                    <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                      Show content
                    </summary>
                    <pre className="text-xs text-slate-300 mt-2 bg-slate-900/50 p-3 rounded border border-slate-700/30 overflow-x-auto max-h-64 overflow-y-auto">
                      {typeof artifact.meta.data === 'string' ? artifact.meta.data : JSON.stringify(artifact.meta.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Previous Phase Inputs */}
      {stageData.inputs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            Previous Phase Inputs ({stageData.inputs.length})
          </h4>
          <div className="grid gap-3">
            {stageData.inputs.map((input) => (
              <div key={input.id} className="p-4 rounded-2xl border border-blue-400/30 bg-blue-400/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-white">
                      {input.meta?.filename || `${input.kind}.json`}
                    </h5>
                    <p className="text-sm text-slate-400">
                      From {input.phase} phase • {input.kind}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-400/20 text-blue-400 rounded-full">
                    Input
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Decisions & Context */}
      {stageData.context.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-green-400" />
            Agent Context ({stageData.context.length})
          </h4>
          <div className="grid gap-3">
            {stageData.context.slice(0, 3).map((context) => (
              <div key={context.id} className="p-4 rounded-2xl border border-green-400/30 bg-green-400/5">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-white">{context.message}</h5>
                  <span className="text-xs px-2 py-1 bg-green-400/20 text-green-400 rounded-full">
                    {context.agent}
                  </span>
                </div>
                {context.thinking_trace && (
                  <details>
                    <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                      Show thinking process
                    </summary>
                    <div className="text-xs text-slate-300 mt-2 bg-slate-900/50 p-3 rounded border border-slate-700/30 max-h-32 overflow-y-auto">
                      {context.thinking_trace}
                    </div>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stageData.artifacts.length === 0 && stageData.inputs.length === 0 && stageData.context.length === 0 && (
        <div className="text-center py-12">
          <Layers className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-400 mb-2">No Stage Content Yet</h4>
          <p className="text-slate-500">
            Content will appear here as the {run.phase} phase progresses.
          </p>
        </div>
      )}
    </div>
  );
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
        // Fetch artifacts via Edge Function API to avoid CORS issues
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs/${run.id}/artifacts`, {
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch artifacts: ${response.status}`);
        }

        const dbArtifacts = await response.json();
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

interface Activity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  details: string;
  agent?: string;
  phase?: string;
  llm_response?: string | object;
}

function ActivityTab({ run }: { run: RunRecord }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      console.log(`📋 ActivityTab: Fetching activities for run ${run.id}`);
      try {
        // Fetch real activities from orchestrator_logs
        const { data: logs, error } = await supabase
          .from('orchestrator_logs')
          .select('*')
          .eq('run_id', run.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ ActivityTab: Failed to fetch logs:', error);
          setActivities([]);
          return;
        }

        // Convert logs to activity format
        const logActivities = logs?.map((log: {
          id: string;
          created_at: string;
          level: string;
          message: string;
          thinking_trace?: string;
          agent: string;
          phase: string;
          llm_response?: string | object;
        }) => ({
          id: log.id,
          type: log.level === 'error' ? 'error' : 'agent_activity',
          message: log.message,
          timestamp: log.created_at,
          details: log.thinking_trace || 'Agent processing...',
          agent: log.agent,
          phase: log.phase,
          llm_response: log.llm_response
        })) || [];

        // Add basic run status activities
        const statusActivities = [
          {
            id: 'run_created',
            type: 'run_created',
            message: 'Run initialized',
            timestamp: run.createdAt,
            details: `Started ${run.brief.theme} development pipeline`,
            agent: 'orchestrator',
            phase: 'intake'
          },
          ...(run.status === 'running' ? [{
            id: 'phase_active',
            type: 'phase_change',
            message: `Currently processing ${run.phase} phase`,
            timestamp: run.updatedAt,
            details: `Agents are working on ${run.phase} requirements`,
            agent: 'orchestrator',
            phase: run.phase
          }] : []),
          ...(run.status === 'awaiting_human' ? [{
            id: 'awaiting_review',
            type: 'task_created',
            message: 'Human review required',
            timestamp: run.updatedAt,
            details: `Run paused in ${run.phase} phase pending manual approval`,
            agent: 'orchestrator',
            phase: run.phase
          }] : []),
          ...(run.status === 'done' ? [{
            id: 'run_completed',
            type: 'run_completed',
            message: 'Run completed successfully',
            timestamp: run.updatedAt,
            details: 'All phases completed, game ready for deployment',
            agent: 'orchestrator',
            phase: run.phase
          }] : [])
        ];

        // Combine and sort all activities
        const allActivities = [...logActivities, ...statusActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        console.log(`✅ ActivityTab: Loaded ${allActivities.length} activities (${logActivities.length} from logs, ${statusActivities.length} status)`);
        setActivities(allActivities);
      } catch (error) {
        console.error('❌ ActivityTab: Error fetching activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [run.id, run.status, run.phase, run.updatedAt, run.brief.theme, run.createdAt]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Activity Log</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Activity Log</h3>
      {activities.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          No activities recorded yet.
        </div>
      ) : (
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
                    activity.type === 'run_created'
                      ? 'bg-primary'
                      : activity.type === 'phase_change'
                      ? 'bg-blue-400'
                      : activity.type === 'task_created'
                      ? 'bg-warning'
                      : activity.type === 'run_completed'
                      ? 'bg-success'
                      : activity.type === 'error'
                      ? 'bg-red-400'
                      : 'bg-slate-400'
                  }`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">{activity.message}</p>
                  {run.status === 'running' && activity.type === 'phase_change' && (
                    <span className="text-xs px-2 py-1 bg-warning/20 text-warning rounded-full animate-pulse">
                      Active
                    </span>
                  )}
                </div>
                
                {activity.details && (
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
      )}
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

function ControlsTab({ run, onRunUpdate }: { run: RunRecord; onRunUpdate?: () => void }) {
  const [isForcing, setIsForcing] = useState<string | null>(null);

  const handleForcePhase = async (phase: string) => {
    console.log(`🔧 ControlsTab: Forcing ${phase} phase for run:`, run.id);
    setIsForcing(phase);
    
    try {
      // Call the Edge Function to force generate artifacts for this phase
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs/${run.id}/force-phase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phase })
      });

      if (!response.ok) {
        throw new Error(`Failed to force ${phase}: ${response.status}`);
      }

      console.log(`✅ ControlsTab: Successfully forced ${phase} phase`);
      onRunUpdate?.();
    } catch (error) {
      console.error(`❌ ControlsTab: Failed to force ${phase}:`, error);
      alert(`Failed to force ${phase} phase. Please try again.`);
    } finally {
      setIsForcing(null);
    }
  };

  const phases = [
    { key: 'intake', name: 'Intake', desc: 'Process initial brief and constraints' },
    { key: 'market', name: 'Market Research', desc: 'Analyze market trends and opportunities' },
    { key: 'synthesis', name: 'Synthesis', desc: 'Synthesize market data into insights' },
    { key: 'deconstruct', name: 'Deconstruct', desc: 'Break down winning game concepts' },
    { key: 'prioritize', name: 'Prioritize', desc: 'Select best opportunities' },
    { key: 'build', name: 'Build', desc: 'Generate game prototypes' },
    { key: 'qa', name: 'QA', desc: 'Quality assurance testing' },
    { key: 'deploy', name: 'Deploy', desc: 'Upload to distribution platform' },
    { key: 'measure', name: 'Measure', desc: 'Collect performance data' },
    { key: 'decision', name: 'Decision', desc: 'Evaluate and decide next steps' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Phase Controls</h3>
        <div className="text-sm text-slate-400">
          Current: <span className="text-primary font-medium">{run.phase}</span>
        </div>
      </div>

      <div className="grid gap-3">
        {phases.map((phase) => (
          <div
            key={phase.key}
            className={`p-4 rounded-2xl border transition-colors ${
              phase.key === run.phase 
                ? 'border-primary/40 bg-primary/10' 
                : 'border-slate-800/50 bg-slate-900/40 hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white flex items-center gap-2">
                  {phase.name}
                  {phase.key === run.phase && (
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                      Current
                    </span>
                  )}
                </h4>
                <p className="text-sm text-slate-400 mt-1">{phase.desc}</p>
              </div>
              <button
                onClick={() => handleForcePhase(phase.key)}
                disabled={isForcing === phase.key}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50 text-sm"
              >
                {isForcing === phase.key ? 'Running...' : 'Force Run'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl border border-slate-700/30 bg-slate-900/30">
        <h4 className="font-medium text-white mb-2">Debug Information</h4>
        <div className="text-sm text-slate-400 space-y-1">
          <div>Status: <span className="text-white">{run.status}</span></div>
          <div>Phase: <span className="text-white">{run.phase}</span></div>
          <div>Created: <span className="text-white">{new Date(run.createdAt).toLocaleString()}</span></div>
          <div>Updated: <span className="text-white">{new Date(run.updatedAt).toLocaleString()}</span></div>
          <div>Blockers: <span className="text-white">{run.blockers.length}</span></div>
        </div>
      </div>
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
