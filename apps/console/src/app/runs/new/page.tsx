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
  Database,
  BarChart,
  Globe,
  Zap
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { createRun } from '../../../lib/data-source';
import { useToast } from '../../../components/toast-provider';

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
  const { addToast } = useToast();
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
    
    try {
      const newRun = await createRun(brief);
      
      addToast({
        type: 'success',
        title: 'Run Created Successfully',
        description: `${brief.theme} run has been started and is now processing.`
      });
      
      // Redirect to the new run's detail page
      router.push(`/runs/${newRun.id}`);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Failed to Create Run',
        description: 'There was an error starting your run. Please try again.'
      });
      setIsSubmitting(false);
    }
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

        {/* Research Configuration */}
        <section className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Research & Analysis
          </h2>
          
          {/* Web Research Toggle */}
          <div className="mb-6">
            <ToggleField
              label="Enable Web Research"
              description="Allow agents to search for market trends and competitor data"
              checked={brief.webResearch.enabled}
              onChange={(checked) => setBrief(prev => ({
                ...prev,
                webResearch: { ...prev.webResearch, enabled: checked }
              }))}
              icon={<Globe className="h-4 w-4" />}
            />
          </div>

          {/* Data Sources */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Data Sources
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <CheckboxField
                label="App Store Charts"
                checked={brief.dataSources.appStore}
                onChange={(checked) => setBrief(prev => ({
                  ...prev,
                  dataSources: { ...prev.dataSources, appStore: checked }
                }))}
              />
              <CheckboxField
                label="Google Play Store"
                checked={brief.dataSources.playStore}
                onChange={(checked) => setBrief(prev => ({
                  ...prev,
                  dataSources: { ...prev.dataSources, playStore: checked }
                }))}
              />
              <CheckboxField
                label="Steam Charts"
                checked={brief.dataSources.steamCharts}
                onChange={(checked) => setBrief(prev => ({
                  ...prev,
                  dataSources: { ...prev.dataSources, steamCharts: checked }
                }))}
              />
              <CheckboxField
                label="Social Media Trends"
                checked={brief.dataSources.socialMedia}
                onChange={(checked) => setBrief(prev => ({
                  ...prev,
                  dataSources: { ...prev.dataSources, socialMedia: checked }
                }))}
              />
            </div>
          </div>

          {/* Competitor Analysis */}
          <div>
            <ToggleField
              label="Competitor Analysis"
              description="Deep-dive analysis of specific competitor games"
              checked={brief.competitorAnalysis.enabled}
              onChange={(checked) => setBrief(prev => ({
                ...prev,
                competitorAnalysis: { ...prev.competitorAnalysis, enabled: checked }
              }))}
              icon={<BarChart className="h-4 w-4" />}
            />
            
            {brief.competitorAnalysis.enabled && (
              <div className="mt-4 p-4 rounded-2xl border border-slate-800/30 bg-slate-900/30">
                <TagInput
                  label="Competitor Games"
                  placeholder="Enter game names (e.g., Subway Surfers, Candy Crush)"
                  tags={brief.competitorAnalysis.competitors}
                  onChange={(tags) => setBrief(prev => ({
                    ...prev,
                    competitorAnalysis: { ...prev.competitorAnalysis, competitors: tags }
                  }))}
                />
                <div className="mt-4">
                  <TagInput
                    label="Focus Areas"
                    placeholder="What to analyze (e.g., monetization, retention, gameplay)"
                    tags={brief.competitorAnalysis.focusAreas}
                    onChange={(tags) => setBrief(prev => ({
                      ...prev,
                      competitorAnalysis: { ...prev.competitorAnalysis, focusAreas: tags }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Constraints */}
        <section className="rounded-3xl border border-slate-800/70 bg-surface/70 p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Constraints & Limits
          </h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <FormField
              label="Max Tokens"
              type="number"
              value={brief.constraints.maxTokens?.toString() || ''}
              onChange={(value) => updateConstraints('maxTokens', value ? parseInt(value) : undefined)}
              placeholder="50000"
              icon={<Sparkles className="h-4 w-4" />}
              description="Maximum AI tokens to use"
            />
            <FormField
              label="Budget (USD)"
              type="number"
              value={brief.constraints.budgetUsd?.toString() || ''}
              onChange={(value) => updateConstraints('budgetUsd', value ? parseFloat(value) : undefined)}
              placeholder="100"
              icon={<DollarSign className="h-4 w-4" />}
              description="Total budget for this run"
            />
            <FormField
              label="Timebox (Hours)"
              type="number"
              value={brief.constraints.timeboxHours?.toString() || ''}
              onChange={(value) => updateConstraints('timeboxHours', value ? parseInt(value) : undefined)}
              placeholder="24"
              icon={<Clock className="h-4 w-4" />}
              description="Maximum time to spend"
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
  description?: string;
}

function FormField({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  required, 
  type = 'text',
  icon,
  description 
}: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label}
        {required && <span className="text-warning ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-slate-400 mb-2">{description}</p>
      )}
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
            "w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 hover:border-slate-600",
            icon && "pl-10"
          )}
        />
      </div>
    </div>
  );
}

interface ToggleFieldProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

function ToggleField({ label, description, checked, onChange, icon }: ToggleFieldProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-2xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-900/50 transition-colors">
      {icon && (
        <div className="text-primary mt-1">
          {icon}
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-medium text-white">{label}</h3>
        <p className="text-sm text-slate-400 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900",
          checked ? "bg-primary" : "bg-slate-700"
        )}
      >
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/50 hover:bg-slate-900/30 transition-colors cursor-pointer">
      <div className={cn(
        "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
        checked 
          ? "bg-primary border-primary" 
          : "border-slate-600 hover:border-slate-500"
      )}>
        {checked && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="h-2 w-2 bg-white rounded-sm"
          />
        )}
      </div>
      <span className="text-sm text-slate-300">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  );
}

interface TagInputProps {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ label, placeholder, tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onChange([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">{label}</label>
      <div className="space-y-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-white transition-colors"
                >
                  ×
                </button>
              </motion.span>
            ))}
          </div>
        )}
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
        className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-200 hover:border-slate-600 resize-none"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>Describe your goals and success criteria</span>
        <span>{value.length}/500</span>
      </div>
    </div>
  );
}
