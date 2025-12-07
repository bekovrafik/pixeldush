import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from '@/components/game/GameCanvas';
import { GameUI } from '@/components/game/GameUI';
import { Leaderboard } from '@/components/game/Leaderboard';
import { Shop } from '@/components/game/Shop';
import { AuthModal } from '@/components/game/AuthModal';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useSkins } from '@/hooks/useSkins';
import { audioManager } from '@/lib/audioManager';
import { toast } from 'sonner';

export default function Index() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isMuted, setIsMuted] = useState(() => audioManager.getMuted());
  const [localHighScore, setLocalHighScore] = useState(0);

  const { user, profile, signUp, signIn, signOut } = useAuth();
  const { entries, loading: leaderboardLoading, fetchLeaderboard, submitScore } = useLeaderboard();
  const { 
    allSkins, 
    ownedSkinIds, 
    selectedSkin, 
    loading: skinsLoading, 
    purchaseSkin, 
    selectSkin 
  } = useSkins(profile?.id || null);

  const { 
    gameState, 
    player, 
    obstacles,
    coins,
    particles, 
    jump, 
    startGame, 
    pauseGame, 
    revive 
  } = useGameEngine(selectedSkin);

  useEffect(() => {
    const saved = localStorage.getItem('pixelRunnerHighScore');
    if (saved) setLocalHighScore(parseInt(saved, 10));
  }, []);

  useEffect(() => {
    if (gameState.isGameOver && gameState.score > 0) {
      if (gameState.score > localHighScore) {
        setLocalHighScore(gameState.score);
        localStorage.setItem('pixelRunnerHighScore', gameState.score.toString());
      }

      if (profile) {
        submitScore(profile.id, gameState.score, gameState.distance, selectedSkin)
          .then(({ error }) => {
            if (!error) {
              fetchLeaderboard();
            }
          });
      }
    }
  }, [gameState.isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!gameState.isPlaying && !gameState.isGameOver) {
          startGame();
        } else {
          jump();
        }
      }
      if (e.code === 'Escape' && gameState.isPlaying) {
        pauseGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isPlaying, gameState.isGameOver, jump, startGame, pauseGame]);

  const handleTap = useCallback(() => {
    audioManager.resumeContext();
    if (!gameState.isPlaying && !gameState.isGameOver) {
      startGame();
    } else if (gameState.isPlaying && !gameState.isPaused) {
      jump();
    }
  }, [gameState.isPlaying, gameState.isGameOver, gameState.isPaused, jump, startGame]);

  const handleRevive = useCallback(() => {
    toast.info('Simulating ad... (In production, this would show a rewarded video ad)');
    setTimeout(() => {
      revive();
      toast.success('Revived! Keep running!');
    }, 1500);
  }, [revive]);

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioManager.setMuted(newMuted);
    audioManager.playClick();
  }, [isMuted]);

  const highScore = profile?.high_score || localHighScore;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 scanlines">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl">
        <GameCanvas
          player={player}
          obstacles={obstacles}
          coins={coins}
          particles={particles}
          score={gameState.score}
          coinCount={gameState.coins}
          speed={gameState.speed}
          isPlaying={gameState.isPlaying}
          selectedSkin={selectedSkin}
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
          onOpenLeaderboard={() => {
            audioManager.playClick();
            fetchLeaderboard();
            setShowLeaderboard(true);
          }}
          onOpenShop={() => {
            audioManager.playClick();
            setShowShop(true);
          }}
          onOpenAuth={() => {
            audioManager.playClick();
            setShowAuth(true);
          }}
        />
      </div>

      {!gameState.isPlaying && !gameState.isGameOver && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Press <kbd className="px-2 py-1 rounded bg-muted text-foreground">SPACE</kbd> or tap to jump
        </p>
      )}

      {user && profile && !gameState.isPlaying && !gameState.isGameOver && (
        <div 
          className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 cursor-pointer hover:bg-card transition-colors"
          onClick={() => setShowAuth(true)}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="font-pixel text-xs text-primary">{profile.username[0].toUpperCase()}</span>
          </div>
          <span className="text-sm text-foreground">{profile.username}</span>
        </div>
      )}

      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        entries={entries}
        loading={leaderboardLoading}
        currentProfileId={profile?.id}
      />

      <Shop
        isOpen={showShop}
        onClose={() => setShowShop(false)}
        allSkins={allSkins}
        ownedSkinIds={ownedSkinIds}
        selectedSkin={selectedSkin}
        loading={skinsLoading}
        isLoggedIn={!!user}
        onPurchase={purchaseSkin}
        onSelect={selectSkin}
        onOpenAuth={() => {
          setShowShop(false);
          setShowAuth(true);
        }}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        isLoggedIn={!!user}
        profile={profile}
        onSignUp={signUp}
        onSignIn={signIn}
        onSignOut={signOut}
      />
    </div>
  );
}
