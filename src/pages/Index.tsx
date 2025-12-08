import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameUI } from '@/components/game/GameUI';
import { Leaderboard } from '@/components/game/Leaderboard';
import { Shop } from '@/components/game/Shop';
import { AuthModal } from '@/components/game/AuthModal';
import { AchievementsModal } from '@/components/game/AchievementsModal';
import { DailyRewardModal } from '@/components/game/DailyRewardModal';
import { WorldsModal } from '@/components/game/WorldsModal';
import { FriendsModal } from '@/components/game/FriendsModal';
import { ShareScoreModal } from '@/components/game/ShareScoreModal';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { SettingsModal } from '@/components/game/SettingsModal';
import { IAPShop } from '@/components/game/IAPShop';
import { CoinStoreModal } from '@/components/game/CoinStoreModal';
import { DailyChallengesModal } from '@/components/game/DailyChallengesModal';
import { SpinWheelModal } from '@/components/game/SpinWheelModal';
import { BattlePassModal } from '@/components/game/BattlePassModal';
import { BossCollectionModal } from '@/components/game/BossCollectionModal';
import { VipModal } from '@/components/game/VipModal';
import { BossRushLeaderboardModal } from '@/components/game/BossRushLeaderboardModal';
import { BossRushChallengesModal } from '@/components/game/BossRushChallengesModal';
import { MobileControls } from '@/components/game/MobileControls';
import { WeaponHUD } from '@/components/game/WeaponHUD';
import { purchaseManager } from '@/lib/purchaseManager';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useScreenShake } from '@/hooks/useScreenShake';
import { usePowerUpEffects } from '@/hooks/usePowerUpEffects';
import { useBossIntro } from '@/hooks/useBossIntro';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSkins } from '@/hooks/useSkins';
import { useAchievements } from '@/hooks/useAchievements';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { useFriends } from '@/hooks/useFriends';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { useBattlePass } from '@/hooks/useBattlePass';
import { useBossDefeats } from '@/hooks/useBossDefeats';
import { useBossRushLeaderboard } from '@/hooks/useBossRushLeaderboard';
import { useBossRushChallenges } from '@/hooks/useBossRushChallenges';
import { useVipSubscription } from '@/hooks/useVipSubscription';
import { useVipDailyBonus } from '@/hooks/useVipDailyBonus';
import { useVipUsers } from '@/hooks/useVipUsers';
import { useVipStats } from '@/hooks/useVipStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { audioManager } from '@/lib/audioManager';
import { admobManager } from '@/lib/admobManager';
import { hapticsManager } from '@/lib/hapticsManager';
import { WorldTheme } from '@/types/game';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [showWorlds, setShowWorlds] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showShareScore, setShowShareScore] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showIAPShop, setShowIAPShop] = useState(false);
  const [showCoinStore, setShowCoinStore] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showBossCollection, setShowBossCollection] = useState(false);
  const [showVip, setShowVip] = useState(false);
  const [showBossRushLeaderboard, setShowBossRushLeaderboard] = useState(false);
  const [showBossRushChallenges, setShowBossRushChallenges] = useState(false);
  const [powerupsCollectedThisRun, setPowerupsCollectedThisRun] = useState(0);
  const [isSfxMuted, setIsSfxMuted] = useState(() => audioManager.getSfxMuted());
  const [isMusicMuted, setIsMusicMuted] = useState(() => audioManager.getMusicMuted());
  const [localHighScore, setLocalHighScore] = useState(0);
  const [currentWorld, setCurrentWorld] = useState<WorldTheme>('city');
  const [lastGameScore, setLastGameScore] = useState(0);
  const [lastGameDistance, setLastGameDistance] = useState(0);

  const { user, profile, signUp, signIn, signOut, refreshProfile } = useAuth();
  const { isVip, subscriptionEnd, loading: vipLoading, checkoutLoading, startCheckout, openCustomerPortal, refreshStatus: refreshVipStatus } = useVipSubscription(user?.id || null);
  const { entries, loading: leaderboardLoading, fetchLeaderboard, submitScore } = useLeaderboard();
  const { allSkins, ownedSkinIds, selectedSkin, loading: skinsLoading, purchaseSkin, selectSkin, getSelectedSkinData } = useSkins(profile?.id || null, isVip);
  const { achievements, unlockedIds, loading: achievementsLoading, checkAndUnlockAchievements } = useAchievements(profile?.id || null);
  const { currentStreak, canClaim, lastClaimDay, claimReward } = useDailyRewards(profile?.id || null);
  const { friends, pendingRequests, loading: friendsLoading, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, refreshFriends } = useFriends(profile?.id || null);
  const { userProgress: challengeProgress, loading: challengesLoading, updateProgress: updateChallengeProgress, claimReward: claimChallengeReward, refetch: refetchChallenges } = useDailyChallenges(profile?.id || null);
  const { season, tiers, userProgress: battlePassProgress, loading: battlePassLoading, addXP, claimReward: claimBattlePassReward, upgradeToPremium, getSeasonTimeRemaining, refetch: refetchBattlePass } = useBattlePass(profile?.id || null);
  const { defeats: bossDefeatsFromDb, recordDefeat, getFastestKill, getTotalDefeats, loading: bossDefeatsLoading } = useBossDefeats(profile?.id || null);
  const { rushScores, endlessScores, loading: rushLeaderboardLoading, fetchLeaderboard: fetchRushLeaderboard, submitScore: submitRushScore, getPersonalBest } = useBossRushLeaderboard();
  const { challenges: rushChallenges, progress: rushChallengeProgress, loading: rushChallengesLoading, updateProgress: updateRushChallengeProgress, claimReward: claimRushChallengeReward, refetch: refetchRushChallenges } = useBossRushChallenges(profile?.id || null);
  const { canClaim: canClaimVipBonus, currentDay: vipBonusDay, bonusCoins: vipBonusCoins, allBonuses: allVipBonuses, claimBonus: claimVipBonus, refreshStatus: refreshVipBonus } = useVipDailyBonus(profile?.id || null, isVip);
  const { vipProfileIds } = useVipUsers();
  const { stats: vipStats, getCurrentTierInfo, getNextTierInfo, getMonthsUntilNextTier, addBonusCoinsEarned, incrementReviveUsed } = useVipStats(profile?.id || null, isVip);

  // Track if VIP welcome has been shown this session
  const [vipWelcomeShown, setVipWelcomeShown] = useState(false);

  // Show VIP welcome notification when user first becomes VIP
  useEffect(() => {
    if (isVip && !vipWelcomeShown && !vipLoading) {
      const hasSeenWelcome = localStorage.getItem('pixelRunnerVipWelcomeShown');
      if (!hasSeenWelcome) {
        toast.success('🎉 Welcome to VIP!', {
          description: 'Enjoy ad-free revives, 2x coins, exclusive worlds, and daily bonuses!',
          duration: 6000,
        });
        localStorage.setItem('pixelRunnerVipWelcomeShown', 'true');
      }
      setVipWelcomeShown(true);
    }
  }, [isVip, vipWelcomeShown, vipLoading]);

  // Get skin abilities for game engine
  const selectedSkinData = getSelectedSkinData();
  const skinAbilities = {
    speedBonus: selectedSkinData?.speed_bonus || 0,
    coinMultiplier: selectedSkinData?.coin_multiplier || 1,
    jumpPowerBonus: selectedSkinData?.jump_power_bonus || 0,
    shieldDurationBonus: selectedSkinData?.shield_duration_bonus || 0,
  };

  // Screen shake hook
  const { shakeOffset, shakeOnDamage, shakeOnBossDefeat, shakeOnHit } = useScreenShake();
  
  // Power-up effects hook
  const { screenFlash, explosions: powerUpExplosions, triggerPowerUpCollection, updateExplosions } = usePowerUpEffects();
  
  // Boss intro hook
  const { introState: bossIntro, startBossIntro, updateBossIntro, getShakeOffset: getBossIntroShake } = useBossIntro();

  const { gameState, player, obstacles, coins, powerUps, weaponPowerUps, particles, playerProjectiles, boss, bossRewards, bossWarning, bossArena, defeatedBosses, rushModeEnabled, endlessModeEnabled, justPickedUpWeapon, jump, attack, startGame, pauseGame, revive, goHome, toggleRushMode, toggleEndlessMode } = useGameEngine(selectedSkin, currentWorld, skinAbilities, { 
    isVip, 
    onPlayerDamage: () => {
      shakeOnDamage();
      hapticsManager.errorNotification();
    },
    onBossDefeat: () => {
      shakeOnBossDefeat();
      hapticsManager.successNotification();
    },
    onPlayerHit: () => {
      shakeOnHit();
      hapticsManager.warningNotification();
    },
    onPowerUpCollect: (type, x, y) => {
      triggerPowerUpCollection(x, y, type as any);
    },
    onWeaponCollect: (type, x, y) => {
      triggerPowerUpCollection(x, y, 'weapon');
    },
    onBossSpawn: (bossType) => {
      startBossIntro(bossType as any);
    },
  });

  // Check if tutorial should be shown
  useEffect(() => {
    const tutorialShown = localStorage.getItem('pixelRunnerTutorialCompleted');
    if (!tutorialShown) {
      setShowTutorial(true);
    }
  }, []);

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
      setLastGameScore(gameState.score);
      setLastGameDistance(Math.floor(gameState.distance));

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

        // Update daily challenges progress
        updateChallengeProgress({
          score: gameState.score,
          distance: Math.floor(gameState.distance),
          coins: gameState.coins,
          powerupsCollected: powerupsCollectedThisRun,
        });
        
        // Add Battle Pass XP based on performance
        const xpFromScore = Math.floor(gameState.score / 10);
        const xpFromCoins = gameState.coins * 5;
        const xpFromDistance = Math.floor(gameState.distance / 100);
        const totalXP = xpFromScore + xpFromCoins + xpFromDistance;
        if (totalXP > 0) {
          addXP(totalXP);
        }
        
        setPowerupsCollectedThisRun(0);
        refreshProfile();
      }
    }
  }, [gameState.isGameOver]);

  // Handle boss arena completion - submit to leaderboard and update challenges
  useEffect(() => {
    if (bossArena && !bossArena.isActive && bossArena.bossesDefeated.length > 0 && profile) {
      const completionTimeSeconds = (Date.now() - bossArena.startTime) / 1000;
      const isEndless = bossArena.isEndlessMode;
      const bossCount = bossArena.bossesDefeated.length;
      
      // Submit to leaderboard
      submitRushScore(
        profile.id,
        completionTimeSeconds,
        bossArena.totalRewards.coins + bossArena.totalRewards.xp,
        bossCount,
        isEndless
      );
      
      // Update boss rush challenges
      updateRushChallengeProgress({
        rushCompleted: !isEndless && bossCount >= 3,
        completionTime: !isEndless ? completionTimeSeconds : undefined,
        endlessWaves: isEndless ? bossArena.endlessWave : undefined,
        totalScore: bossArena.totalRewards.coins + bossArena.totalRewards.xp,
      });
      
      // Check endless milestones
      if (isEndless) {
        const wave = bossArena.endlessWave;
        if (wave >= 50) {
          toast.success('🏆 LEGENDARY! Wave 50 reached! Cosmic Guardian unlocked!', { duration: 6000 });
        } else if (wave >= 25) {
          toast.success('⭐ EPIC! Wave 25 reached! Thunder Lord unlocked!', { duration: 5000 });
        } else if (wave >= 10) {
          toast.success('🎉 Wave 10 milestone! Frost Queen unlocked!', { duration: 4000 });
        }
      }
    }
  }, [bossArena?.isActive]);

  // Handle boss defeat XP reward and record to database
  useEffect(() => {
    if (bossRewards && profile) {
      addXP(bossRewards.xp);
      toast.success(`🏆 Boss Defeated! +${bossRewards.coins} coins, +${bossRewards.xp} XP!`, { duration: 4000 });
      
      // Record the boss defeat to database
      const lastDefeatedBoss = defeatedBosses[defeatedBosses.length - 1];
      if (lastDefeatedBoss) {
        recordDefeat(lastDefeatedBoss, undefined, Math.floor(gameState.distance));
      }
    }
  }, [bossRewards]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameState.isPlaying && !gameState.isGameOver) startGame();
        else jump();
      }
      if ((e.code === 'KeyX' || e.code === 'KeyZ') && gameState.isPlaying) {
        e.preventDefault();
        attack();
      }
      if (e.code === 'Escape' && gameState.isPlaying) pauseGame();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, gameState.isGameOver, jump, attack, startGame, pauseGame]);

  const handleTap = useCallback(() => {
    audioManager.resumeContext();
    if (!gameState.isPlaying && !gameState.isGameOver) startGame();
    else if (gameState.isPlaying && !gameState.isPaused) jump();
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isPaused, jump, startGame]);

  const handleRevive = useCallback(async () => {
    // VIP users can revive without watching ads
    if (isVip) {
      revive();
      incrementReviveUsed(); // Track ad-free revive usage
      toast.success('VIP Revive! 👑');
      return;
    }
    
    toast.info('Loading ad...');
    const reward = await admobManager.showRewardedAd();
    if (reward) {
      revive();
      toast.success('Revived!');
      // Prepare next ad
      admobManager.prepareRewardedAd();
    } else {
      toast.error('Ad not available. Please try again.');
    }
  }, [revive, isVip, incrementReviveUsed]);

  const handleToggleMute = useCallback(() => {
    const newMuted = !isSfxMuted;
    setIsSfxMuted(newMuted);
    audioManager.setSfxMuted(newMuted);
  }, [isSfxMuted]);

  const handleToggleMusic = useCallback(() => {
    const newMuted = !isMusicMuted;
    setIsMusicMuted(newMuted);
    audioManager.setMusicMuted(newMuted);
  }, [isMusicMuted]);

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

  const handleTutorialComplete = useCallback(async () => {
    localStorage.setItem('pixelRunnerTutorialCompleted', 'true');
    setShowTutorial(false);
    
    if (profile) {
      await supabase
        .from('profiles')
        .update({ tutorial_completed: true })
        .eq('id', profile.id);
    }
  }, [profile]);

  const handleTutorialSkip = useCallback(() => {
    localStorage.setItem('pixelRunnerTutorialCompleted', 'true');
    setShowTutorial(false);
  }, []);

  const highScore = profile?.high_score || localHighScore;
  const totalDistance = profile?.total_distance || 0;
  const isMuted = isSfxMuted && isMusicMuted;
  const isMobile = useIsMobile();
  
  // Detect if playing on mobile in portrait orientation
  const [isPortrait, setIsPortrait] = useState(false);
  const [showRotateOverlay, setShowRotateOverlay] = useState(false);
  
  useEffect(() => {
    const checkOrientation = () => {
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isPortraitMode);
      // Show rotate overlay only when playing on mobile in portrait
      setShowRotateOverlay(isMobile && isPortraitMode && gameState.isPlaying);
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [isMobile, gameState.isPlaying]);

  // Show attack button when boss is active
  const showAttackButton = !!(boss || (bossArena?.isActive && bossArena.bossesDefeated.length >= 0));

  // Landscape fullscreen mode when playing on mobile
  const gameModeClasses = isMobile && gameState.isPlaying && !isPortrait 
    ? 'game-landscape-mode' 
    : 'min-h-[100dvh] bg-background flex flex-col items-center justify-center p-2 sm:p-4 scanlines overflow-hidden';

  return (
    <div className={gameModeClasses}>
      {/* Rotate device overlay for portrait mode */}
      {showRotateOverlay && (
        <div className="rotate-device-overlay">
          <div className="phone-icon">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-1 rounded bg-primary/30" />
          </div>
          <h2 className="font-pixel text-lg text-primary mt-6 neon-glow">ROTATE DEVICE</h2>
          <p className="text-muted-foreground text-sm mt-2">Please rotate your phone to landscape mode for the best gaming experience</p>
        </div>
      )}
      
      {showTutorial && (
        <TutorialOverlay onComplete={handleTutorialComplete} onSkip={handleTutorialSkip} />
      )}

      {!gameState.isPlaying && (
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
      )}

      <div 
        className={`relative w-full ${isMobile && gameState.isPlaying && !isPortrait ? 'h-full game-canvas-wrapper' : 'max-w-4xl flex-1 flex flex-col justify-center'}`}
        style={{ 
          transform: gameState.isPlaying ? `translate(${shakeOffset.x}px, ${shakeOffset.y}px)` : undefined,
          transition: shakeOffset.x === 0 && shakeOffset.y === 0 ? 'transform 0.1s ease-out' : 'none'
        }}
      >
        <GameCanvas
          player={player}
          obstacles={obstacles}
          coins={coins}
          powerUps={powerUps}
          weaponPowerUps={weaponPowerUps}
          playerProjectiles={playerProjectiles}
          particles={particles}
          boss={boss}
          bossWarning={bossWarning}
          bossArena={bossArena}
          score={gameState.score}
          coinCount={gameState.coins}
          speed={gameState.speed}
          isPlaying={gameState.isPlaying}
          selectedSkin={selectedSkin}
          world={gameState.world}
          activePowerUps={gameState.activePowerUps}
          activeWeapon={gameState.activeWeapon}
          weaponAmmo={gameState.weaponAmmo}
          comboCount={gameState.comboCount}
          hasDoubleJumped={player.hasDoubleJumped}
          isVip={isVip}
          onTap={handleTap}
          screenFlash={screenFlash}
          powerUpExplosions={powerUpExplosions}
          bossIntro={bossIntro}
          bossIntroShakeOffset={getBossIntroShake()}
        />

        <GameUI
          gameState={gameState}
          highScore={highScore}
          isMuted={isMuted}
          isLoggedIn={!!user}
          isVip={isVip}
          rushModeEnabled={rushModeEnabled}
          endlessModeEnabled={endlessModeEnabled}
          onStart={startGame}
          onPause={pauseGame}
          onRestart={startGame}
          onRevive={handleRevive}
          onGoHome={goHome}
          onToggleMute={handleToggleMute}
          onToggleRushMode={toggleRushMode}
          onToggleEndlessMode={toggleEndlessMode}
          onOpenLeaderboard={() => { fetchLeaderboard(); refreshFriends(); setShowLeaderboard(true); }}
          onOpenShop={() => setShowShop(true)}
          onOpenAuth={() => setShowAuth(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenDailyReward={() => setShowDailyReward(true)}
          onOpenWorlds={() => setShowWorlds(true)}
          onOpenFriends={() => setShowFriends(true)}
          onShareScore={() => setShowShareScore(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenIAPShop={() => setShowIAPShop(true)}
          onOpenCoinStore={() => setShowCoinStore(true)}
          onOpenDailyChallenges={() => setShowDailyChallenges(true)}
          onOpenSpinWheel={() => setShowSpinWheel(true)}
          onOpenBattlePass={() => setShowBattlePass(true)}
          onOpenBossCollection={() => setShowBossCollection(true)}
          onOpenVip={() => setShowVip(true)}
          onOpenBossRushLeaderboard={() => { fetchRushLeaderboard(); setShowBossRushLeaderboard(true); }}
          onOpenBossRushChallenges={() => { refetchRushChallenges(); setShowBossRushChallenges(true); }}
        />
      </div>

      {/* Mobile Controls - Only show when playing on mobile */}
      {isMobile && gameState.isPlaying && !gameState.isPaused && !isPortrait && (
        <MobileControls
          onJump={jump}
          onAttack={attack}
          showAttackButton={showAttackButton}
          doubleJumpAvailable={player.doubleJumpAvailable}
          hasDoubleJumped={player.hasDoubleJumped}
          activeWeapon={gameState.activeWeapon}
          weaponAmmo={gameState.weaponAmmo}
          justPickedUpWeapon={justPickedUpWeapon}
        />
      )}

      {/* Weapon HUD - Show during boss fights */}
      {gameState.isPlaying && !gameState.isPaused && showAttackButton && (
        <WeaponHUD
          activeWeapon={gameState.activeWeapon}
          weaponAmmo={gameState.weaponAmmo}
          showAttackButton={showAttackButton}
        />
      )}

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

      <Leaderboard 
        isOpen={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)} 
        entries={entries} 
        loading={leaderboardLoading} 
        currentProfileId={profile?.id}
        friends={friends}
        vipUserIds={vipProfileIds}
      />
      <Shop isOpen={showShop} onClose={() => setShowShop(false)} allSkins={allSkins} ownedSkinIds={ownedSkinIds} selectedSkin={selectedSkin} loading={skinsLoading} isLoggedIn={!!user} currentCoins={profile?.coins || 0} onPurchase={purchaseSkin} onSelect={selectSkin} onOpenAuth={() => { setShowShop(false); setShowAuth(true); }} onPurchaseComplete={refreshProfile} />
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} isLoggedIn={!!user} profile={profile} onSignUp={signUp} onSignIn={signIn} onSignOut={signOut} />
      <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} achievements={achievements} unlockedIds={unlockedIds} loading={achievementsLoading} />
      <DailyRewardModal isOpen={showDailyReward} onClose={() => setShowDailyReward(false)} currentStreak={currentStreak} canClaim={canClaim} lastClaimDay={lastClaimDay} onClaim={handleClaimDailyReward} isLoggedIn={!!user} onOpenAuth={() => { setShowDailyReward(false); setShowAuth(true); }} />
      <WorldsModal isOpen={showWorlds} onClose={() => setShowWorlds(false)} currentWorld={currentWorld} totalDistance={totalDistance} isVip={isVip} onSelectWorld={handleSelectWorld} onOpenVip={() => { setShowWorlds(false); setShowVip(true); }} />
      <FriendsModal 
        isOpen={showFriends} 
        onClose={() => setShowFriends(false)} 
        friends={friends} 
        pendingRequests={pendingRequests} 
        loading={friendsLoading} 
        isLoggedIn={!!user}
        onSendRequest={sendFriendRequest}
        onAccept={acceptFriendRequest}
        onReject={rejectFriendRequest}
        onRemove={removeFriend}
        onOpenAuth={() => { setShowFriends(false); setShowAuth(true); }}
      />
      <ShareScoreModal
        isOpen={showShareScore}
        onClose={() => setShowShareScore(false)}
        score={lastGameScore}
        distance={lastGameDistance}
        username={profile?.username}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isMuted={isSfxMuted}
        isMusicMuted={isMusicMuted}
        onToggleMute={handleToggleMute}
        onToggleMusic={handleToggleMusic}
      />
      <IAPShop
        isOpen={showIAPShop}
        onClose={() => setShowIAPShop(false)}
        isLoggedIn={!!user}
        profileId={profile?.id || null}
        currentCoins={profile?.coins || 0}
        onPurchaseComplete={refreshProfile}
        onOpenAuth={() => { setShowIAPShop(false); setShowAuth(true); }}
      />
      <CoinStoreModal
        isOpen={showCoinStore}
        onClose={() => setShowCoinStore(false)}
        isLoggedIn={!!user}
        profileId={profile?.id || null}
        currentCoins={profile?.coins || 0}
        onCoinsEarned={refreshProfile}
        onOpenAuth={() => { setShowCoinStore(false); setShowAuth(true); }}
      />
      <DailyChallengesModal
        isOpen={showDailyChallenges}
        onClose={() => setShowDailyChallenges(false)}
        userProgress={challengeProgress}
        loading={challengesLoading}
        isLoggedIn={!!user}
        onClaimReward={claimChallengeReward}
        onOpenAuth={() => { setShowDailyChallenges(false); setShowAuth(true); }}
        onPurchaseComplete={refreshProfile}
      />
      <SpinWheelModal
        isOpen={showSpinWheel}
        onClose={() => setShowSpinWheel(false)}
        isLoggedIn={!!user}
        profileId={profile?.id || null}
        currentCoins={profile?.coins || 0}
        onSpinComplete={refreshProfile}
        onOpenAuth={() => { setShowSpinWheel(false); setShowAuth(true); }}
      />
      <BattlePassModal
        isOpen={showBattlePass}
        onClose={() => setShowBattlePass(false)}
        season={season}
        tiers={tiers}
        userProgress={battlePassProgress}
        loading={battlePassLoading}
        isLoggedIn={!!user}
        timeRemaining={getSeasonTimeRemaining()}
        onClaimReward={claimBattlePassReward}
        onUpgradeToPremium={upgradeToPremium}
        onOpenAuth={() => { setShowBattlePass(false); setShowAuth(true); }}
        onPurchaseComplete={refreshProfile}
      />
      <BossCollectionModal
        isOpen={showBossCollection}
        onClose={() => setShowBossCollection(false)}
        defeatedBosses={bossDefeatsFromDb.map(d => ({ 
          type: d.boss_type, 
          defeatedAt: new Date(d.defeated_at).getTime(),
          killTime: d.kill_time_seconds || undefined 
        }))}
      />
      <VipModal
        isOpen={showVip}
        onClose={() => setShowVip(false)}
        isVip={isVip}
        subscriptionEnd={subscriptionEnd}
        loading={vipLoading}
        checkoutLoading={checkoutLoading}
        isLoggedIn={!!user}
        canClaimDailyBonus={canClaimVipBonus}
        dailyBonusDay={vipBonusDay}
        dailyBonusCoins={vipBonusCoins}
        allDailyBonuses={allVipBonuses}
        onClaimDailyBonus={async () => {
          const result = await claimVipBonus();
          if (!result.error) {
            toast.success(`VIP Bonus claimed! +${result.coins} coins! 🎁`);
            refreshProfile();
            refreshVipBonus();
            addBonusCoinsEarned(result.coins);
          }
          return result;
        }}
        vipStats={vipStats}
        currentTier={getCurrentTierInfo()}
        nextTier={getNextTierInfo()}
        monthsUntilNextTier={getMonthsUntilNextTier()}
        vipSkins={allSkins.filter(s => ['diamond', 'phoenix', 'shadow_king', 'frost_queen', 'thunder_lord', 'cosmic_guardian'].includes(s.id))}
        ownedSkinIds={ownedSkinIds}
        selectedSkin={selectedSkin}
        onSelectSkin={selectSkin}
        onStartCheckout={startCheckout}
        onOpenPortal={openCustomerPortal}
        onOpenAuth={() => { setShowVip(false); setShowAuth(true); }}
      />
      <BossRushLeaderboardModal
        isOpen={showBossRushLeaderboard}
        onClose={() => setShowBossRushLeaderboard(false)}
        rushScores={rushScores}
        endlessScores={endlessScores}
        loading={rushLeaderboardLoading}
        currentProfileId={profile?.id}
        vipUserIds={vipProfileIds}
      />
      <BossRushChallengesModal
        isOpen={showBossRushChallenges}
        onClose={() => setShowBossRushChallenges(false)}
        challenges={rushChallenges}
        progress={rushChallengeProgress}
        loading={rushChallengesLoading}
        onClaimReward={async (id) => {
          const result = await claimRushChallengeReward(id);
          if (result.reward) {
            toast.success(`Claimed ${result.reward.reward_coins} coins + ${result.reward.reward_xp} XP!`);
            refreshProfile();
          }
        }}
        isLoggedIn={!!user}
        onOpenAuth={() => { setShowBossRushChallenges(false); setShowAuth(true); }}
      />
    </div>
  );
}
