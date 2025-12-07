import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Player, Obstacle, Particle } from '@/types/game';

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
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const obstacleTimerRef = useRef<number>(0);

  const generateObstacle = useCallback((gameSpeed: number): Obstacle => {
    const types: Obstacle['type'][] = ['spike', 'block'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let width = 30;
    let height = 40;
    
    if (type === 'block') {
      width = 40 + Math.random() * 20;
      height = 30 + Math.random() * 30;
    } else if (type === 'spike') {
      width = 25;
      height = 35;
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      x: 900,
      y: GROUND_Y - height,
      width,
      height,
      type,
      passed: false,
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

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    
    setPlayer(prev => {
      if (prev.isOnGround) {
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
    setGameState({
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: 0,
      distance: 0,
      speed: INITIAL_SPEED,
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
    setParticles([]);
    obstacleTimerRef.current = 0;
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }));
    setParticles(current => [...current, ...createDeathParticles(player.x, player.y)]);
  }, [player.x, player.y, createDeathParticles]);

  const revive = useCallback(() => {
    if (!gameState.canRevive || gameState.hasRevived) return;
    
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
    const deltaTime = timestamp - lastTimeRef.current;
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

      // Animation frame
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
        score: Math.floor((prev.distance + newSpeed) / 10),
        speed: newSpeed,
      };
    });

    // Generate obstacles
    obstacleTimerRef.current += 1;
    const minInterval = Math.max(60, 120 - gameState.speed * 5);
    
    if (obstacleTimerRef.current >= minInterval + Math.random() * 60) {
      obstacleTimerRef.current = 0;
      setObstacles(prev => [...prev, generateObstacle(gameState.speed)]);
    }

    // Update obstacles and check collisions
    setObstacles(prev => {
      const updated = prev
        .map(obs => ({ ...obs, x: obs.x - gameState.speed }))
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
  }, [gameState, player, generateObstacle, checkCollision, endGame]);

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
    particles,
    jump,
    startGame,
    pauseGame,
    revive,
  };
}
