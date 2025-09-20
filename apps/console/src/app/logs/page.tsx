'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Zap,
  RefreshCw,
  Filter
} from 'lucide-react';
import { mcp_supabase_get_logs } from '../../lib/supabase-mcp';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  service: string;
  message: string;
  runId?: string;
  phase?: string;
  metadata?: Record<string, unknown>;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLogs = async () => {
    console.log('📋 Logs: Fetching system logs...');
    try {
      // Get Edge Function logs
      const edgeLogs = await fetch('/api/logs/edge-functions');
      
      // For now, create some mock realistic logs based on our runs
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 30000).toISOString(),
          level: 'info',
          service: 'orchestrator',
          message: 'Run f89dcdd6-d483-435a-ac2a-1ddf69929a09 created successfully',
          runId: 'f89dcdd6-d483-435a-ac2a-1ddf69929a09',
          phase: 'intake'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 25000).toISOString(),
          level: 'info',
          service: 'theme-agent',
          message: 'Processing theme analysis for "ninja fitness challenge"',
          runId: 'f89dcdd6-d483-435a-ac2a-1ddf69929a09',
          phase: 'intake',
          metadata: { theme: 'ninja fitness challenge', industry: 'fitness' }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 20000).toISOString(),
          level: 'success',
          service: 'market-agent',
          message: 'Market scan completed: found 47 similar games',
          runId: '8417439c-ee1f-4576-814e-4690691bda4f',
          phase: 'market',
          metadata: { similarGames: 47, topGenres: ['fitness', 'gamification'] }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 15000).toISOString(),
          level: 'warning',
          service: 'synthesis-agent',
          message: 'Low confidence in trend analysis (0.67), requesting human review',
          runId: '0a18f195-7851-487d-9363-a020ea07b835',
          phase: 'synthesis'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 10000).toISOString(),
          level: 'info',
          service: 'orchestrator',
          message: 'Run 0a18f195-7851-487d-9363-a020ea07b835 advanced to synthesis phase',
          runId: '0a18f195-7851-487d-9363-a020ea07b835',
          phase: 'synthesis'
        },
        {
          id: '6',
          timestamp: new Date(Date.now() - 5000).toISOString(),
          level: 'error',
          service: 'build-agent',
          message: 'Failed to generate prototype: API rate limit exceeded',
          runId: '2c7c640b-d81b-43d7-a172-160f7a850e3b',
          phase: 'build',
          metadata: { error: 'RATE_LIMIT', retryAfter: 60 }
        }
      ];

      setLogs(mockLogs);
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
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                        Run: {log.runId.slice(0, 8)}
                      </span>
                    )}
                    {log.phase && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        {log.phase}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm">{log.message}</p>
                  {log.metadata && (
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
