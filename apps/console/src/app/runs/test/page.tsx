'use client';

import { useEffect } from 'react';

export default function TestPage() {
  useEffect(() => {
    console.log('🧪 TEST PAGE LOADED SUCCESSFULLY!');
    console.log('🧪 This proves Next.js routing is working');
    console.log('🧪 Timestamp:', new Date().toISOString());
  }, []);

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-white mb-4">Test Page</h1>
        <p className="text-slate-300 mb-6">If you can see this, Next.js routing is working!</p>
        <a
          href="/"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </main>
  );
}
