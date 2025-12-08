import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Trophy, ShoppingBag, Settings, Gift, Crown, Zap, Target, Star, Swords, Users, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { WORLD_CONFIGS, WorldTheme } from '@/types/game';
import { hapticsManager } from '@/lib/hapticsManager';

interface MobileHomeScreenProps {
  highScore: number;
  currentWorld: WorldTheme;
  coins: number;
  isVip: boolean;
  isMuted: boolean;
  rushModeEnabled: boolean;
  endlessModeEnabled: boolean;
  username?: string;
  onStart: () => void;
  onToggleRushMode: () => void;
  onToggleEndlessMode: () => void;
  onOpenLeaderboard: () => void;
  onOpenShop: () => void;
  onOpenSettings: () => void;
  onOpenDailyReward: () => void;
  onOpenVip: () => void;
  onOpenDailyChallenges: () => void;
  onOpenBattlePass: () => void;
  onOpenBossCollection: () => void;
  onOpenFriends: () => void;
  onToggleMute: () => void;
  onOpenStats: () => void;
}

type GameMode = 'normal' | 'rush' | 'endless';

const GAME_MODES: { id: GameMode; name: string; icon: React.ReactNode; color: string; description: string }[] = [
  { id: 'normal', name: 'CLASSIC', icon: <Play className="w-8 h-8" />, color: 'from-primary to-primary/80', description: 'Standard gameplay' },
  { id: 'rush', name: 'RUSH', icon: <Zap className="w-8 h-8" />, color: 'from-red-600 to-orange-500', description: 'No breaks • 1.5x rewards!' },
  { id: 'endless', name: 'ENDLESS', icon: <span className="text-2xl">♾️</span>, color: 'from-purple-600 to-pink-500', description: 'Infinite bosses • Survive!' },
];

export function MobileHomeScreen({
  highScore,
  currentWorld,
  coins,
  isVip,
  rushModeEnabled,
  endlessModeEnabled,
  username,
  onStart,
  onToggleRushMode,
  onToggleEndlessMode,
  onOpenLeaderboard,
  onOpenShop,
  onOpenSettings,
  onOpenDailyReward,
  onOpenVip,
  onOpenDailyChallenges,
  onOpenBattlePass,
  onOpenBossCollection,
  onOpenFriends,
  onOpenStats,
}: MobileHomeScreenProps) {
  const [currentModeIndex, setCurrentModeIndex] = useState(
    rushModeEnabled ? 1 : endlessModeEnabled ? 2 : 0
  );
  
  // Swipe gesture handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous mode
        navigateMode(-1);
      } else {
        // Swipe left - next mode
        navigateMode(1);
      }
    }
    
    touchStartRef.current = null;
  }, []);

  const navigateMode = useCallback((direction: number) => {
    const newIndex = Math.max(0, Math.min(GAME_MODES.length - 1, currentModeIndex + direction));
    if (newIndex !== currentModeIndex) {
      setCurrentModeIndex(newIndex);
      hapticsManager.lightImpact();
      
      // Update game mode
      const newMode = GAME_MODES[newIndex].id;
      if (newMode === 'rush' && !rushModeEnabled) {
        onToggleRushMode();
      } else if (newMode === 'endless' && !endlessModeEnabled) {
        onToggleEndlessMode();
      } else if (newMode === 'normal') {
        if (rushModeEnabled) onToggleRushMode();
        if (endlessModeEnabled) onToggleEndlessMode();
      }
    }
  }, [currentModeIndex, rushModeEnabled, endlessModeEnabled, onToggleRushMode, onToggleEndlessMode]);

  const handlePlayPress = useCallback(() => {
    hapticsManager.mediumImpact();
    onStart();
  }, [onStart]);

  const handleButtonPress = useCallback((callback: () => void) => {
    hapticsManager.lightImpact();
    callback();
  }, []);

  const currentMode = GAME_MODES[currentModeIndex];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background via-background to-card flex flex-col overflow-hidden">
      {/* Status Bar */}
      <div className="safe-area-top" />
      <header className="flex justify-between items-center px-4 py-3 bg-card/50 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-2">
          {isVip && (
            <div className="px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center gap-1">
              <Crown className="w-3 h-3 text-black" />
              <span className="font-pixel text-[8px] text-black">VIP</span>
            </div>
          )}
          {username && (
            <span className="text-xs text-muted-foreground">{username}</span>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
          <span className="text-yellow-500">🪙</span>
          <span className="font-pixel text-xs text-foreground">{coins}</span>
        </div>
      </header>

      {/* Main Content */}
      <main 
        ref={containerRef}
        className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Game Title */}
        <div className="text-center">
          <h1 className="font-pixel text-2xl sm:text-3xl text-primary neon-glow mb-1">
            PIXEL RUNNER
          </h1>
          <p className="text-xs text-muted-foreground">
            {WORLD_CONFIGS[currentWorld].name}
          </p>
          {highScore > 0 && (
            <p className="font-pixel text-xs text-accent mt-1">
              🏆 {highScore}
            </p>
          )}
        </div>

        {/* Game Mode Carousel */}
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-4">
            {/* Left Arrow */}
            <button
              onClick={() => navigateMode(-1)}
              disabled={currentModeIndex === 0}
              className="w-10 h-10 rounded-full bg-card/50 border border-border/50 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Mode Card */}
            <div 
              className={`flex-1 p-6 rounded-2xl bg-gradient-to-br ${currentMode.color} shadow-2xl transform transition-all duration-300`}
            >
              <div className="flex flex-col items-center gap-2 text-white">
                {currentMode.icon}
                <span className="font-pixel text-lg">{currentMode.name}</span>
                <span className="text-xs opacity-80">{currentMode.description}</span>
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => navigateMode(1)}
              disabled={currentModeIndex === GAME_MODES.length - 1}
              className="w-10 h-10 rounded-full bg-card/50 border border-border/50 flex items-center justify-center disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Mode Indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {GAME_MODES.map((mode, index) => (
              <button
                key={mode.id}
                onClick={() => {
                  const diff = index - currentModeIndex;
                  if (diff !== 0) navigateMode(diff);
                }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentModeIndex 
                    ? 'bg-primary scale-125' 
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Swipe Hint */}
          <p className="text-center text-[10px] text-muted-foreground mt-2 animate-pulse">
            ← Swipe to change mode →
          </p>
        </div>

        {/* Play Button */}
        <Button 
          onClick={handlePlayPress} 
          className={`w-full max-w-xs h-16 text-lg rounded-xl shadow-2xl bg-gradient-to-r ${currentMode.color} hover:opacity-90 transition-all active:scale-95 border-2 border-white/20`}
        >
          <Play className="w-6 h-6 mr-3" />
          PLAY
        </Button>
      </main>

      {/* Quick Action Grid */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-5 gap-2">
          <QuickButton icon={Gift} color="accent" onClick={() => handleButtonPress(onOpenDailyReward)} label="Daily" />
          <QuickButton icon={Target} color="orange" onClick={() => handleButtonPress(onOpenDailyChallenges)} label="Tasks" />
          <QuickButton icon={Star} color="cyan" onClick={() => handleButtonPress(onOpenBattlePass)} label="Pass" />
          <QuickButton icon={Swords} color="red" onClick={() => handleButtonPress(onOpenBossCollection)} label="Boss" />
          <QuickButton icon={Users} color="secondary" onClick={() => handleButtonPress(onOpenFriends)} label="Friends" />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-t border-border/50 px-4 py-2 pb-safe">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <NavButton icon={Trophy} label="Ranks" onClick={() => handleButtonPress(onOpenLeaderboard)} />
          <NavButton icon={ShoppingBag} label="Shop" onClick={() => handleButtonPress(onOpenShop)} />
          <NavButton 
            icon={Crown} 
            label={isVip ? "VIP" : "Get VIP"} 
            onClick={() => handleButtonPress(onOpenVip)}
            highlight={!isVip}
          />
          <NavButton icon={BarChart3} label="Stats" onClick={() => handleButtonPress(onOpenStats)} />
          <NavButton icon={Settings} label="Settings" onClick={() => handleButtonPress(onOpenSettings)} />
        </div>
      </nav>
    </div>
  );
}

interface QuickButtonProps {
  icon: React.ElementType;
  color: string;
  onClick: () => void;
  label: string;
}

function QuickButton({ icon: Icon, color, onClick, label }: QuickButtonProps) {
  const colorClasses: Record<string, string> = {
    accent: 'border-accent/50 hover:bg-accent/20 text-accent',
    orange: 'border-orange-500/50 hover:bg-orange-500/20 text-orange-500',
    cyan: 'border-cyan-500/50 hover:bg-cyan-500/20 text-cyan-500',
    red: 'border-red-500/50 hover:bg-red-500/20 text-red-500',
    secondary: 'border-secondary/50 hover:bg-secondary/20 text-secondary',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border bg-card/50 transition-all active:scale-95 min-h-[60px] ${colorClasses[color]}`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="font-pixel text-[7px] text-muted-foreground">{label}</span>
    </button>
  );
}

interface NavButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  highlight?: boolean;
}

function NavButton({ icon: Icon, label, onClick, highlight }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95 min-w-[56px] ${
        highlight 
          ? 'text-yellow-500 bg-yellow-500/10' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="w-6 h-6 mb-0.5" />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}
