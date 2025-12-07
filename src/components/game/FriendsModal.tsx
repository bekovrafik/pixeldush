import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, UserPlus, Check, X, Trash2, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface FriendWithProfile {
  id: string;
  friendId: string;
  username: string;
  high_score: number;
  status: 'pending' | 'accepted' | 'rejected';
  isRequester: boolean;
}

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: FriendWithProfile[];
  pendingRequests: FriendWithProfile[];
  loading: boolean;
  isLoggedIn: boolean;
  onSendRequest: (username: string) => Promise<{ error: Error | null }>;
  onAccept: (id: string) => Promise<{ error: any }>;
  onReject: (id: string) => Promise<{ error: any }>;
  onRemove: (id: string) => Promise<{ error: any }>;
  onOpenAuth: () => void;
}

export function FriendsModal({
  isOpen, onClose, friends, pendingRequests, loading, isLoggedIn,
  onSendRequest, onAccept, onReject, onRemove, onOpenAuth,
}: FriendsModalProps) {
  const [username, setUsername] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendRequest = async () => {
    if (!username.trim()) return;
    setSending(true);
    const { error } = await onSendRequest(username.trim());
    setSending(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Friend request sent!');
      setUsername('');
    }
  };

  const incomingRequests = pendingRequests.filter(r => !r.isRequester);
  const outgoingRequests = pendingRequests.filter(r => r.isRequester);

  if (!isLoggedIn) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm bg-card border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
              <Users className="w-5 h-5" />
              FRIENDS
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="font-pixel text-xs text-muted-foreground mb-4">
              Sign in to add friends!
            </p>
            <Button onClick={onOpenAuth} className="game-button text-xs">
              SIGN IN
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg text-primary flex items-center gap-2">
            <Users className="w-5 h-5" />
            FRIENDS
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter username..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
            className="font-pixel text-xs"
          />
          <Button
            onClick={handleSendRequest}
            disabled={sending || !username.trim()}
            size="sm"
            className="game-button text-xs"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        <ScrollArea className="h-[350px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="font-pixel text-xs text-muted-foreground animate-pulse">
                LOADING...
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingRequests.length > 0 && (
                <div>
                  <h3 className="font-pixel text-[10px] text-accent mb-2">FRIEND REQUESTS</h3>
                  <div className="space-y-2">
                    {incomingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-accent/10 border-accent/30"
                      >
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="font-pixel text-xs text-accent">
                            {request.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-pixel text-xs text-foreground truncate">
                            {request.username}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onAccept(request.id)}
                          className="h-8 w-8 text-green-500 hover:text-green-400"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onReject(request.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {outgoingRequests.length > 0 && (
                <div>
                  <h3 className="font-pixel text-[10px] text-muted-foreground mb-2">PENDING</h3>
                  <div className="space-y-2">
                    {outgoingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 border-border opacity-60"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="font-pixel text-xs text-muted-foreground">
                            {request.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-pixel text-xs text-foreground truncate">
                            {request.username}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Pending...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-pixel text-[10px] text-primary mb-2">
                  FRIENDS ({friends.length})
                </h3>
                {friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Add friends by username!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends
                      .sort((a, b) => b.high_score - a.high_score)
                      .map((friend) => (
                        <div
                          key={friend.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 border-border"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-pixel text-xs text-primary">
                              {friend.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-pixel text-xs text-foreground truncate">
                              {friend.username}
                            </p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Trophy className="w-3 h-3" />
                              {friend.high_score.toLocaleString()}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRemove(friend.id)}
                            className="h-8 w-8 text-destructive/60 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
