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
import { cn } from '../../../../lib/utils';

interface RunTabsProps {
  run: RunRecord & {
    metrics?: {
      progress?: number;
      playRate?: number;
      likability?: number;
    };
  };
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

export function RunTabs({ run }: RunTabsProps) {
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
          {activeTab === 'summary' && <SummaryTab run={run} />}
          {activeTab === 'artifacts' && <ArtifactsTab run={run} />}
          {activeTab === 'activity' && <ActivityTab run={run} />}
          {activeTab === 'tasks' && <TasksTab run={run} />}
        </motion.div>
      </div>
    </div>
  );
}

function SummaryTab({ run }: { run: RunRecord }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Run Overview</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard label="Industry" value={run.brief.industry} />
          <InfoCard label="Target Audience" value={run.brief.targetAudience || 'General'} />
          <InfoCard label="Theme" value={run.brief.theme} />
          <InfoCard label="Status" value={run.status.replace('_', ' ')} />
        </div>
      </div>
      
      <div>
        <h4 className="text-md font-medium text-white mb-3">Goal</h4>
        <p className="text-slate-300 leading-relaxed">{run.brief.goal}</p>
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

function ArtifactsTab({ run }: { run: RunRecord }) {
  // Mock artifacts for now
  const artifacts = [
    { id: '1', name: 'market_scan.json', phase: 'market', size: '24.5 KB', createdAt: run.createdAt },
    { id: '2', name: 'theme_analysis.md', phase: 'synthesis', size: '12.1 KB', createdAt: run.createdAt },
    { id: '3', name: 'build_brief.md', phase: 'build', size: '8.7 KB', createdAt: run.createdAt },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Artifacts</h3>
      {artifacts.map((artifact) => (
        <div
          key={artifact.id}
          className="flex items-center justify-between p-4 rounded-2xl border border-slate-800/50 bg-slate-900/40"
        >
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
            <button className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors">
              <ExternalLink className="h-4 w-4" />
            </button>
            <button className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors">
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
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

function TasksTab({ run }: { run: RunRecord }) {
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
                <button className="px-4 py-2 bg-warning text-black rounded-lg font-medium hover:bg-warning/90 transition-colors">
                  Resolve
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
