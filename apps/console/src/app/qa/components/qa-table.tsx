'use client';

import type { RunRecord } from '@gametok/schemas';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Play,
  ExternalLink,
  AlertTriangle,
  Bug,
  CheckSquare,
  X
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface PrototypeData {
  data?: string;
  filename?: string;
  playable?: boolean;
  specifications?: {
    engine?: string;
    resolution?: string;
    fileSize?: string;
    features?: string[];
  };
}

interface BugReport {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: string;
  title: string;
  description: string;
  location: string;
  impact: string;
  reproductionSteps: string[];
  recommendedFix: string;
  estimatedEffort: string;
}

interface CodeAnalysisData {
  bugReport: BugReport[];
  qualityScore: {
    overall: string;
    functional: string;
    performance: string;
    maintainability: string;
  };
  analysisMetadata: {
    codeSize: string;
    complexity: string;
    overallQuality: string;
  };
}

interface QATableProps {
  runs: Array<RunRecord & {
    hasPrototype?: boolean;
    prototypeData?: PrototypeData;
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

export function QATable({ runs }: QATableProps) {
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [playingGame, setPlayingGame] = useState<string | null>(null);
  const [codeAnalysis, setCodeAnalysis] = useState<Record<string, CodeAnalysisData>>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<Record<string, boolean>>({});

  // Load code analysis data for each run
  useEffect(() => {
    async function loadCodeAnalysis() {
      for (const run of runs) {
        if (!codeAnalysis[run.id] && !loadingAnalysis[run.id]) {
          setLoadingAnalysis(prev => ({ ...prev, [run.id]: true }));
          
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs/${run.id}/artifacts`, {
              headers: {
                'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const artifacts = await response.json();
              const analysisArtifact = artifacts.find((a: { kind: string }) => a.kind === 'code_analysis');
              
              if (analysisArtifact && analysisArtifact.meta?.data) {
                setCodeAnalysis(prev => ({ 
                  ...prev, 
                  [run.id]: analysisArtifact.meta.data 
                }));
              }
            }
          } catch (error) {
            console.error(`Failed to load code analysis for ${run.id}:`, error);
          } finally {
            setLoadingAnalysis(prev => ({ ...prev, [run.id]: false }));
          }
        }
      }
    }

    loadCodeAnalysis();
  }, [runs, codeAnalysis, loadingAnalysis]);

  const handleApprove = async (runId: string) => {
    try {
      // Move run to deploy phase
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs/${runId}/force-phase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phase: 'deploy' })
      });

      if (response.ok) {
        // Refresh the page to update the data
        window.location.reload();
      } else {
        console.error('Failed to approve run');
      }
    } catch (error) {
      console.error('Error approving run:', error);
    }
  };

  const handleReject = async (runId: string) => {
    try {
      // Move run back to build phase for fixes
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/orchestrator-api/runs/${runId}/force-phase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phase: 'build' })
      });

      if (response.ok) {
        // Refresh the page to update the data
        window.location.reload();
      } else {
        console.error('Failed to reject run');
      }
    } catch (error) {
      console.error('Error rejecting run:', error);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur overflow-hidden">
      <header className="p-6 border-b border-slate-800/50">
        <h2 className="text-lg font-semibold text-white">QA Test Results</h2>
        <p className="text-sm text-slate-400 mt-1">Autoplayer performance metrics and manual verification status</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-900/50 sticky top-0">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Game</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Quality</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Bugs</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Performance</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Status</th>
              <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run, index) => (
              <motion.tr
                key={run.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                className={cn(
                  "border-b border-slate-800/30 hover:bg-slate-900/30 transition-colors",
                  selectedRun === run.id && "bg-primary/5"
                )}
                onClick={() => setSelectedRun(selectedRun === run.id ? null : run.id)}
              >
                <td className="p-4">
                  <div>
                    <h4 className="font-medium text-white">{run.brief.theme}</h4>
                    <p className="text-sm text-slate-400">{run.brief.industry}</p>
                  </div>
                </td>
                <td className="p-4">
                  {loadingAnalysis[run.id] ? (
                    <div className="animate-pulse h-4 w-8 bg-slate-700 rounded"></div>
                  ) : codeAnalysis[run.id] ? (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-medium",
                        parseInt(codeAnalysis[run.id].qualityScore.overall) >= 80 ? "text-success" : 
                        parseInt(codeAnalysis[run.id].qualityScore.overall) >= 60 ? "text-warning" : "text-red-400"
                      )}>
                        {codeAnalysis[run.id].qualityScore.overall}/100
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No analysis</span>
                  )}
                </td>
                <td className="p-4">
                  {loadingAnalysis[run.id] ? (
                    <div className="animate-pulse h-4 w-6 bg-slate-700 rounded"></div>
                  ) : codeAnalysis[run.id] ? (
                    <div className="flex items-center gap-2">
                      <Bug className={cn(
                        "h-3 w-3",
                        codeAnalysis[run.id].bugReport.filter(b => b.severity === 'Critical').length > 0 ? "text-red-400" :
                        codeAnalysis[run.id].bugReport.filter(b => b.severity === 'High').length > 0 ? "text-warning" : "text-success"
                      )} />
                      <span className={cn(
                        "text-sm font-medium",
                        codeAnalysis[run.id].bugReport.length === 0 ? "text-success" : 
                        codeAnalysis[run.id].bugReport.length < 3 ? "text-warning" : "text-red-400"
                      )}>
                        {codeAnalysis[run.id].bugReport.length}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </td>
                <td className="p-4">
                  {codeAnalysis[run.id] ? (
                    <span className={cn(
                      "text-sm font-medium",
                      parseInt(codeAnalysis[run.id].qualityScore.performance) >= 80 ? "text-success" : 
                      parseInt(codeAnalysis[run.id].qualityScore.performance) >= 60 ? "text-warning" : "text-red-400"
                    )}>
                      {codeAnalysis[run.id].qualityScore.performance}/100
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </td>
                <td className="p-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    run.status === 'awaiting_human' 
                      ? "bg-warning/20 text-warning" 
                      : "bg-primary/20 text-primary"
                  )}>
                    {run.status === 'awaiting_human' ? 'Needs Review' : 'Testing'}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingGame(run.id);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors"
                      title="Play Game"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/runs/${run.id}`, '_blank');
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                    {run.status === 'awaiting_human' && (
                      <>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(run.id);
                          }}
                          className="px-3 py-1 bg-success text-black rounded-lg text-xs font-medium hover:bg-success/90 transition-colors flex items-center gap-1"
                        >
                          <CheckSquare className="h-3 w-3" />
                          Approve
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(run.id);
                          }}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors flex items-center gap-1"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRun && (
        <QADetailModal 
          run={runs.find(r => r.id === selectedRun)!} 
          codeAnalysis={codeAnalysis[selectedRun]}
          onClose={() => setSelectedRun(null)} 
        />
      )}
      
      {playingGame && (
        <GamePlayerModal 
          run={runs.find(r => r.id === playingGame)!} 
          onClose={() => setPlayingGame(null)} 
        />
      )}
    </div>
  );
}

function QADetailModal({ 
  run, 
  codeAnalysis,
  onClose 
}: { 
  run: QATableProps['runs'][0]; 
  codeAnalysis?: CodeAnalysisData;
  onClose: () => void; 
}) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'checklist' | 'bugs'>('bugs');
  
  const checklistItems = [
    { id: 'gameplay', label: 'Core gameplay functions correctly' },
    { id: 'controls', label: 'Touch controls are responsive' },
    { id: 'performance', label: 'Maintains 30+ FPS throughout' },
    { id: 'audio', label: 'Audio plays without issues' },
    { id: 'completion', label: 'Game can be completed successfully' },
    { id: 'telemetry', label: 'Analytics events fire correctly' },
  ];

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const allChecked = checklistItems.every(item => checkedItems.has(item.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-slate-800 rounded-3xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">QA Review</h3>
            <p className="text-sm text-slate-400 mt-1">{run.brief.theme}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('bugs')}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'bugs' 
                ? "text-primary border-primary" 
                : "text-slate-400 border-transparent hover:text-slate-300"
            )}
          >
            Code Analysis ({codeAnalysis?.bugReport?.length || 0} bugs)
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'checklist' 
                ? "text-primary border-primary" 
                : "text-slate-400 border-transparent hover:text-slate-300"
            )}
          >
            Manual Checklist
          </button>
        </div>

        {/* Tab Content */}
        <div className="mb-6 max-h-96 overflow-y-auto">
          {activeTab === 'bugs' && codeAnalysis ? (
            <div className="space-y-4">
              {codeAnalysis.bugReport.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                  <p>No bugs found!</p>
                  <p className="text-sm mt-2">Code analysis completed successfully</p>
                </div>
              ) : (
                codeAnalysis.bugReport.map((bug) => (
                  <div key={bug.id} className="border border-slate-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{bug.title}</h4>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        bug.severity === 'Critical' ? "bg-red-500/20 text-red-400" :
                        bug.severity === 'High' ? "bg-orange-500/20 text-orange-400" :
                        bug.severity === 'Medium' ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-blue-500/20 text-blue-400"
                      )}>
                        {bug.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{bug.description}</p>
                    <div className="text-xs text-slate-400 space-y-1">
                      <p><strong>Location:</strong> {bug.location}</p>
                      <p><strong>Impact:</strong> {bug.impact}</p>
                      <p><strong>Fix:</strong> {bug.recommendedFix}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'checklist' ? (
            <div className="space-y-3">
              {checklistItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-900/30 transition-colors cursor-pointer"
                  onClick={() => toggleCheck(item.id)}
                >
                  <div className={cn(
                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                    checkedItems.has(item.id) 
                      ? "bg-success border-success" 
                      : "border-slate-600 hover:border-slate-500"
                  )}>
                    {checkedItems.has(item.id) && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle className="h-3 w-3 text-black" />
                      </motion.div>
                    )}
                  </div>
                  <span className={cn(
                    "text-sm transition-colors",
                    checkedItems.has(item.id) ? "text-white" : "text-slate-300"
                  )}>
                    {item.label}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <p>No code analysis available</p>
              <p className="text-sm mt-2">QA analysis may still be processing</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            Close
          </button>
          {activeTab === 'checklist' && (
            <button
              disabled={!allChecked}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-medium transition-all",
                allChecked 
                  ? "bg-success text-black hover:bg-success/90" 
                  : "bg-slate-700 text-slate-500 cursor-not-allowed"
              )}
            >
              {allChecked ? "Confirm QA" : `${checkedItems.size}/${checklistItems.length} checked`}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function GamePlayerModal({ 
  run, 
  onClose 
}: { 
  run: QATableProps['runs'][0]; 
  onClose: () => void; 
}) {
  // Get prototype HTML from run data (this will need to be fetched from the API)
  const prototypeHTML = run.prototypeData?.data || '';
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface border border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Game Testing</h3>
            <p className="text-sm text-slate-400 mt-1">{run.brief.theme}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </header>

        <div className="bg-black rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '9/16', height: '500px' }}>
          {prototypeHTML ? (
            <iframe
              srcDoc={prototypeHTML}
              className="w-full h-full border-0"
              title={`${run.brief.theme} Game`}
              sandbox="allow-scripts allow-same-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No prototype available</p>
                <p className="text-sm mt-2">Build phase may not be complete</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            Close
          </button>
          <button className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors">
            Pass QA
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
