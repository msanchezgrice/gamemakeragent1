'use client';

import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <motion.div
      className={cn(
        "rounded-lg bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 bg-[length:200%_100%]",
        className
      )}
      animate={animate ? {
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
      } : undefined}
      transition={animate ? {
        duration: 2,
        repeat: Infinity,
        ease: "linear"
      } : undefined}
    />
  );
}

export function RunCardSkeleton() {
  return (
    <div className="rounded-3xl bg-surface/80 p-6 border border-slate-800/50">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      
      <Skeleton className="h-4 w-full mb-4" />
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
      </div>
      
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
    </div>
  );
}

export function QATableSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur overflow-hidden">
      <div className="p-6 border-b border-slate-800/50">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-8 gap-4 mb-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-4" />
          ))}
        </div>
        
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-8 gap-4 py-3 border-b border-slate-800/30 last:border-0">
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton key={j} className="h-4" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimelineSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
      <div className="mb-6">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DeploymentBoardSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div
          key={columnIndex}
          className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur p-6 min-h-[400px]"
        >
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-24 mb-1" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div key={cardIndex} className="rounded-2xl border border-slate-800/50 bg-slate-900/40 p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-16 w-12 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
