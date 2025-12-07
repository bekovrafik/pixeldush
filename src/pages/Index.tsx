import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameUI } from '@/components/game/GameUI';
import { Leaderboard } from '@/components/game/Leaderboard';
import { Shop } from '@/components/game/Shop';
import { AuthModal } from '@/components/game/AuthModal';
import { AchievementsModal } from '@/components/game/AchievementsModal';
import { DailyRewardModal } from '@/components/game/DailyRewardModal';
import { WorldsModal } from '@/components/game/WorldsModal';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSkins } from '@/hooks/useSkins';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { audioManager } from '@/lib/audioManager';
import { WorldTheme } from '@/types/game';
import { toast } from 'sonner';

export default function Index() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showWorlds, setShowWorlds] = useState(false);
  const [isMuted, setIsMuted] = useState(() => audioManager.getMuted());
  const [localHighScore, setLocalHighScore] = useState(0);
  const [currentWorld, setCurrentWorld] = useState<WorldTheme>('city');

  const { user, profile, signUp, signIn, signOut, refreshProfile } = useAuth();
  const { entries, loading: leaderboardLoading, fetchLeaderboard, submitScore } = useLeaderboard();
  const { allSkins, ownedSkinIds, selectedSkin, loading: skinsLoading, purchaseSkin, selectSkin } = useSkins(profile?.id || null);
  const { achievements, unlockedIds, loading: achievementsLoading, checkAndUnlockAchievements } = useAchievements(profile?.id || null);
  const { currentStreak, canClaim, lastClaimDay, claimReward } = useDailyRewards(profile?.id || null);

  const { gameState, player, obstacles, coins, powerUps, particles, jump, startGame, pauseGame, revive } = useGameEngine(selectedSkin, currentWorld);

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('pixelRunnerHighScore');
    if (saved) setLocalHighScore(parseInt(saved, 10));
    const savedWorld = localStorage.getItem('pixelRunnerWorld') as WorldTheme;
    if (savedWorld) setCurrentWorld(savedWorld);
  }, []);

  // Handle game over
  useEffect(() => {
    if (gameState.isGameOver && gameState.score > 0) {
      if (gameState.score > localHighScore) {
        setLocalHighScore(gameState.score);
        localStorage.setItem('pixelRunnerHighScore', gameState.score.toString());
      }

      if (profile) {
        submitScore(profile.id, gameState.score, gameState.distance, selectedSkin);
        
        checkAndUnlockAchievements({
          score: gameState.score,
          distance: Math.floor(gameState.distance),
          coins: profile.coins + gameState.coins,
          runs: profile.total_runs + 1,
          streak: currentStreak,
        }).then((newUnlocks) => {
          newUnlocks.forEach(achievement => {
            toast.success(`🏆 Achievement Unlocked: ${achievement.name}!`, { duration: 4000 });
          });
        });
        
        refreshProfile();
      }
    }
  }, [gameState.isGameOver]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameState.isPlaying && !gameState.isGameOver) startGame();
        else jump();
      }
      if (e.code === 'Escape' && gameState.isPlaying) pauseGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, gameState.isGameOver, jump, startGame, pauseGame]);

  const handleTap = useCallback(() => {
    audioManager.resumeContext();
    if (!gameState.isPlaying && !gameState.isGameOver) startGame();
    else if (gameState.isPlaying && !gameState.isPaused) jump();
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isPaused, jump, startGame]);

  const handleRevive = useCallback(() => {
    toast.info('Simulating ad...');
    setTimeout(() => { revive(); toast.success('Revived!'); }, 1500);
  }, [revive]);

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioManager.setMuted(newMuted);
  }, [isMuted]);

  const handleClaimDailyReward = useCallback(async () => {
    const result = await claimReward();
    if (!result.error && result.reward) {
      toast.success(`Claimed ${result.reward} coins! 🪙`);
      refreshProfile();
    }
  }, [claimReward, refreshProfile]);

  const handleSelectWorld = useCallback((world: WorldTheme) => {
    setCurrentWorld(world);
    localStorage.setItem('pixelRunnerWorld', world);
    setShowWorlds(false);
    toast.success(`World changed to ${world}!`);
  }, []);

  const highScore = profile?.high_score || localHighScore;
  const totalDistance = profile?.total_distance || 0;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-2 sm:p-4 scanlines overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl flex-1 flex flex-col justify-center">
        <GameCanvas
          player={player}
          obstacles={obstacles}
          coins={coins}
          powerUps={powerUps}
          particles={particles}
          score={gameState.score}
          coinCount={gameState.coins}
          speed={gameState.speed}
          isPlaying={gameState.isPlaying}
          selectedSkin={selectedSkin}
          world={gameState.world}
          activePowerUps={gameState.activePowerUps}
          onTap={handleTap}
        />

        <GameUI
          gameState={gameState}
          highScore={highScore}
          isMuted={isMuted}
          isLoggedIn={!!user}
          onStart={startGame}
          onPause={pauseGame}
          onRestart={startGame}
          onRevive={handleRevive}
          onToggleMute={handleToggleMute}
          onOpenLeaderboard={() => { fetchLeaderboard(); setShowLeaderboard(true); }}
          onOpenShop={() => setShowShop(true)}
          onOpenAuth={() => setShowAuth(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenDailyReward={() => setShowDailyReward(true)}
          onOpenWorlds={() => setShowWorlds(true)}
        />
      </div>

      {!gameState.isPlaying && !gameState.isGameOver && (
        <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground text-center">
          Tap anywhere or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[9px] sm:text-[10px]">SPACE</kbd> to jump
        </p>
      )}

      {user && profile && !gameState.isPlaying && !gameState.isGameOver && (
        <div 
          className="mt-2 sm:mt-4 flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-card/50 cursor-pointer hover:bg-card transition-colors"
          onClick={() => setShowAuth(true)}
        >
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="font-pixel text-[10px] sm:text-xs text-primary">{profile.username[0].toUpperCase()}</span>
          </div>
          <span className="text-xs sm:text-sm text-foreground">{profile.username}</span>
          <span className="font-pixel text-[10px] sm:text-xs text-accent">{profile.coins} 🪙</span>
        </div>
      )}

      <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} entries={entries} loading={leaderboardLoading} currentProfileId={profile?.id} />
      <Shop isOpen={showShop} onClose={() => setShowShop(false)} allSkins={allSkins} ownedSkinIds={ownedSkinIds} selectedSkin={selectedSkin} loading={skinsLoading} isLoggedIn={!!user} onPurchase={purchaseSkin} onSelect={selectSkin} onOpenAuth={() => { setShowShop(false); setShowAuth(true); }} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} isLoggedIn={!!user} profile={profile} onSignUp={signUp} onSignIn={signIn} onSignOut={signOut} />
      <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} achievements={achievements} unlockedIds={unlockedIds} loading={achievementsLoading} />
      <DailyRewardModal isOpen={showDailyReward} onClose={() => setShowDailyReward(false)} currentStreak={currentStreak} canClaim={canClaim} lastClaimDay={lastClaimDay} onClaim={handleClaimDailyReward} isLoggedIn={!!user} onOpenAuth={() => { setShowDailyReward(false); setShowAuth(true); }} />
      <WorldsModal isOpen={showWorlds} onClose={() => setShowWorlds(false)} currentWorld={currentWorld} totalDistance={totalDistance} onSelectWorld={handleSelectWorld} />
    </div>
  );
}
