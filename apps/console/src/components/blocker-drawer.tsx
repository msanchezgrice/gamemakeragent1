'use client';

import type { ManualTask } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { ArrowUpRight, Clock, Layers, PartyPopper } from 'lucide-react';
import { cn } from '../lib/utils';

interface BlockerDrawerProps {
  tasks: ManualTask[];
}

export function BlockerDrawer({ tasks }: BlockerDrawerProps) {
  if (!tasks.length) {
    return (
      <section className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
          <PartyPopper className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">All clear</h3>
        <p className="mt-2 text-sm text-slate-300">No human approvals outstanding. Keep the runs flowing.</p>
      </section>
    );
  }

  return (
    <section 
      data-blocker-drawer
      className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur"
    >
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Awaiting Human Review</p>
          <h3 className="text-lg font-semibold text-white">{tasks.length} open actions</h3>
        </div>
      </header>

      <div className="mt-6 space-y-4">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.25 }}
            className="rounded-2xl border border-warning/40 bg-warning/10 px-5 py-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-warning">
                  <Layers className="h-3 w-3" /> {task.phase}
                </div>
                <h4 className="mt-2 text-sm font-semibold text-white">{task.title}</h4>
                <p className="mt-1 text-xs text-slate-300/90 leading-relaxed">{task.description}</p>
              </div>
              <a 
                href={`/runs/${task.runId}`}
                className={cn('inline-flex items-center gap-1 text-warning text-xs font-medium hover:text-accent transition-colors')}
              >
                Open run <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-warning/70">
              <Clock className="h-3 w-3" /> created {timeAgo(task.createdAt)}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
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
