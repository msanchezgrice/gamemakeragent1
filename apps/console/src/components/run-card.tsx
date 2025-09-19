'use client';

import type { RunRecord } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Gauge, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';

interface RunCardProps {
  run: RunRecord & {
    metrics?: {
      progress?: number;
      playRate?: number;
      likability?: number;
    };
  };
}

export function RunCard({ run }: RunCardProps) {
  const hasBlockers = run.blockers.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'rounded-3xl bg-surface/80 p-6 shadow-card backdrop-blur border border-slate-800/50 flex flex-col gap-5 transition hover:-translate-y-1 hover:border-primary/40',
        hasBlockers && 'ring-2 ring-warning/50'
      )}
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">{run.brief.industry}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{run.brief.theme}</h2>
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium capitalize',
            statusColor(run.status)
          )}
        >
          {run.status.replace('_', ' ')}
        </span>
      </header>

      <p className="text-sm text-slate-300 leading-relaxed">{run.brief.goal}</p>

      <div className="grid grid-cols-3 gap-4">
        <MetricPill label="Progress" value={`${Math.round((run.metrics?.progress ?? 0) * 100)}%`} icon={Gauge} />
        <MetricPill label="Play rate" value={percent(run.metrics?.playRate)} icon={ArrowUpRight} subtle />
        <MetricPill label="Likability" value={percent(run.metrics?.likability)} icon={ArrowUpRight} subtle />
      </div>

      <footer className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1"> <Clock className="h-3 w-3" /> Updated {timeAgo(run.updatedAt)} </span>
        <a href={`/runs/${run.id}`} className="inline-flex items-center gap-1 text-primary transition-colors hover:text-accent">
          View run <ArrowUpRight className="h-3 w-3" />
        </a>
      </footer>

      {hasBlockers && (
        <div className="rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> {run.blockers[0].title}
        </div>
      )}
    </motion.div>
  );
}

interface MetricPillProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  subtle?: boolean;
}

function MetricPill({ label, value, icon: Icon, subtle }: MetricPillProps) {
  return (
    <div className={cn('rounded-2xl px-4 py-3 border border-slate-800/70 bg-slate-900/40', subtle && 'opacity-70')}> 
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-2 text-sm font-medium text-white">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {value}
      </div>
    </div>
  );
}

function statusColor(status: RunRecord['status']) {
  switch (status) {
    case 'awaiting_human':
      return 'bg-warning/20 text-warning border border-warning/30';
    case 'done':
      return 'bg-success/20 text-success border border-success/30';
    case 'failed':
      return 'bg-red-500/20 text-red-400 border border-red-500/30';
    default:
      return 'bg-primary/20 text-primary border border-primary/30';
  }
}

function percent(value?: number) {
  if (typeof value !== 'number') return '–';
  return `${Math.round(value * 100)}%`;
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
