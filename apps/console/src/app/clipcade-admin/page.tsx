'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, X, Play, Calendar, User } from 'lucide-react';

interface ClipcadeGame {
  id: string;
  title: string;
  description: string;
  theme: string;
  game_type: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  metadata: {
    file_size?: number;
    engine?: string;
    target_resolution?: string;
    visual_hook?: string;
    control_type?: string;
  };
  html_content: string;
}

export default function ClipcadeAdminPage() {
  const [games, setGames] = useState<ClipcadeGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingGame, setPlayingGame] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from('clipcade_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching games:', error);
        return;
      }

      setGames(data || []);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('clipcade_games')
        .update({ 
          status: 'approved', 
          approved_at: new Date().toISOString(),
          approved_by: 'Admin' 
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error approving game:', error);
        alert('Failed to approve game');
        return;
      }

      alert('Game approved and added to feed!');
      fetchGames(); // Refresh the list
    } catch (error) {
      console.error('Failed to approve game:', error);
      alert('Error approving game');
    }
  };

  const handleReject = async (gameId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('clipcade_games')
        .update({ 
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: `Admin (Reason: ${reason})`
        })
        .eq('id', gameId);

      if (error) {
        console.error('Error rejecting game:', error);
        alert('Failed to reject game');
        return;
      }

      alert('Game rejected');
      fetchGames(); // Refresh the list
    } catch (error) {
      console.error('Failed to reject game:', error);
      alert('Error rejecting game');
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-8 py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading games...</p>
        </div>
      </main>
    );
  }

  const pendingGames = games.filter(g => g.status === 'pending');
  const approvedGames = games.filter(g => g.status === 'approved');

  return (
    <>
      <main className="mx-auto max-w-7xl px-8 py-12">
        <header className="mb-8">
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
            <a href="/" className="hover:text-primary transition-colors">Console</a>
            <span>/</span>
            <span>Clipcade Admin</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">Clipcade Game Management</h1>
              <p className="text-slate-300 mt-2">
                Review and manage games uploaded from the multiagent builder
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-full bg-warning/20 text-warning border border-warning/40 text-sm font-medium">
                {pendingGames.length} pending
              </div>
              <div className="px-4 py-2 rounded-full bg-success/20 text-success border border-success/40 text-sm font-medium">
                {approvedGames.length} approved
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-8">
          {/* Pending Games */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              Pending Approval ({pendingGames.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingGames.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onPlay={setPlayingGame}
                />
              ))}
            </div>
            {pendingGames.length === 0 && (
              <p className="text-slate-400 text-center py-8">No pending games</p>
            )}
          </section>

          {/* Approved Games */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              Approved Games ({approvedGames.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {approvedGames.slice(0, 6).map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onPlay={setPlayingGame}
                />
              ))}
            </div>
            {approvedGames.length === 0 && (
              <p className="text-slate-400 text-center py-8">No approved games</p>
            )}
          </section>
        </div>
      </main>

      {/* Game Player Modal */}
      {playingGame && (
        <GamePlayerModal 
          game={games.find(g => g.id === playingGame)!}
          onClose={() => setPlayingGame(null)}
        />
      )}
    </>
  );
}

function GameCard({ 
  game, 
  onApprove, 
  onReject, 
  onPlay 
}: { 
  game: ClipcadeGame; 
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onPlay: (id: string) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-warning/30 bg-warning/5';
      case 'approved': return 'border-success/30 bg-success/5';
      case 'rejected': return 'border-red-500/30 bg-red-500/5';
      default: return 'border-slate-700 bg-slate-800/30';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    return `${Math.round(bytes / 1024)}KB`;
  };

  return (
    <div className={`rounded-xl border ${getStatusColor(game.status)} p-6 backdrop-blur`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-medium text-white">{game.title}</h3>
          <p className="text-sm text-slate-400">{game.theme} • {game.game_type}</p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${
          game.status === 'pending' ? 'bg-warning/20 text-warning' :
          game.status === 'approved' ? 'bg-success/20 text-success' :
          'bg-red-500/20 text-red-400'
        }`}>
          {game.status}
        </div>
      </div>

      <p className="text-sm text-slate-300 mb-4 line-clamp-2">
        {game.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
        <span>{formatFileSize(game.metadata.file_size)}</span>
        <span>{game.metadata.engine || 'HTML5'}</span>
        <span>{game.metadata.control_type || 'Touch'}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
        <Calendar className="h-3 w-3" />
        <span>{new Date(game.created_at).toLocaleDateString()}</span>
        {game.approved_by && (
          <>
            <User className="h-3 w-3 ml-2" />
            <span>{game.approved_by}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => onPlay(game.id)}
          className="px-3 py-1.5 bg-primary/20 text-primary rounded-lg text-sm font-medium hover:bg-primary/30 transition-colors flex items-center gap-1"
        >
          <Play className="h-3 w-3" />
          Play
        </button>

        {game.status === 'pending' && onApprove && onReject && (
          <>
            <button 
              onClick={() => onApprove(game.id)}
              className="px-3 py-1.5 bg-success/20 text-success rounded-lg text-sm font-medium hover:bg-success/30 transition-colors flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3" />
              Approve
            </button>
            <button 
              onClick={() => onReject(game.id)}
              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function GamePlayerModal({ 
  game, 
  onClose 
}: { 
  game: ClipcadeGame; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-slate-700 rounded-xl w-full max-w-md h-[600px] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h3 className="font-medium text-white">{game.title}</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex-1 p-4">
          <iframe
            srcDoc={game.html_content}
            className="w-full h-full rounded-lg border border-slate-700"
            title={game.title}
          />
        </div>
      </div>
    </div>
  );
}
