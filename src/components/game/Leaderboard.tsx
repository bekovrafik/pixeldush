import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Award } from 'lucide-react';
import { LeaderboardEntry } from '@/types/game';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  loading: boolean;
  currentProfileId?: string;
}

export function Leaderboard({ isOpen, onClose, entries, loading, currentProfileId }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center font-pixel text-xs text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-400/10 border-yellow-400/30';
      case 2:
        return 'bg-gray-400/10 border-gray-400/30';
      case 3:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-card/50 border-border';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            LEADERBOARD
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="font-pixel text-xs text-muted-foreground animate-pulse">
                LOADING...
              </div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Trophy className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="font-pixel text-xs text-muted-foreground">
                NO SCORES YET
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to set a high score!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(index + 1)} ${
                    entry.profiles?.username === currentProfileId ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-pixel text-xs text-foreground truncate">
                      {entry.profiles?.username || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-pixel text-sm text-primary">
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.distance.toLocaleString()}m
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
