import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Award, Users, Globe } from 'lucide-react';
import { LeaderboardEntry } from '@/types/game';
import { formatDistanceToNow } from 'date-fns';

interface FriendWithProfile {
  id: string;
  friendId: string;
  username: string;
  high_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  isRequester: boolean;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  loading: boolean;
  currentProfileId?: string;
  friends?: FriendWithProfile[];
}

export function Leaderboard({ isOpen, onClose, entries, loading, currentProfileId, friends = [] }: LeaderboardProps) {
  const [showFriendsOnly, setShowFriendsOnly] = useState(false);

  const friendIds = new Set(friends.map(f => f.friendId));

  const filteredEntries = showFriendsOnly
    ? entries.filter(entry => {
        // Find if this entry belongs to a friend by matching username
        const friend = friends.find(f => f.username === entry.profiles?.username);
        return friend || entry.profiles?.username === currentProfileId;
      })
    : entries;

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

        {friends.length > 0 && (
          <div className="flex gap-2 mb-2">
            <Button
              variant={showFriendsOnly ? 'outline' : 'default'}
              size="sm"
              onClick={() => setShowFriendsOnly(false)}
              className={`flex-1 text-xs ${!showFriendsOnly ? 'game-button' : 'border-primary/50'}`}
            >
              <Globe className="w-3 h-3 mr-1" />
              GLOBAL
            </Button>
            <Button
              variant={showFriendsOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowFriendsOnly(true)}
              className={`flex-1 text-xs ${showFriendsOnly ? 'game-button' : 'border-primary/50'}`}
            >
              <Users className="w-3 h-3 mr-1" />
              FRIENDS
            </Button>
          </div>
        )}

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="font-pixel text-xs text-muted-foreground animate-pulse">
                LOADING...
              </div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Trophy className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="font-pixel text-xs text-muted-foreground">
                {showFriendsOnly ? 'NO FRIEND SCORES YET' : 'NO SCORES YET'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {showFriendsOnly ? 'Add friends to see their scores!' : 'Be the first to set a high score!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry, index) => (
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
