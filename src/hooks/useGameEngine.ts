import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Player, Obstacle, Particle, Coin } from '@/types/game';
import { audioManager } from '@/lib/audioManager';

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GROUND_Y = 280;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 40;
const INITIAL_SPEED = 5;
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.001;

export function useGameEngine(selectedSkin: string) {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    distance: 0,
    speed: INITIAL_SPEED,
    coins: 0,
    canRevive: true,
    hasRevived: false,
  });

  const [player, setPlayer] = useState<Player>({
    x: 80,
    y: GROUND_Y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    isOnGround: true,
    frameIndex: 0,
    frameTimer: 0,
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const obstacleTimerRef = useRef<number>(0);
  const coinTimerRef = useRef<number>(0);

  const generateObstacle = useCallback((gameSpeed: number): Obstacle => {
    const types: Obstacle['type'][] = ['spike', 'block', 'flying', 'double', 'moving'];
    const weights = [30, 25, 20, 15, 10]; // Probability weights
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let typeIndex = 0;
    
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        typeIndex = i;
        break;
      }
    }
    
    const type = types[typeIndex];
    let width = 30;
    let height = 40;
    let y = GROUND_Y - height;
    let velocityY = 0;
    let minY = 0;
    let maxY = 0;
    
    switch (type) {
      case 'spike':
        width = 25;
        height = 35;
        y = GROUND_Y - height;
        break;
      case 'block':
        width = 40 + Math.random() * 20;
        height = 30 + Math.random() * 30;
        y = GROUND_Y - height;
        break;
      case 'flying':
        width = 35;
        height = 25;
        y = GROUND_Y - 80 - Math.random() * 60; // Floating in air
        break;
      case 'double':
        width = 25;
        height = 35;
        y = GROUND_Y - height;
        break;
      case 'moving':
        width = 30;
        height = 30;
        minY = GROUND_Y - 100;
        maxY = GROUND_Y - 40;
        y = (minY + maxY) / 2;
        velocityY = 2;
        break;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x: 900,
      y,
      width,
      height,
      type,
      passed: false,
      velocityY,
      minY,
      maxY,
    };
  }, []);

  const generateCoin = useCallback((): Coin => {
    const patterns = ['low', 'mid', 'high', 'arc'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    let y = GROUND_Y - 50;
    
    switch (pattern) {
      case 'low':
        y = GROUND_Y - 40;
        break;
      case 'mid':
        y = GROUND_Y - 80;
        break;
      case 'high':
        y = GROUND_Y - 120;
        break;
      case 'arc':
        y = GROUND_Y - 60 - Math.random() * 80;
        break;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x: 900,
      y,
      width: 20,
      height: 20,
      collected: false,
      animationFrame: 0,
    };
  }, []);

  const createJumpParticles = useCallback((playerX: number, playerY: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x: playerX + PLAYER_WIDTH / 2,
        y: playerY + PLAYER_HEIGHT,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: Math.random() * 2 + 1,
        life: 20,
        maxLife: 20,
        size: 3 + Math.random() * 3,
        color: '#8B7355',
      });
    }
    return newParticles;
  }, []);

  const createCoinParticles = useCallback((x: number, y: number) => {
    const newParticles: Particle[] = [];
    const colors = ['#FFD700', '#FFA500', '#FFEC8B', '#FFE135'];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x,
        y,
        velocityX: Math.cos(angle) * 3,
        velocityY: Math.sin(angle) * 3,
        life: 20,
        maxLife: 20,
        size: 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return newParticles;
  }, []);

  const createDeathParticles = useCallback((playerX: number, playerY: number) => {
    const newParticles: Particle[] = [];
    const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#95E1D3'];
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x: playerX + PLAYER_WIDTH / 2,
        y: playerY + PLAYER_HEIGHT / 2,
        velocityX: Math.cos(angle) * (3 + Math.random() * 3),
        velocityY: Math.sin(angle) * (3 + Math.random() * 3),
        life: 40,
        maxLife: 40,
        size: 4 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return newParticles;
  }, []);

  const checkCollision = useCallback((player: Player, obstacle: Obstacle): boolean => {
    const padding = 5;
    return (
      player.x + padding < obstacle.x + obstacle.width &&
      player.x + player.width - padding > obstacle.x &&
      player.y + padding < obstacle.y + obstacle.height &&
      player.y + player.height - padding > obstacle.y
    );
  }, []);

  const checkCoinCollision = useCallback((player: Player, coin: Coin): boolean => {
    const padding = 2;
    return (
      player.x + padding < coin.x + coin.width &&
      player.x + player.width - padding > coin.x &&
      player.y + padding < coin.y + coin.height &&
      player.y + player.height - padding > coin.y
    );
  }, []);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    
    setPlayer(prev => {
      if (prev.isOnGround) {
        audioManager.playJump();
        setParticles(current => [...current, ...createJumpParticles(prev.x, prev.y)]);
        return {
          ...prev,
          velocityY: JUMP_FORCE,
          isJumping: true,
          isOnGround: false,
        };
      }
      return prev;
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, createJumpParticles]);

  const startGame = useCallback(() => {
    audioManager.resumeContext();
    audioManager.startBGM();
    
    setGameState({
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: 0,
      distance: 0,
      speed: INITIAL_SPEED,
      coins: 0,
      canRevive: true,
      hasRevived: false,
    });
    setPlayer({
      x: 80,
      y: GROUND_Y - PLAYER_HEIGHT,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      isOnGround: true,
      frameIndex: 0,
      frameTimer: 0,
    });
    setObstacles([]);
    setCoins([]);
    setParticles([]);
    obstacleTimerRef.current = 0;
    coinTimerRef.current = 0;
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const endGame = useCallback(() => {
    audioManager.playDeath();
    audioManager.stopBGM();
    setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }));
    setParticles(current => [...current, ...createDeathParticles(player.x, player.y)]);
  }, [player.x, player.y, createDeathParticles]);

  const revive = useCallback(() => {
    if (!gameState.canRevive || gameState.hasRevived) return;
    
    audioManager.startBGM();
    
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      isGameOver: false,
      hasRevived: true,
      canRevive: false,
    }));
    setPlayer(prev => ({
      ...prev,
      y: GROUND_Y - PLAYER_HEIGHT,
      velocityY: 0,
      isJumping: false,
      isOnGround: true,
    }));
    setObstacles([]);
  }, [gameState.canRevive, gameState.hasRevived]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    lastTimeRef.current = timestamp;

    if (gameState.isPaused || gameState.isGameOver || !gameState.isPlaying) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Update player
    setPlayer(prev => {
      let newY = prev.y + prev.velocityY;
      let newVelocityY = prev.velocityY + GRAVITY;
      let isOnGround = false;

      if (newY >= GROUND_Y - PLAYER_HEIGHT) {
        newY = GROUND_Y - PLAYER_HEIGHT;
        newVelocityY = 0;
        isOnGround = true;
      }

      let newFrameTimer = prev.frameTimer + 1;
      let newFrameIndex = prev.frameIndex;
      if (newFrameTimer >= 6) {
        newFrameTimer = 0;
        newFrameIndex = (prev.frameIndex + 1) % 4;
      }

      return {
        ...prev,
        y: newY,
        velocityY: newVelocityY,
        isOnGround,
        isJumping: !isOnGround,
        frameIndex: newFrameIndex,
        frameTimer: newFrameTimer,
      };
    });

    // Update game state
    setGameState(prev => {
      const newSpeed = Math.min(prev.speed + SPEED_INCREMENT, MAX_SPEED);
      return {
        ...prev,
        distance: prev.distance + newSpeed,
        score: Math.floor((prev.distance + newSpeed) / 10) + prev.coins * 10,
        speed: newSpeed,
      };
    });

    // Generate obstacles
    obstacleTimerRef.current += 1;
    const minInterval = Math.max(60, 120 - gameState.speed * 5);
    
    if (obstacleTimerRef.current >= minInterval + Math.random() * 60) {
      obstacleTimerRef.current = 0;
      const newObs = generateObstacle(gameState.speed);
      setObstacles(prev => {
        const obstacles = [...prev, newObs];
        // Add second obstacle for double type
        if (newObs.type === 'double') {
          obstacles.push({
            ...newObs,
            id: Math.random().toString(36).substr(2, 9),
            x: newObs.x + 50,
          });
        }
        return obstacles;
      });
    }

    // Generate coins
    coinTimerRef.current += 1;
    if (coinTimerRef.current >= 80 + Math.random() * 40) {
      coinTimerRef.current = 0;
      setCoins(prev => [...prev, generateCoin()]);
    }

    // Update obstacles
    setObstacles(prev => {
      const updated = prev
        .map(obs => {
          let newY = obs.y;
          let newVelocityY = obs.velocityY || 0;
          
          // Moving obstacle logic
          if (obs.type === 'moving' && obs.minY !== undefined && obs.maxY !== undefined) {
            newY += newVelocityY;
            if (newY <= obs.minY || newY >= obs.maxY) {
              newVelocityY = -newVelocityY;
            }
          }
          
          return { 
            ...obs, 
            x: obs.x - gameState.speed,
            y: newY,
            velocityY: newVelocityY,
          };
        })
        .filter(obs => obs.x > -100);
      
      // Check collision
      for (const obs of updated) {
        if (checkCollision(player, obs)) {
          endGame();
          break;
        }
      }
      
      return updated;
    });

    // Update coins
    setCoins(prev => {
      let coinsCollected = 0;
      const newParticles: Particle[] = [];
      
      const updated = prev
        .map(coin => {
          if (!coin.collected && checkCoinCollision(player, coin)) {
            coinsCollected++;
            audioManager.playCoin();
            newParticles.push(...createCoinParticles(coin.x + coin.width / 2, coin.y + coin.height / 2));
            return { ...coin, collected: true };
          }
          return { 
            ...coin, 
            x: coin.x - gameState.speed,
            animationFrame: (coin.animationFrame + 0.2) % 8,
          };
        })
        .filter(coin => coin.x > -50 && !coin.collected);
      
      if (coinsCollected > 0) {
        setGameState(gs => ({ ...gs, coins: gs.coins + coinsCollected }));
        setParticles(p => [...p, ...newParticles]);
      }
      
      return updated;
    });

    // Update particles
    setParticles(prev => 
      prev
        .map(p => ({
          ...p,
          x: p.x + p.velocityX,
          y: p.y + p.velocityY,
          life: p.life - 1,
        }))
        .filter(p => p.life > 0)
    );

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, generateObstacle, generateCoin, checkCollision, checkCoinCollision, createCoinParticles, endGame]);

  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameState.isPaused, gameLoop]);

  return {
    gameState,
    player,
    obstacles,
    coins,
    particles,
    jump,
    startGame,
    pauseGame,
    revive,
  };
}
