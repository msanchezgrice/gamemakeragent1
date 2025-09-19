'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});
  const [testResults, setTestResults] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const info = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
      orchestratorUrl: process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? process.env.NEXT_PUBLIC_SUPABASE_URL + '/functions/v1/orchestrator-api'
        : null,
      timestamp: new Date().toISOString()
    };
    
    setDebugInfo(info);
    console.log('🔍 Debug Info:', info);

    // Test Edge Function
    if (info.orchestratorUrl) {
      testEdgeFunction(info.orchestratorUrl);
    }
  }, []);

  const testEdgeFunction = async (url: string) => {
    try {
      console.log('🧪 Testing Edge Function:', url + '/health');
      
      const healthResponse = await fetch(url + '/health', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const healthData = await healthResponse.json();
      console.log('✅ Health check result:', healthData);
      
      const runsResponse = await fetch(url + '/runs', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      const runsData = await runsResponse.json();
      console.log('✅ Runs data:', runsData);
      
      setTestResults({
        health: healthData,
        runs: runsData,
        runsCount: Array.isArray(runsData) ? runsData.length : 'Not array'
      });
      
    } catch (error) {
      console.error('❌ Edge Function test failed:', error);
      setTestResults({ error: error.message });
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-8 py-12">
      <h1 className="text-3xl font-semibold text-white mb-8">Debug Console</h1>
      
      <div className="space-y-6">
        <section className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-4">Environment Variables</h2>
          <pre className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </section>

        <section className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-4">Edge Function Test Results</h2>
          <pre className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl overflow-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </section>

        <div className="flex gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Refresh Test
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
