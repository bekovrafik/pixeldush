import { Button } from '@/components/ui/button';
import { Play, Trophy, ShoppingBag, Settings, Gift, Crown, Zap, Target, Star, Swords, Users, Volume2, VolumeX, BarChart3 } from 'lucide-react';
import { WORLD_CONFIGS, WorldTheme } from '@/types/game';

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
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background via-background to-card flex flex-col">
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
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-6">
        {/* Game Title */}
        <div className="text-center">
          <h1 className="font-pixel text-2xl sm:text-3xl text-primary neon-glow mb-2">
            PIXEL RUNNER
          </h1>
          <p className="text-xs text-muted-foreground">
            {WORLD_CONFIGS[currentWorld].name}
          </p>
          {highScore > 0 && (
            <p className="font-pixel text-xs text-accent mt-2">
              🏆 HIGH SCORE: {highScore}
            </p>
          )}
        </div>

        {/* Game Mode Selection */}
        <div className="flex gap-3 w-full max-w-xs">
          <Button
            onClick={onToggleRushMode}
            variant={rushModeEnabled ? 'default' : 'outline'}
            disabled={endlessModeEnabled}
            className={`flex-1 font-pixel text-[10px] py-3 ${
              rushModeEnabled 
                ? 'bg-gradient-to-r from-red-600 to-orange-500 border-red-400' 
                : 'border-red-500/50'
            }`}
          >
            <Zap className={`w-4 h-4 mr-1 ${rushModeEnabled ? 'text-white' : 'text-red-500'}`} />
            RUSH
          </Button>
          <Button
            onClick={onToggleEndlessMode}
            variant={endlessModeEnabled ? 'default' : 'outline'}
            disabled={rushModeEnabled}
            className={`flex-1 font-pixel text-[10px] py-3 ${
              endlessModeEnabled 
                ? 'bg-gradient-to-r from-purple-600 to-pink-500 border-purple-400' 
                : 'border-purple-500/50'
            }`}
          >
            ♾️ ENDLESS
          </Button>
        </div>

        {/* Play Button */}
        <Button 
          onClick={onStart} 
          className="w-full max-w-xs h-16 game-button text-lg rounded-xl shadow-2xl"
        >
          <Play className="w-6 h-6 mr-3" />
          PLAY
        </Button>

        {/* Mode Description */}
        {rushModeEnabled && (
          <p className="font-pixel text-[8px] text-red-400 text-center animate-pulse">
            No breaks • Harder bosses • 1.5x rewards!
          </p>
        )}
        {endlessModeEnabled && (
          <p className="font-pixel text-[8px] text-purple-400 text-center animate-pulse">
            Infinite bosses • Scaling difficulty • Survive!
          </p>
        )}
      </main>

      {/* Quick Action Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-5 gap-2 mb-4">
          <QuickButton icon={Gift} color="accent" onClick={onOpenDailyReward} label="Daily" />
          <QuickButton icon={Target} color="orange" onClick={onOpenDailyChallenges} label="Tasks" />
          <QuickButton icon={Star} color="cyan" onClick={onOpenBattlePass} label="Pass" />
          <QuickButton icon={Swords} color="red" onClick={onOpenBossCollection} label="Boss" />
          <QuickButton icon={Users} color="secondary" onClick={onOpenFriends} label="Friends" />
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-card/80 backdrop-blur-sm border-t border-border/50 px-4 py-3 pb-safe">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <NavButton icon={Trophy} label="Ranks" onClick={onOpenLeaderboard} />
          <NavButton icon={ShoppingBag} label="Shop" onClick={onOpenShop} />
          <NavButton 
            icon={Crown} 
            label={isVip ? "VIP" : "Get VIP"} 
            onClick={onOpenVip}
            highlight={!isVip}
          />
          <NavButton icon={BarChart3} label="Stats" onClick={onOpenStats} />
          <NavButton icon={Settings} label="Settings" onClick={onOpenSettings} />
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
    purple: 'border-purple-500/50 hover:bg-purple-500/20 text-purple-500',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-lg border bg-card/50 transition-all active:scale-95 ${colorClasses[color]}`}
    >
      <Icon className="w-5 h-5 mb-1" />
      <span className="font-pixel text-[6px] text-muted-foreground">{label}</span>
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
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all active:scale-95 ${
        highlight 
          ? 'text-yellow-500 bg-yellow-500/10' 
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="w-5 h-5 mb-0.5" />
      <span className="text-[9px]">{label}</span>
    </button>
  );
}
