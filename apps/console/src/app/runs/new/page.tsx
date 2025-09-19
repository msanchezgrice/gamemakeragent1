'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Rocket, 
  Target, 
  DollarSign, 
  Clock,
  Sparkles,
  Search,
  Users,
  Database,
  BarChart,
  Globe,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface IntakeBrief {
  industry: string;
  targetAudience: string;
  goal: string;
  theme: string;
  competitorAnalysis: {
    enabled: boolean;
    competitors: string[];
    focusAreas: string[];
  };
  webResearch: {
    enabled: boolean;
    sources: string[];
    keywords: string[];
  };
  dataSources: {
    appStore: boolean;
    playStore: boolean;
    steamCharts: boolean;
    socialMedia: boolean;
    gameAnalytics: boolean;
  };
  constraints: {
    maxTokens?: number;
    budgetUsd?: number;
    timeboxHours?: number;
  };
}

export default function NewRunPage() {
  const router = useRouter();
  const [brief, setBrief] = useState<IntakeBrief>({
    industry: '',
    targetAudience: '',
    goal: '',
    theme: '',
    competitorAnalysis: {
      enabled: false,
      competitors: [],
      focusAreas: []
    },
    webResearch: {
      enabled: true,
      sources: ['App Store', 'Google Play', 'Steam'],
      keywords: []
    },
    dataSources: {
      appStore: true,
      playStore: true,
      steamCharts: false,
      socialMedia: true,
      gameAnalytics: false
    },
    constraints: {}
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In real implementation, this would call the orchestrator API
    console.log('Creating run with brief:', brief);
    
    // Redirect to dashboard
    router.push('/');
  };

  const updateBrief = (field: keyof IntakeBrief, value: string) => {
    setBrief(prev => ({ ...prev, [field]: value }));
  };

  const updateConstraints = (field: string, value: number | undefined) => {
    setBrief(prev => ({
      ...prev,
      constraints: { ...prev.constraints, [field]: value }
    }));
  };

  return (
    <main className="mx-auto max-w-4xl px-8 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
          <a href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Console
          </a>
          <span>/</span>
          <span>New Run</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-white">Create New Run</h1>
            <p className="text-slate-300 mt-1">
              Start a new automated game generation workflow
            </p>
          </div>
        </div>
      </header>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={handleSubmit}
        className="space-y-8"
      >
        {/* Basic Information */}
        <section className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Basic Information
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              label="Industry"
              value={brief.industry}
              onChange={(value) => updateBrief('industry', value)}
              placeholder="e.g., Mobile Gaming, EdTech, Fitness"
              required
            />
            <FormField
              label="Target Audience"
              value={brief.targetAudience}
              onChange={(value) => updateBrief('targetAudience', value)}
              placeholder="e.g., Casual gamers, Kids 8-12, Adults 25-35"
            />
          </div>
          
          <div className="mt-6">
            <FormField
              label="Theme"
              value={brief.theme}
              onChange={(value) => updateBrief('theme', value)}
              placeholder="e.g., Space Adventure, Puzzle Solver, Racing Challenge"
              required
            />
          </div>
          
          <div className="mt-6">
            <FormTextArea
              label="Goal"
              value={brief.goal}
              onChange={(value) => updateBrief('goal', value)}
              placeholder="Describe the primary objective and success criteria for this game generation run..."
              required
            />
          </div>
        </section>

        {/* Constraints */}
        <section className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Constraints (Optional)
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <FormField
              label="Max Tokens"
              type="number"
              value={brief.constraints.maxTokens?.toString() || ''}
              onChange={(value) => updateConstraints('maxTokens', value ? parseInt(value) : undefined)}
              placeholder="50000"
              icon={<Sparkles className="h-4 w-4" />}
            />
            <FormField
              label="Budget (USD)"
              type="number"
              value={brief.constraints.budgetUsd?.toString() || ''}
              onChange={(value) => updateConstraints('budgetUsd', value ? parseFloat(value) : undefined)}
              placeholder="100"
              icon={<DollarSign className="h-4 w-4" />}
            />
            <FormField
              label="Timebox (Hours)"
              type="number"
              value={brief.constraints.timeboxHours?.toString() || ''}
              onChange={(value) => updateConstraints('timeboxHours', value ? parseInt(value) : undefined)}
              placeholder="24"
              icon={<Clock className="h-4 w-4" />}
            />
          </div>
        </section>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!brief.industry || !brief.theme || !brief.goal || isSubmitting}
            className={cn(
              "px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2",
              brief.industry && brief.theme && brief.goal && !isSubmitting
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Creating Run...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Start Run
              </>
            )}
          </button>
        </div>
      </motion.form>
    </main>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'number';
  icon?: React.ReactNode;
}

function FormField({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required, 
  type = 'text',
  icon 
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-warning ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={cn(
            "w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors",
            icon && "pl-10"
          )}
        />
      </div>
    </div>
  );
}

interface FormTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

function FormTextArea({ label, value, onChange, placeholder, required }: FormTextAreaProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-warning ml-1">*</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={4}
        className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none"
      />
    </div>
  );
}
