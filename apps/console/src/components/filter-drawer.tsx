'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: RunFilters) => void;
  currentFilters: RunFilters;
}

export interface RunFilters {
  search: string;
  status: string[];
  phase: string[];
  industry: string[];
}

const STATUS_OPTIONS = [
  { value: 'queued', label: 'Queued' },
  { value: 'running', label: 'Running' },
  { value: 'awaiting_human', label: 'Awaiting Human' },
  { value: 'paused', label: 'Paused' },
  { value: 'failed', label: 'Failed' },
  { value: 'done', label: 'Done' },
];

const PHASE_OPTIONS = [
  { value: 'intake', label: 'Intake' },
  { value: 'market', label: 'Market' },
  { value: 'synthesis', label: 'Synthesis' },
  { value: 'deconstruct', label: 'Deconstruct' },
  { value: 'prioritize', label: 'Prioritize' },
  { value: 'build', label: 'Build' },
  { value: 'qa', label: 'QA' },
  { value: 'deploy', label: 'Deploy' },
  { value: 'measure', label: 'Measure' },
  { value: 'decision', label: 'Decision' },
];

export function FilterDrawer({ isOpen, onClose, onApplyFilters, currentFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState<RunFilters>(currentFilters);

  const updateFilter = (key: keyof RunFilters, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayFilter = (key: 'status' | 'phase' | 'industry', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(key, updated);
  };

  const clearFilters = () => {
    const cleared: RunFilters = {
      search: '',
      status: [],
      phase: [],
      industry: []
    };
    setFilters(cleared);
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const hasActiveFilters = filters.search || 
    filters.status.length > 0 || 
    filters.phase.length > 0 || 
    filters.industry.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-96 bg-surface border-l border-slate-800 z-50 overflow-y-auto"
          >
            <div className="p-6">
              <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-white">Filter Runs</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </header>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      placeholder="Search runs..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <FilterSection
                  title="Status"
                  options={STATUS_OPTIONS}
                  selected={filters.status}
                  onToggle={(value) => toggleArrayFilter('status', value)}
                />

                {/* Phase Filter */}
                <FilterSection
                  title="Phase"
                  options={PHASE_OPTIONS}
                  selected={filters.phase}
                  onToggle={(value) => toggleArrayFilter('phase', value)}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 mt-8 pt-6 border-t border-slate-800/50">
                <button
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 transition-colors",
                    hasActiveFilters 
                      ? "hover:bg-slate-800/50" 
                      : "opacity-50 cursor-not-allowed"
                  )}
                >
                  Clear All
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface FilterSectionProps {
  title: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterSection({ title, options, selected, onToggle }: FilterSectionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium text-white mb-3">{title}</h3>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="sr-only"
            />
            <div className={cn(
              "h-4 w-4 rounded border-2 flex items-center justify-center transition-all",
              selected.includes(option.value)
                ? "bg-primary border-primary"
                : "border-slate-600 hover:border-slate-500"
            )}>
              {selected.includes(option.value) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="h-2 w-2 bg-white rounded-sm"
                />
              )}
            </div>
            <span className="text-sm text-slate-300">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
