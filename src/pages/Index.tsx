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
import { toast } from 'sonner';

export default function Index() {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [localHighScore, setLocalHighScore] = useState(0);

  const { user, profile, signUp, signIn, signOut, updateProfile } = useAuth();
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
    particles, 
    jump, 
    startGame, 
    pauseGame, 
    revive 
  } = useGameEngine(selectedSkin);

  // Load local high score
  useEffect(() => {
    const saved = localStorage.getItem('pixelRunnerHighScore');
    if (saved) setLocalHighScore(parseInt(saved, 10));
  }, []);

  // Handle game over - submit score
  useEffect(() => {
    if (gameState.isGameOver && gameState.score > 0) {
      // Update local high score
      if (gameState.score > localHighScore) {
        setLocalHighScore(gameState.score);
        localStorage.setItem('pixelRunnerHighScore', gameState.score.toString());
      }

      // Submit to leaderboard if logged in
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

  // Keyboard controls
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

  const highScore = profile?.high_score || localHighScore;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 scanlines">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Game container */}
      <div className="relative w-full max-w-4xl">
        <GameCanvas
          player={player}
          obstacles={obstacles}
          particles={particles}
          score={gameState.score}
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
          onToggleMute={() => setIsMuted(!isMuted)}
          onOpenLeaderboard={() => {
            fetchLeaderboard();
            setShowLeaderboard(true);
          }}
          onOpenShop={() => setShowShop(true)}
          onOpenAuth={() => setShowAuth(true)}
        />
      </div>

      {/* Instructions */}
      {!gameState.isPlaying && !gameState.isGameOver && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Press <kbd className="px-2 py-1 rounded bg-muted text-foreground">SPACE</kbd> or tap to jump
        </p>
      )}

      {/* User info */}
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

      {/* Modals */}
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
