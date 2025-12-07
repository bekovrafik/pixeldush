import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Zap, Calendar, CalendarDays, Gift, Check, Lock } from 'lucide-react';
import { BossRushChallenge, UserBossRushChallengeProgress } from '@/hooks/useBossRushChallenges';

interface BossRushChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: BossRushChallenge[];
  progress: UserBossRushChallengeProgress[];
  loading: boolean;
  onClaimReward: (progressId: string) => void;
  isLoggedIn: boolean;
  onOpenAuth: () => void;
}

export function BossRushChallengesModal({
  isOpen,
  onClose,
  challenges,
  progress,
  loading,
  onClaimReward,
  isLoggedIn,
  onOpenAuth,
}: BossRushChallengesModalProps) {
  const dailyChallenges = challenges.filter(c => c.challenge_type === 'daily');
  const weeklyChallenges = challenges.filter(c => c.challenge_type === 'weekly');

  const getProgress = (challengeId: string) => {
    return progress.find(p => p.challenge_id === challengeId);
  };

  const renderChallenge = (challenge: BossRushChallenge) => {
    const userProgress = getProgress(challenge.id);
    const currentValue = userProgress?.current_progress || 0;
    const progressPercent = Math.min((currentValue / challenge.requirement_value) * 100, 100);
    const isCompleted = userProgress?.is_completed || false;
    const isClaimed = userProgress?.is_claimed || false;

    return (
      <div
        key={challenge.id}
        className={`p-4 rounded-lg border transition-all ${
          isClaimed
            ? 'bg-muted/30 border-muted opacity-60'
            : isCompleted
            ? 'bg-accent/10 border-accent/30 animate-pulse'
            : 'bg-card/50 border-border hover:border-primary/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{challenge.icon}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-pixel text-xs text-foreground">{challenge.title}</h4>
              {isClaimed && <Check className="w-3.5 h-3.5 text-green-500" />}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{challenge.description}</p>
            
            <div className="mt-2">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">
                  {currentValue} / {challenge.requirement_value}
                </span>
                <span className="text-[10px] text-accent flex items-center gap-1">
                  <Gift className="w-3 h-3" />
                  {challenge.reward_coins} 🪙 + {challenge.reward_xp} XP
                </span>
              </div>
            </div>
          </div>

          {isCompleted && !isClaimed && (
            <Button
              size="sm"
              className="font-pixel text-[10px] bg-accent hover:bg-accent/80"
              onClick={() => onClaimReward(userProgress!.id)}
            >
              Claim
            </Button>
          )}
        </div>
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-background/95 border-primary/30">
          <DialogHeader>
            <DialogTitle className="font-pixel text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-red-500" />
              Boss Rush Challenges
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-8">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-pixel text-xs text-muted-foreground mb-4">
              Sign in to track your Boss Rush challenges!
            </p>
            <Button onClick={onOpenAuth} className="font-pixel text-xs">
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 border-primary/30">
        <DialogHeader>
          <DialogTitle className="font-pixel text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-red-500" />
            Boss Rush Challenges
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="daily" className="font-pixel text-xs flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="font-pixel text-xs flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                Weekly
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily">
              <ScrollArea className="h-[320px]">
                <div className="space-y-3 pr-4">
                  {dailyChallenges.map(renderChallenge)}
                  {dailyChallenges.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-8">
                      No daily challenges available
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="weekly">
              <ScrollArea className="h-[320px]">
                <div className="space-y-3 pr-4">
                  {weeklyChallenges.map(renderChallenge)}
                  {weeklyChallenges.length === 0 && (
                    <p className="text-center text-muted-foreground text-xs py-8">
                      No weekly challenges available
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        <Button onClick={onClose} variant="outline" className="w-full mt-2 font-pixel text-xs">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
