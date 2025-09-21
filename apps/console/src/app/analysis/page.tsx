'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Database, TrendingUp, Target, Gamepad2, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

// Popular games data for the first table
const popularGames = [
  { name: 'Subway Surfers', type: 'Runner', mechanic: 'Swipe', theme: 'Urban', style: 'Cartoon 3D', session: '3-5', progression: 'Endless', monetization: 'Hybrid', hook: '10 sec' },
  { name: 'Temple Run 2', type: 'Runner', mechanic: 'Swipe+Tilt', theme: 'Adventure', style: '3D Realistic', session: '2-4', progression: 'Endless', monetization: 'Hybrid', hook: '5 sec' },
  { name: 'Candy Crush Saga', type: 'Puzzle', mechanic: 'Swipe', theme: 'Candy', style: 'Cartoon', session: '5-7', progression: 'Levels', monetization: 'Hybrid', hook: '30 sec' },
  { name: 'Helix Jump', type: 'Arcade', mechanic: 'Tap', theme: 'Abstract', style: 'Minimalist 3D', session: '2-3', progression: 'Endless', monetization: 'Ads', hook: '3 sec' },
  { name: 'Paper.io 2', type: 'IO', mechanic: 'Swipe', theme: 'Abstract', style: 'Minimalist', session: '3-5', progression: 'Endless', monetization: 'Ads', hook: '5 sec' },
  { name: 'Slither.io', type: 'IO', mechanic: 'Drag', theme: 'Snake', style: 'Neon', session: '5-10', progression: 'Endless', monetization: 'Ads', hook: '3 sec' },
  { name: 'Stack', type: 'Arcade', mechanic: 'Tap', theme: 'Abstract', style: 'Minimalist', session: '2-3', progression: 'Endless', monetization: 'Ads', hook: '2 sec' },
  { name: 'Crossy Road', type: 'Arcade', mechanic: 'Tap', theme: 'Urban', style: 'Voxel', session: '2-4', progression: 'Endless', monetization: 'Hybrid', hook: '5 sec' },
  { name: 'Flappy Bird', type: 'Arcade', mechanic: 'Tap', theme: 'Nature', style: 'Pixel', session: '1-2', progression: 'Endless', monetization: 'Ads', hook: '2 sec' },
  { name: '2048', type: 'Puzzle', mechanic: 'Swipe', theme: 'Numbers', style: 'Minimalist', session: '5-15', progression: 'Score', monetization: 'Ads', hook: '20 sec' }
];

// Design matrix data
const matrixGames = [
  { id: 1, name: 'Frost Soar Exploding', type: 'Flight', mechanic: 'Sorting', control: 'One-tap', camera: 'Top-down 2D', structure: 'Endless', session: '62s', theme: 'Nature', style: 'Voxel' },
  { id: 2, name: 'Echo Rush Exploding', type: 'Runner', mechanic: 'Aim & Release', control: 'Tap & Hold', camera: 'Isometric', structure: 'Level-based', session: '47s', theme: 'Sports', style: 'Voxel' },
  { id: 3, name: 'Prism Click Crowd', type: 'Arcade Idle', mechanic: 'Physics', control: 'Draw Path', camera: 'First-person', structure: 'Endless', session: '39s', theme: 'Underwater', style: 'Stylized 3D' },
  { id: 4, name: 'Lava Fall Perfect', type: 'Physics Dropper', mechanic: 'Aim & Release', control: 'Tilt/Gyro', camera: 'Side 2D', structure: 'Level-based', session: '46s', theme: 'Abstract/ASMR', style: 'Minimal 2D' },
  { id: 5, name: 'Crypto Crew Scale', type: 'Crowd Runner', mechanic: 'Aim & Release', control: 'Tilt/Gyro', camera: 'First-person', structure: 'Level-based', session: '54s', theme: 'Urban', style: 'Voxel' }
];

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<'popular' | 'matrix'>('popular');

  return (
    <main className="mx-auto max-w-7xl px-8 py-12">
      <header className="mb-8">
        <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
          <a href="/" className="hover:text-primary transition-colors">Console</a>
          <span>/</span>
          <span className="text-white">Analysis</span>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Game Analysis</h1>
            <p className="text-slate-400 mt-1">Hyper-casual game design patterns and market insights</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface/70 backdrop-blur border border-slate-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <Gamepad2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-slate-400">Games Analyzed</span>
            </div>
            <div className="text-2xl font-bold text-white">50+</div>
            <div className="text-xs text-slate-500 mt-1">Top performers</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface/70 backdrop-blur border border-slate-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <Target className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-slate-400">Avg Hook Time</span>
            </div>
            <div className="text-2xl font-bold text-white">5.2s</div>
            <div className="text-xs text-slate-500 mt-1">Time to engagement</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface/70 backdrop-blur border border-slate-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium text-slate-400">Session Length</span>
            </div>
            <div className="text-2xl font-bold text-white">2-3min</div>
            <div className="text-xs text-slate-500 mt-1">Optimal duration</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface/70 backdrop-blur border border-slate-800/50 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <Zap className="h-5 w-5 text-purple-400" />
              <span className="text-sm font-medium text-slate-400">Top Mechanic</span>
            </div>
            <div className="text-2xl font-bold text-white">Tap</div>
            <div className="text-xs text-slate-500 mt-1">38% of games</div>
          </motion.div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 mb-8">
        <button
          onClick={() => setActiveTab('popular')}
          className={cn(
            "px-6 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === 'popular' 
              ? "text-primary border-primary" 
              : "text-slate-400 border-transparent hover:text-slate-300"
          )}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Popular Games Analysis
          </div>
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            "px-6 py-3 text-sm font-medium transition-colors border-b-2",
            activeTab === 'matrix' 
              ? "text-primary border-primary" 
              : "text-slate-400 border-transparent hover:text-slate-300"
          )}
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Design Matrix (50 Games)
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-3xl border border-slate-800/70 bg-surface/70 backdrop-blur overflow-hidden">
        {activeTab === 'popular' ? (
          <div>
            <header className="p-6 border-b border-slate-800/50">
              <h2 className="text-lg font-semibold text-white">Top 10 Hyper-Casual Games Analysis</h2>
              <p className="text-sm text-slate-400 mt-1">Core design patterns from the most successful games</p>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 sticky top-0">
                  <tr>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Game</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Type</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Mechanic</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Theme</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Style</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Session</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Progression</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Monetization</th>
                    <th className="text-left p-4 text-xs uppercase tracking-[0.2em] text-slate-400 font-medium">Hook Time</th>
                  </tr>
                </thead>
                <tbody>
                  {popularGames.map((game, index) => (
                    <motion.tr
                      key={game.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className="border-b border-slate-800/30 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="font-medium text-white">{game.name}</div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          game.type === 'Runner' ? "bg-orange-500/20 text-orange-400" :
                          game.type === 'Puzzle' ? "bg-green-500/20 text-green-400" :
                          game.type === 'Arcade' ? "bg-red-500/20 text-red-400" :
                          game.type === 'IO' ? "bg-blue-500/20 text-blue-400" :
                          "bg-purple-500/20 text-purple-400"
                        )}>
                          {game.type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          game.mechanic.includes('Tap') ? "bg-primary/20 text-primary" :
                          game.mechanic.includes('Swipe') ? "bg-purple-500/20 text-purple-400" :
                          game.mechanic.includes('Drag') ? "bg-green-500/20 text-green-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {game.mechanic}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-300">{game.theme}</td>
                      <td className="p-4 text-sm text-slate-300">{game.style}</td>
                      <td className="p-4 text-sm text-slate-300">{game.session} min</td>
                      <td className="p-4 text-sm text-slate-300">{game.progression}</td>
                      <td className="p-4 text-sm text-slate-300">{game.monetization}</td>
                      <td className="p-4">
                        <span className={cn(
                          "text-sm font-medium",
                          parseInt(game.hook.split(' ')[0]) <= 5 ? "text-success" :
                          parseInt(game.hook.split(' ')[0]) <= 10 ? "text-warning" :
                          "text-red-400"
                        )}>
                          {game.hook}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div>
            <header className="p-6 border-b border-slate-800/50">
              <h2 className="text-lg font-semibold text-white">Hyper-Casual Design Matrix</h2>
              <p className="text-sm text-slate-400 mt-1">Comprehensive analysis of game concepts with detailed metrics</p>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-900/50 sticky top-0">
                  <tr>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Game Name</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Type</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Mechanic</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Control</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Camera</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Structure</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Session</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Theme</th>
                    <th className="text-left p-3 text-xs uppercase tracking-[0.1em] text-slate-400 font-medium">Style</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixGames.map((game, index) => (
                    <motion.tr
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      className="border-b border-slate-800/30 hover:bg-slate-900/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-medium text-white">{game.name}</div>
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          game.type.includes('Runner') ? "bg-orange-500/20 text-orange-400" :
                          game.type.includes('Puzzle') ? "bg-green-500/20 text-green-400" :
                          game.type.includes('Arcade') ? "bg-red-500/20 text-red-400" :
                          game.type.includes('Flight') ? "bg-blue-500/20 text-blue-400" :
                          "bg-purple-500/20 text-purple-400"
                        )}>
                          {game.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          game.mechanic.includes('Tap') ? "bg-primary/20 text-primary" :
                          game.mechanic.includes('Drag') ? "bg-green-500/20 text-green-400" :
                          game.mechanic.includes('Aim') ? "bg-purple-500/20 text-purple-400" :
                          "bg-slate-500/20 text-slate-400"
                        )}>
                          {game.mechanic}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-300">{game.control}</td>
                      <td className="p-3 text-xs text-slate-300">{game.camera}</td>
                      <td className="p-3 text-xs text-slate-300">{game.structure}</td>
                      <td className="p-3 text-xs text-slate-300">{game.session}</td>
                      <td className="p-3 text-xs text-slate-300">{game.theme}</td>
                      <td className="p-3 text-xs text-slate-300">{game.style}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-800/50">
              <p className="text-sm text-slate-400">
                Showing sample of hyper-casual game concepts. Full dataset includes CPI targets, retention metrics, and monetization strategies.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-surface/70 backdrop-blur border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-3">Most Common Mechanics</h3>
          <p className="text-sm text-slate-400 mb-2">
            <strong className="text-primary">Tap (38%)</strong> dominates, followed by Swipe (26%) and Drag (24%).
          </p>
          <p className="text-xs text-slate-500">Multi-touch is rare (&lt; 5%)</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-surface/70 backdrop-blur border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-3">Optimal Session Length</h3>
          <p className="text-sm text-slate-400 mb-2">
            <strong className="text-success">2-3 minutes (44%)</strong> is the sweet spot.
          </p>
          <p className="text-xs text-slate-500">Only 8% exceed 10 minutes per session</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-surface/70 backdrop-blur border border-slate-800/50 rounded-2xl p-6"
        >
          <h3 className="font-semibold text-white mb-3">Hook Time Critical</h3>
          <p className="text-sm text-slate-400 mb-2">
            <strong className="text-warning">5 seconds or less (68%)</strong> for engagement.
          </p>
          <p className="text-xs text-slate-500">Most successful games hook within 5s</p>
        </motion.div>
      </div>
    </main>
  );
}
