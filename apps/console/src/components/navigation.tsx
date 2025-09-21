'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  TestTube,
  Rocket,
  Plus,
  Activity,
  Search,
  BarChart3
} from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/qa', label: 'QA', icon: TestTube },
  { href: '/deploy', label: 'Deploy', icon: Rocket },
  { href: '/analysis', label: 'Analysis', icon: BarChart3 },
  { href: '/runs/new', label: 'New Run', icon: Plus },
  { href: '/logs', label: 'Logs', icon: Activity },
  { href: '/debug', label: 'Debug', icon: Search },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-800/50 bg-surface/50 backdrop-blur sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-semibold text-white">GameTok</span>
            </div>
            
            <div className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "text-primary" 
                        : "text-slate-400 hover:text-slate-300"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </a>
                );
              })}
            </div>
          </div>

              <div className="flex items-center gap-3">
                {/* Removed non-functional search and notification icons */}
              </div>
        </div>
      </div>
    </nav>
  );
}
