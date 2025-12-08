import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Trophy, ShoppingBag, Settings, Gift, Crown, Zap, Target, Star, Swords, Users, BarChart3, Volume2, VolumeX } from 'lucide-react';
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

const GAME_MODES: { id: GameMode; name: string; icon: React.ReactNode; color: string; bgColor: string; description: string }[] = [
  { id: 'normal', name: 'CLASSIC', icon: <Play className="w-4 h-4" />, color: 'text-primary', bgColor: 'bg-primary', description: 'Normal Speed' },
  { id: 'rush', name: 'RUSH', icon: <Zap className="w-4 h-4" />, color: 'text-orange-500', bgColor: 'bg-orange-500', description: 'Fast & 1.5x Coins!' },
  { id: 'endless', name: 'ENDLESS', icon: <span className="text-sm">♾️</span>, color: 'text-purple-500', bgColor: 'bg-purple-500', description: 'Infinite Bosses!' },
];

export function MobileHomeScreen({
  highScore,
  currentWorld,
  coins,
  isVip,
  isMuted,
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
  onToggleMute,
  onOpenStats,
}: MobileHomeScreenProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>(
    rushModeEnabled ? 'rush' : endlessModeEnabled ? 'endless' : 'normal'
  );

  const handleModeSelect = useCallback((mode: GameMode) => {
    setSelectedMode(mode);
    hapticsManager.lightImpact();
    
    // Update game mode based on selection
    if (mode === 'rush') {
      if (!rushModeEnabled) onToggleRushMode();
      if (endlessModeEnabled) onToggleEndlessMode();
    } else if (mode === 'endless') {
      if (rushModeEnabled) onToggleRushMode();
      if (!endlessModeEnabled) onToggleEndlessMode();
    } else {
      if (rushModeEnabled) onToggleRushMode();
      if (endlessModeEnabled) onToggleEndlessMode();
    }
  }, [rushModeEnabled, endlessModeEnabled, onToggleRushMode, onToggleEndlessMode]);

  const handlePlayPress = useCallback(() => {
    hapticsManager.mediumImpact();
    onStart();
  }, [onStart]);

  const handleButtonPress = useCallback((callback: () => void) => {
    hapticsManager.lightImpact();
    callback();
  }, []);

  const currentMode = GAME_MODES.find(m => m.id === selectedMode) || GAME_MODES[0];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background via-background to-card/80 flex flex-col overflow-hidden">
      {/* Safe Area Top */}
      <div className="safe-area-top" />
      
      {/* Top Header Bar */}
      <header className="flex justify-between items-center px-4 py-3">
        {/* Left: Profile/VIP */}
        <div className="flex items-center gap-2">
          {isVip ? (
            <button 
              onClick={() => handleButtonPress(onOpenVip)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/40"
            >
              <Crown className="w-4 h-4 text-yellow-500" />
              <span className="font-pixel text-[10px] text-yellow-500">VIP</span>
            </button>
          ) : (
            <button 
              onClick={() => handleButtonPress(onOpenVip)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-muted/50 border border-border/50 animate-pulse"
            >
              <Crown className="w-4 h-4 text-muted-foreground" />
              <span className="font-pixel text-[9px] text-yellow-500">GET VIP</span>
            </button>
          )}
        </div>
        
        {/* Center: Coins */}
        <button 
          onClick={() => handleButtonPress(onOpenShop)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/40"
        >
          <span className="text-lg">🪙</span>
          <span className="font-pixel text-sm text-foreground">{coins.toLocaleString()}</span>
          <span className="text-xs text-primary font-bold">+</span>
        </button>
        
        {/* Right: Sound & Settings */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleButtonPress(onToggleMute)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-muted-foreground" /> : <Volume2 className="w-5 h-5 text-foreground" />}
          </button>
          <button
            onClick={() => handleButtonPress(onOpenSettings)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between px-4 py-4">
        {/* Game Title & Stats */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="font-pixel text-3xl text-primary tracking-wider">
            PIXEL
          </h1>
          <h1 className="font-pixel text-3xl text-accent tracking-wider -mt-1">
            RUNNER
          </h1>
          
          {/* High Score Badge */}
          {highScore > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/30">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="font-pixel text-sm text-primary">{highScore.toLocaleString()}</span>
            </div>
          )}
          
          {/* Current World */}
          <p className="text-xs text-muted-foreground">
            🌍 {WORLD_CONFIGS[currentWorld].name}
          </p>
        </div>

        {/* Game Mode Selector */}
        <div className="w-full max-w-sm space-y-4">
          {/* Mode Pills */}
          <div className="flex gap-1.5 justify-center">
            {GAME_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all active:scale-95 ${
                  selectedMode === mode.id
                    ? `${mode.bgColor} border-white/30 text-white shadow-md`
                    : 'bg-muted/40 border-border/30 text-muted-foreground'
                }`}
              >
                {mode.icon}
                <span className="font-pixel text-[10px]">{mode.name}</span>
              </button>
            ))}
          </div>

          {/* PLAY Button */}
          <Button 
            onClick={handlePlayPress}
            className={`w-full h-16 text-xl font-pixel rounded-2xl shadow-2xl ${currentMode.bgColor} hover:opacity-90 transition-all active:scale-95 border-2 border-white/20 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            <div className="relative flex items-center gap-3">
              <Play className="w-7 h-7 fill-current" />
              <span>PLAY</span>
            </div>
          </Button>
        </div>

        {/* Quick Features Grid */}
        <div className="w-full max-w-sm">
          <div className="grid grid-cols-4 gap-3">
            <FeatureButton 
              icon={Gift} 
              label="Daily" 
              color="text-green-400"
              bgColor="bg-green-500/10"
              borderColor="border-green-500/30"
              badge="!"
              onClick={() => handleButtonPress(onOpenDailyReward)} 
            />
            <FeatureButton 
              icon={Target} 
              label="Tasks" 
              color="text-orange-400"
              bgColor="bg-orange-500/10"
              borderColor="border-orange-500/30"
              onClick={() => handleButtonPress(onOpenDailyChallenges)} 
            />
            <FeatureButton 
              icon={Star} 
              label="Pass" 
              color="text-cyan-400"
              bgColor="bg-cyan-500/10"
              borderColor="border-cyan-500/30"
              onClick={() => handleButtonPress(onOpenBattlePass)} 
            />
            <FeatureButton 
              icon={Swords} 
              label="Bosses" 
              color="text-red-400"
              bgColor="bg-red-500/10"
              borderColor="border-red-500/30"
              onClick={() => handleButtonPress(onOpenBossCollection)} 
            />
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-card/90 backdrop-blur-md border-t border-border/50 px-2 py-2 pb-safe">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <NavItem icon={Trophy} label="Ranks" onClick={() => handleButtonPress(onOpenLeaderboard)} />
          <NavItem icon={ShoppingBag} label="Shop" onClick={() => handleButtonPress(onOpenShop)} />
          <NavItem icon={Users} label="Friends" onClick={() => handleButtonPress(onOpenFriends)} />
          <NavItem icon={BarChart3} label="Stats" onClick={() => handleButtonPress(onOpenStats)} />
        </div>
      </nav>
    </div>
  );
}

interface FeatureButtonProps {
  icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  onClick: () => void;
}

function FeatureButton({ icon: Icon, label, color, bgColor, borderColor, badge, onClick }: FeatureButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-3 rounded-xl ${bgColor} border ${borderColor} transition-all active:scale-95 min-h-[70px]`}
    >
      {badge && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
          {badge}
        </span>
      )}
      <Icon className={`w-6 h-6 ${color} mb-1`} />
      <span className="font-pixel text-[9px] text-muted-foreground">{label}</span>
    </button>
  );
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  active?: boolean;
}

function NavItem({ icon: Icon, label, onClick, active }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 min-w-[60px] rounded-lg transition-all active:scale-95 ${
        active ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="w-5 h-5 mb-0.5" />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}