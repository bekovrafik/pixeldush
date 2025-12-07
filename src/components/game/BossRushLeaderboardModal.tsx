import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Timer, Infinity, Crown, Zap } from 'lucide-react';
import { BossRushScore } from '@/hooks/useBossRushLeaderboard';

interface BossRushLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  rushScores: BossRushScore[];
  endlessScores: BossRushScore[];
  loading: boolean;
  currentProfileId?: string;
  vipUserIds?: string[];
}

export function BossRushLeaderboardModal({
  isOpen,
  onClose,
  rushScores,
  endlessScores,
  loading,
  currentProfileId,
  vipUserIds = [],
}: BossRushLeaderboardModalProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const renderScoreList = (scores: BossRushScore[], isEndless: boolean) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
        </div>
      );
    }

    if (scores.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-pixel text-xs">No scores yet!</p>
          <p className="text-[10px] mt-1">Be the first to complete {isEndless ? 'Endless Mode' : 'Boss Rush'}!</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {scores.map((score, index) => {
            const isCurrentUser = score.profile_id === currentProfileId;
            const isVip = vipUserIds.includes(score.profile_id);

            return (
              <div
                key={score.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrentUser
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-card/50 hover:bg-card/80'
                }`}
              >
                <div className="w-8 text-center font-pixel text-xs">
                  {getRankEmoji(index + 1)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-pixel text-xs truncate">
                      {score.profiles?.username || 'Unknown'}
                    </span>
                    {isVip && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Score: {score.total_score.toLocaleString()}
                  </div>
                </div>

                <div className="text-right">
                  {isEndless ? (
                    <div className="font-pixel text-sm text-accent">
                      {score.bosses_defeated} 👹
                    </div>
                  ) : (
                    <div className="font-pixel text-sm text-primary">
                      {formatTime(score.completion_time_seconds)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" />
            Boss Rush Leaderboard
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="rush" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="rush" className="font-pixel text-xs flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Speed Rush
            </TabsTrigger>
            <TabsTrigger value="endless" className="font-pixel text-xs flex items-center gap-1.5">
              <Infinity className="w-3.5 h-3.5" />
              Endless
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rush">
            <div className="text-center mb-3">
              <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Timer className="w-3 h-3" />
                Fastest completion times
              </p>
            </div>
            {renderScoreList(rushScores, false)}
          </TabsContent>

          <TabsContent value="endless">
            <div className="text-center mb-3">
              <p className="text-[10px] text-muted-foreground">
                Most bosses defeated in Endless Mode
              </p>
            </div>
            {renderScoreList(endlessScores, true)}
          </TabsContent>
        </Tabs>

        <Button onClick={onClose} variant="outline" className="w-full mt-2 font-pixel text-xs">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
