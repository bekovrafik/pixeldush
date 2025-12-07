import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Trophy, ShoppingBag, Volume2, VolumeX, User, Gift, Award, Globe, Users, Share2, Settings, BarChart3, Crown, Home, Coins, Target, RotateCw, Star, Swords } from 'lucide-react';
import { GameState, WORLD_CONFIGS } from '@/types/game';
import { useNavigate } from 'react-router-dom';

interface GameUIProps {
  gameState: GameState;
  highScore: number;
  isMuted: boolean;
  isLoggedIn: boolean;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
  onRevive: () => void;
  onGoHome: () => void;
  onToggleMute: () => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenAuth: () => void;
  onOpenAchievements: () => void;
  onOpenDailyReward: () => void;
  onOpenWorlds: () => void;
  onOpenFriends: () => void;
  onShareScore: () => void;
  onOpenSettings: () => void;
  onOpenIAPShop: () => void;
  onOpenCoinStore: () => void;
  onOpenDailyChallenges: () => void;
  onOpenSpinWheel: () => void;
  onOpenBattlePass: () => void;
  onOpenBossCollection: () => void;
}

export function GameUI({
  gameState, highScore, isMuted, isLoggedIn,
  onStart, onPause, onRestart, onRevive, onGoHome, onToggleMute,
  onOpenLeaderboard, onOpenShop, onOpenAuth, onOpenAchievements, onOpenDailyReward, onOpenWorlds, onOpenFriends, onShareScore, onOpenSettings, onOpenIAPShop, onOpenCoinStore, onOpenDailyChallenges, onOpenSpinWheel, onOpenBattlePass, onOpenBossCollection,
}: GameUIProps) {
  const { isPlaying, isPaused, isGameOver, score, coins, canRevive, hasRevived, world } = gameState;
  const navigate = useNavigate();

  if (!isPlaying && !isGameOver) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
        <h1 className="font-pixel text-xl sm:text-2xl md:text-4xl text-primary neon-glow mb-1 text-center">
          PIXEL RUNNER
        </h1>
        <p className="font-pixel text-[8px] sm:text-xs text-muted-foreground mb-4 sm:mb-6">
          TAP TO JUMP
        </p>

        <Button onClick={onStart} className="game-button text-sm sm:text-lg px-6 sm:px-8 py-3 sm:py-4 mb-4">
          <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          PLAY
        </Button>

        <div className="grid grid-cols-5 gap-2 sm:gap-3 max-w-sm sm:max-w-none">
          <Button variant="outline" size="icon" onClick={onOpenDailyReward} className="border-accent/50 hover:bg-accent/20 w-10 h-10 sm:w-11 sm:h-11" title="Daily Rewards">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenDailyChallenges} className="border-orange-500/50 hover:bg-orange-500/20 w-10 h-10 sm:w-11 sm:h-11" title="Daily Challenges">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenSpinWheel} className="border-purple-500/50 hover:bg-purple-500/20 w-10 h-10 sm:w-11 sm:h-11" title="Spin Wheel">
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenBattlePass} className="border-cyan-500/50 hover:bg-cyan-500/20 w-10 h-10 sm:w-11 sm:h-11" title="Battle Pass">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenBossCollection} className="border-red-500/50 hover:bg-red-500/20 w-10 h-10 sm:w-11 sm:h-11" title="Boss Collection">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenAchievements} className="border-primary/50 hover:bg-primary/20 w-10 h-10 sm:w-11 sm:h-11" title="Achievements">
            <Award className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenLeaderboard} className="border-primary/50 hover:bg-primary/20 w-10 h-10 sm:w-11 sm:h-11" title="Leaderboard">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenFriends} className="border-secondary/50 hover:bg-secondary/20 w-10 h-10 sm:w-11 sm:h-11" title="Friends">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenWorlds} className="border-secondary/50 hover:bg-secondary/20 w-10 h-10 sm:w-11 sm:h-11" title="Worlds">
            <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenShop} className="border-primary/50 hover:bg-primary/20 w-10 h-10 sm:w-11 sm:h-11" title="Shop">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenIAPShop} className="border-accent/50 hover:bg-accent/20 w-10 h-10 sm:w-11 sm:h-11" title="Premium Store">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenCoinStore} className="border-yellow-500/50 hover:bg-yellow-500/20 w-10 h-10 sm:w-11 sm:h-11" title="Free Coins">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate('/stats')} className="border-accent/50 hover:bg-accent/20 w-10 h-10 sm:w-11 sm:h-11" title="Stats">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </Button>
          <Button variant="outline" size="icon" onClick={onOpenSettings} className="border-primary/50 hover:bg-primary/20 w-10 h-10 sm:w-11 sm:h-11" title="Settings">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={onToggleMute} className="border-primary/50 hover:bg-primary/20 w-10 h-10 sm:w-11 sm:h-11" title="Sound">
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
          </Button>
          {!isLoggedIn && (
            <Button variant="outline" size="icon" onClick={onOpenAuth} className="border-primary/50 hover:bg-primary/20 w-10 h-10 sm:w-11 sm:h-11" title="Sign In">
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-1">
          {highScore > 0 && <p className="font-pixel text-[10px] sm:text-xs text-accent">HIGH SCORE: {highScore}</p>}
          <p className="font-pixel text-[8px] sm:text-[10px] text-secondary">{WORLD_CONFIGS[world].name}</p>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in p-4">
        <h2 className="font-pixel text-lg sm:text-xl md:text-3xl text-destructive mb-2">GAME OVER</h2>
        
        <div className="bg-card/50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 text-center">
          <p className="font-pixel text-[10px] sm:text-xs text-muted-foreground mb-1">SCORE</p>
          <p className="font-pixel text-xl sm:text-2xl text-primary neon-glow">{score}</p>
          <p className="font-pixel text-[10px] sm:text-xs text-accent mt-1">+{coins} 🪙</p>
          {score > highScore && highScore > 0 && (
            <p className="font-pixel text-[10px] sm:text-xs text-accent mt-2 animate-pulse">NEW HIGH SCORE!</p>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:gap-3 items-center w-full max-w-xs">
          {canRevive && !hasRevived && (
            <Button onClick={onRevive} className="game-button bg-accent text-accent-foreground w-full text-xs sm:text-sm py-3">
              <Play className="w-4 h-4 mr-2" />
              REVIVE (WATCH AD)
            </Button>
          )}
          <div className="flex gap-2 sm:gap-3 w-full">
            <Button onClick={onRestart} className="game-button flex-1 text-xs sm:text-sm py-3">
              <RotateCcw className="w-4 h-4 mr-1 sm:mr-2" />
              RETRY
            </Button>
            <Button onClick={onGoHome} variant="outline" className="flex-1 border-primary/50 text-xs sm:text-sm py-3">
              <Home className="w-4 h-4 mr-1 sm:mr-2" />
              HOME
            </Button>
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={onShareScore} className="flex-1 border-accent/50 text-[10px] sm:text-xs h-9">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              SHARE
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenLeaderboard} className="flex-1 border-primary/50 text-[10px] sm:text-xs h-9">
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              SCORES
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenShop} className="flex-1 border-primary/50 text-[10px] sm:text-xs h-9">
              <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              SHOP
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" onClick={onPause} className="bg-background/50 hover:bg-background/80 w-8 h-8 sm:w-10 sm:h-10">
          {isPaused ? <Play className="w-4 h-4 sm:w-5 sm:h-5" /> : <Pause className="w-4 h-4 sm:w-5 sm:h-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleMute} className="bg-background/50 hover:bg-background/80 w-8 h-8 sm:w-10 sm:h-10">
          {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
        </Button>
      </div>
    );
  }

  return null;
}
