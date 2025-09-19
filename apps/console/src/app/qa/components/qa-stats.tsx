'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react';

interface QAStatsProps {
  runs: Array<{
    id: string;
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

export function QAStats({ runs }: QAStatsProps) {
  if (runs.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur text-center">
        <p className="text-slate-400">No games currently in QA</p>
      </div>
    );
  }

  const avgTTFI = runs.reduce((sum, run) => sum + run.qaMetrics.ttfi, 0) / runs.length;
  const avgFPS = runs.reduce((sum, run) => sum + run.qaMetrics.fps, 0) / runs.length;
  const totalErrors = runs.reduce((sum, run) => sum + run.qaMetrics.errorCount, 0);
  const avgCrashRate = runs.reduce((sum, run) => sum + run.qaMetrics.crashRate, 0) / runs.length;

  const stats = [
    {
      label: 'Avg TTFI',
      value: `${Math.round(avgTTFI)}ms`,
      trend: avgTTFI < 2000 ? 'good' : avgTTFI < 3000 ? 'warning' : 'bad',
      icon: Zap,
      description: 'Time to first interaction'
    },
    {
      label: 'Avg FPS',
      value: Math.round(avgFPS),
      trend: avgFPS > 50 ? 'good' : avgFPS > 30 ? 'warning' : 'bad',
      icon: TrendingUp,
      description: 'Frames per second'
    },
    {
      label: 'Total Errors',
      value: totalErrors,
      trend: totalErrors === 0 ? 'good' : totalErrors < 5 ? 'warning' : 'bad',
      icon: AlertTriangle,
      description: 'JavaScript errors detected'
    },
    {
      label: 'Crash Rate',
      value: `${(avgCrashRate * 100).toFixed(1)}%`,
      trend: avgCrashRate < 0.01 ? 'good' : avgCrashRate < 0.03 ? 'warning' : 'bad',
      icon: TrendingDown,
      description: 'Application crashes'
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${getTrendColor(stat.trend, 'bg')}`}>
              <stat.icon className={`h-5 w-5 ${getTrendColor(stat.trend, 'text')}`} />
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getTrendColor(stat.trend, 'badge')}`}>
              {stat.trend}
            </div>
          </div>
          
          <div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm font-medium text-slate-300 mt-1">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-2">{stat.description}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function getTrendColor(trend: string, type: 'bg' | 'text' | 'badge') {
  const colors = {
    good: {
      bg: 'bg-success/10',
      text: 'text-success',
      badge: 'bg-success/20 text-success'
    },
    warning: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      badge: 'bg-warning/20 text-warning'
    },
    bad: {
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      badge: 'bg-red-500/20 text-red-400'
    }
  };
  
  return colors[trend as keyof typeof colors]?.[type] || colors.warning[type];
}
