'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Filter
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  service: string;
  message: string;
  runId?: string;
  phase?: string;
  projectName?: string;
  metadata?: Record<string, unknown> & {
    thinking_trace?: string;
    llm_response?: string;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    console.log('📋 Logs: Fetching system logs...');
    try {
      // Fetch real logs from database including thinking traces
      const { data: agentLogs, error: logsError } = await supabase
        .from('orchestrator_logs')
        .select(`
          *,
          run:orchestrator_runs(brief)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch real logs from Supabase Edge Function
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const realLogs: LogEntry[] = [];

      // Add agent thinking traces and artifacts
      if (!logsError && agentLogs) {
        const agentLogEntries = agentLogs.map((log: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: `agent-${log.id}`,
          timestamp: log.created_at,
          level: log.level as LogEntry['level'],
          service: log.agent,
          message: log.message,
          runId: log.run_id,
          phase: log.phase,
          projectName: log.run?.brief?.theme || 'Unknown Project',
          metadata: {
            thinking_trace: log.thinking_trace,
            llm_response: log.llm_response,
            ...log.metadata
          }
        }));
        realLogs.push(...agentLogEntries);
      }
      
      if (response.ok) {
        const runs = await response.json();
        // Convert runs to log entries
        const runLogEntries = runs.slice(0, 6).map((run: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
          id: `run-${run.id}`,
          timestamp: run.updated_at,
          level: run.status === 'failed' ? 'error' as const : 
                 run.status === 'awaiting_human' ? 'warning' as const : 
                 run.status === 'done' ? 'success' as const : 'info' as const,
          service: 'orchestrator',
          message: `Run ${run.id.slice(0, 8)} (${run.brief?.theme || 'Unknown'}) is ${run.status} in ${run.phase} phase`,
          runId: run.id,
          phase: run.phase,
          projectName: run.brief?.theme || 'Unknown Project',
          metadata: { 
            status: run.status, 
            phase: run.phase, 
            theme: run.brief?.theme,
            blockers: run.blockers?.length || 0
          }
        }));
        realLogs.push(...runLogEntries);
      }
      

      // Use only real logs from runs
      setLogs(realLogs.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    } catch (error) {
      console.error('❌ Logs: Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchLogs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.level === filter);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      default:
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              System Logs
            </h1>
            <p className="text-slate-300 mt-2">Real-time activity and debugging information</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                autoRefresh 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh
            </button>
            <button
              onClick={fetchLogs}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <Filter className="h-5 w-5 text-slate-400" />
        <div className="flex gap-2">
          {(['all', 'info', 'success', 'warning', 'error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === level
                  ? 'bg-primary text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
              {level !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  {logs.filter(log => log.level === level).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No logs found for the selected filter</p>
          </div>
        ) : (
          filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start gap-3">
                {getLevelIcon(log.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-white">{log.service}</span>
                    {log.runId && (
                      <a 
                        href={`/runs/${log.runId}`}
                        className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30 transition-colors"
                      >
                        Run: {log.runId.slice(0, 8)}
                      </a>
                    )}
                    {log.phase && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {log.phase}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm">{log.message}</p>
                  {log.projectName && (
                    <p className="text-xs text-slate-400 mt-1">
                      Project: <span className="text-slate-300">{log.projectName}</span>
                    </p>
                  )}
                        {log.metadata?.thinking_trace && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                              Show thinking trace
                            </summary>
                            <div className="text-xs text-slate-300 mt-1 bg-slate-900/50 p-3 rounded border border-slate-700/30 whitespace-pre-wrap">
                              {log.metadata.thinking_trace}
                            </div>
                          </details>
                        )}
                        {log.metadata?.llm_response && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                              Show LLM response
                            </summary>
                            <pre className="text-xs text-slate-300 mt-1 bg-slate-900/50 p-3 rounded border border-slate-700/30 overflow-x-auto max-h-64 overflow-y-auto">
                              {log.metadata.llm_response}
                            </pre>
                          </details>
                        )}
                        {log.metadata && !log.metadata.thinking_trace && !log.metadata.llm_response && (
                          <details className="mt-2">
                            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-300">
                              Show metadata
                            </summary>
                            <pre className="text-xs text-slate-400 mt-1 bg-slate-900/50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </main>
  );
}
