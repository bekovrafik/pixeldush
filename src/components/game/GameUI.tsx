import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Trophy, ShoppingBag, Volume2, VolumeX, User } from 'lucide-react';
import { GameState } from '@/types/game';

interface GameUIProps {
  gameState: GameState;
  highScore: number;
  isMuted: boolean;
  isLoggedIn: boolean;
  onStart: () => void;
  onPause: () => void;
  onRestart: () => void;
  onRevive: () => void;
  onToggleMute: () => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenAuth: () => void;
}

export function GameUI({
  gameState,
  highScore,
  isMuted,
  isLoggedIn,
  onStart,
  onPause,
  onRestart,
  onRevive,
  onToggleMute,
  onOpenLeaderboard,
  onOpenShop,
  onOpenAuth,
}: GameUIProps) {
  const { isPlaying, isPaused, isGameOver, score, canRevive, hasRevived } = gameState;

  // Start screen
  if (!isPlaying && !isGameOver) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
        <h1 className="font-pixel text-2xl md:text-4xl text-primary neon-glow mb-2">
          PIXEL RUNNER
        </h1>
        <p className="font-pixel text-xs text-muted-foreground mb-8">
          TAP TO JUMP
        </p>

        <div className="flex flex-col gap-4 items-center">
          <Button 
            onClick={onStart}
            className="game-button text-lg px-8 py-4"
          >
            <Play className="w-5 h-5 mr-2" />
            PLAY
          </Button>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenLeaderboard}
              className="border-primary/50 hover:bg-primary/20"
            >
              <Trophy className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenShop}
              className="border-primary/50 hover:bg-primary/20"
            >
              <ShoppingBag className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleMute}
              className="border-primary/50 hover:bg-primary/20"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            {!isLoggedIn && (
              <Button
                variant="outline"
                size="icon"
                onClick={onOpenAuth}
                className="border-primary/50 hover:bg-primary/20"
              >
                <User className="w-5 h-5" />
              </Button>
            )}
          </div>

          {highScore > 0 && (
            <p className="font-pixel text-xs text-accent mt-4">
              HIGH SCORE: {highScore}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Game over screen
  if (isGameOver) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm animate-fade-in">
        <h2 className="font-pixel text-xl md:text-3xl text-destructive mb-2">
          GAME OVER
        </h2>
        
        <div className="bg-card/50 rounded-lg p-6 mb-6 text-center">
          <p className="font-pixel text-xs text-muted-foreground mb-1">SCORE</p>
          <p className="font-pixel text-2xl text-primary neon-glow">{score}</p>
          
          {score > highScore && highScore > 0 && (
            <p className="font-pixel text-xs text-accent mt-2 animate-pulse">
              NEW HIGH SCORE!
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 items-center">
          {canRevive && !hasRevived && (
            <Button
              onClick={onRevive}
              className="game-button bg-accent text-accent-foreground"
            >
              <Play className="w-4 h-4 mr-2" />
              REVIVE (WATCH AD)
            </Button>
          )}

          <Button
            onClick={onRestart}
            className="game-button"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            TRY AGAIN
          </Button>

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenLeaderboard}
              className="border-primary/50"
            >
              <Trophy className="w-4 h-4 mr-1" />
              LEADERBOARD
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenShop}
              className="border-primary/50"
            >
              <ShoppingBag className="w-4 h-4 mr-1" />
              SHOP
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // In-game UI
  if (isPlaying) {
    return (
      <div className="absolute top-4 left-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPause}
          className="bg-background/50 hover:bg-background/80"
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMute}
          className="bg-background/50 hover:bg-background/80"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>
    );
  }

  return null;
}
