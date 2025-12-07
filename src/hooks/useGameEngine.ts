import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Player, Obstacle, Particle, Coin, PowerUp, PowerUpType, WorldTheme, WORLD_CONFIGS } from '@/types/game';
import { audioManager } from '@/lib/audioManager';

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const GROUND_Y = 280;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 40;
const INITIAL_SPEED = 5;
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.001;
const POWERUP_DURATION = 300; // frames (~5 seconds at 60fps)

export function useGameEngine(selectedSkin: string, currentWorld: WorldTheme = 'city') {
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
    multiplier: 1,
    world: currentWorld,
    activePowerUps: [],
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
    hasShield: false,
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const obstacleTimerRef = useRef<number>(0);
  const coinTimerRef = useRef<number>(0);
  const powerUpTimerRef = useRef<number>(0);

  const hasMagnet = gameState.activePowerUps.some(p => p.type === 'magnet');
  const hasShield = gameState.activePowerUps.some(p => p.type === 'shield');

  const generateObstacle = useCallback((): Obstacle => {
    const types: Obstacle['type'][] = ['spike', 'block', 'flying', 'double', 'moving'];
    const weights = [30, 25, 20, 15, 10];
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
    let width = 30, height = 40, y = GROUND_Y - 40;
    let velocityY = 0, minY = 0, maxY = 0;
    
    switch (type) {
      case 'spike': width = 25; height = 35; y = GROUND_Y - height; break;
      case 'block': width = 40 + Math.random() * 20; height = 30 + Math.random() * 30; y = GROUND_Y - height; break;
      case 'flying': width = 35; height = 25; y = GROUND_Y - 80 - Math.random() * 60; break;
      case 'double': width = 25; height = 35; y = GROUND_Y - height; break;
      case 'moving': width = 30; height = 30; minY = GROUND_Y - 100; maxY = GROUND_Y - 40; y = (minY + maxY) / 2; velocityY = 2; break;
    }

    return { id: Math.random().toString(36).substr(2, 9), x: 900, y, width, height, type, passed: false, velocityY, minY, maxY };
  }, []);

  const generateCoin = useCallback((): Coin => {
    const y = GROUND_Y - 40 - Math.random() * 80;
    return { id: Math.random().toString(36).substr(2, 9), x: 900, y, width: 20, height: 20, collected: false, animationFrame: 0 };
  }, []);

  const generatePowerUp = useCallback((): PowerUp => {
    const types: PowerUpType[] = ['shield', 'magnet', 'multiplier'];
    const type = types[Math.floor(Math.random() * types.length)];
    const y = GROUND_Y - 60 - Math.random() * 60;
    return { id: Math.random().toString(36).substr(2, 9), x: 900, y, width: 28, height: 28, type, collected: false };
  }, []);

  const createParticles = useCallback((x: number, y: number, colors: string[], count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      newParticles.push({
        id: Math.random().toString(36).substr(2, 9),
        x, y,
        velocityX: Math.cos(angle) * (2 + Math.random() * 2),
        velocityY: Math.sin(angle) * (2 + Math.random() * 2),
        life: 25, maxLife: 25, size: 4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return newParticles;
  }, []);

  const checkCollision = useCallback((p: Player, obj: { x: number; y: number; width: number; height: number }): boolean => {
    const padding = 5;
    return p.x + padding < obj.x + obj.width && p.x + p.width - padding > obj.x && p.y + padding < obj.y + obj.height && p.y + p.height - padding > obj.y;
  }, []);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    
    setPlayer(prev => {
      if (prev.isOnGround) {
        audioManager.playJump();
        setParticles(current => [...current, ...createParticles(prev.x + PLAYER_WIDTH / 2, prev.y + PLAYER_HEIGHT, ['#8B7355'], 5)]);
        return { ...prev, velocityY: JUMP_FORCE, isJumping: true, isOnGround: false };
      }
      return prev;
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, createParticles]);

  const startGame = useCallback(() => {
    audioManager.resumeContext();
    audioManager.startBGM();
    
    setGameState({
      isPlaying: true, isPaused: false, isGameOver: false,
      score: 0, distance: 0, speed: INITIAL_SPEED, coins: 0,
      canRevive: true, hasRevived: false, multiplier: 1,
      world: currentWorld, activePowerUps: [],
    });
    setPlayer({
      x: 80, y: GROUND_Y - PLAYER_HEIGHT, width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
      velocityY: 0, isJumping: false, isOnGround: true,
      frameIndex: 0, frameTimer: 0, hasShield: false,
    });
    setObstacles([]);
    setCoins([]);
    setPowerUps([]);
    setParticles([]);
    obstacleTimerRef.current = 0;
    coinTimerRef.current = 0;
    powerUpTimerRef.current = 0;
  }, [currentWorld]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const endGame = useCallback(() => {
    audioManager.playDeath();
    audioManager.stopBGM();
    setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }));
    setParticles(current => [...current, ...createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, ['#FF6B6B', '#FFE66D', '#4ECDC4'], 20)]);
  }, [player.x, player.y, createParticles]);

  const revive = useCallback(() => {
    if (!gameState.canRevive || gameState.hasRevived) return;
    audioManager.startBGM();
    setGameState(prev => ({ ...prev, isPlaying: true, isGameOver: false, hasRevived: true, canRevive: false }));
    setPlayer(prev => ({ ...prev, y: GROUND_Y - PLAYER_HEIGHT, velocityY: 0, isJumping: false, isOnGround: true }));
    setObstacles([]);
  }, [gameState.canRevive, gameState.hasRevived]);

  const activatePowerUp = useCallback((type: PowerUpType) => {
    audioManager.playCoin();
    setGameState(prev => {
      const existing = prev.activePowerUps.find(p => p.type === type);
      if (existing) {
        return {
          ...prev,
          activePowerUps: prev.activePowerUps.map(p => p.type === type ? { ...p, remainingTime: POWERUP_DURATION } : p),
        };
      }
      return { ...prev, activePowerUps: [...prev.activePowerUps, { type, remainingTime: POWERUP_DURATION }] };
    });
  }, []);

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
      if (newFrameTimer >= 6) { newFrameTimer = 0; newFrameIndex = (prev.frameIndex + 1) % 4; }

      return { ...prev, y: newY, velocityY: newVelocityY, isOnGround, isJumping: !isOnGround, frameIndex: newFrameIndex, frameTimer: newFrameTimer, hasShield: hasShield };
    });

    // Update game state
    setGameState(prev => {
      const newSpeed = Math.min(prev.speed + SPEED_INCREMENT, MAX_SPEED);
      const baseScore = Math.floor((prev.distance + newSpeed) / 10);
      const multiplier = prev.activePowerUps.some(p => p.type === 'multiplier') ? 2 : 1;
      
      // Update power-up timers
      const updatedPowerUps = prev.activePowerUps
        .map(p => ({ ...p, remainingTime: p.remainingTime - 1 }))
        .filter(p => p.remainingTime > 0);
      
      // Check for world changes based on distance
      let newWorld = prev.world;
      const totalDist = prev.distance + newSpeed;
      if (totalDist >= 50000) newWorld = 'space';
      else if (totalDist >= 30000) newWorld = 'snow';
      else if (totalDist >= 15000) newWorld = 'desert';
      else if (totalDist >= 5000) newWorld = 'forest';
      
      return {
        ...prev,
        distance: prev.distance + newSpeed,
        score: baseScore + prev.coins * 10 * multiplier,
        speed: newSpeed,
        multiplier,
        world: newWorld,
        activePowerUps: updatedPowerUps,
      };
    });

    // Generate obstacles
    obstacleTimerRef.current += 1;
    const minInterval = Math.max(60, 120 - gameState.speed * 5);
    if (obstacleTimerRef.current >= minInterval + Math.random() * 60) {
      obstacleTimerRef.current = 0;
      const newObs = generateObstacle();
      setObstacles(prev => {
        const obs = [...prev, newObs];
        if (newObs.type === 'double') obs.push({ ...newObs, id: Math.random().toString(36).substr(2, 9), x: newObs.x + 50 });
        return obs;
      });
    }

    // Generate coins
    coinTimerRef.current += 1;
    if (coinTimerRef.current >= 50 + Math.random() * 30) {
      coinTimerRef.current = 0;
      setCoins(prev => [...prev, generateCoin()]);
    }

    // Generate power-ups (rare)
    powerUpTimerRef.current += 1;
    if (powerUpTimerRef.current >= 400 + Math.random() * 200) {
      powerUpTimerRef.current = 0;
      setPowerUps(prev => [...prev, generatePowerUp()]);
    }

    // Update obstacles
    setObstacles(prev => {
      const updated = prev.map(obs => {
        let newY = obs.y;
        let newVelocityY = obs.velocityY || 0;
        if (obs.type === 'moving' && obs.minY !== undefined && obs.maxY !== undefined) {
          newY += newVelocityY;
          if (newY <= obs.minY || newY >= obs.maxY) newVelocityY = -newVelocityY;
        }
        return { ...obs, x: obs.x - gameState.speed, y: newY, velocityY: newVelocityY };
      }).filter(obs => obs.x > -100);
      
      for (const obs of updated) {
        if (checkCollision(player, obs)) {
          if (hasShield) {
            setGameState(gs => ({ ...gs, activePowerUps: gs.activePowerUps.filter(p => p.type !== 'shield') }));
            setParticles(p => [...p, ...createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, ['#00BFFF', '#87CEEB'], 10)]);
            return updated.filter(o => o.id !== obs.id);
          }
          endGame();
          break;
        }
      }
      return updated;
    });

    // Update coins with magnet effect
    setCoins(prev => {
      let coinsCollected = 0;
      const newParticles: Particle[] = [];
      
      const updated = prev.map(coin => {
        let newX = coin.x - gameState.speed;
        let newY = coin.y;
        
        // Magnet effect
        if (hasMagnet && !coin.collected) {
          const dx = player.x + PLAYER_WIDTH / 2 - (coin.x + coin.width / 2);
          const dy = player.y + PLAYER_HEIGHT / 2 - (coin.y + coin.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            newX += (dx / dist) * 8;
            newY += (dy / dist) * 8;
          }
        }
        
        if (!coin.collected && checkCollision(player, { ...coin, x: newX, y: newY })) {
          coinsCollected++;
          audioManager.playCoin();
          newParticles.push(...createParticles(coin.x + coin.width / 2, coin.y + coin.height / 2, ['#FFD700', '#FFA500'], 8));
          return { ...coin, collected: true };
        }
        return { ...coin, x: newX, y: newY, animationFrame: (coin.animationFrame + 0.2) % 8 };
      }).filter(coin => coin.x > -50 && !coin.collected);
      
      if (coinsCollected > 0) {
        setGameState(gs => ({ ...gs, coins: gs.coins + coinsCollected }));
        setParticles(p => [...p, ...newParticles]);
      }
      return updated;
    });

    // Update power-ups
    setPowerUps(prev => {
      const updated = prev.map(pu => {
        if (!pu.collected && checkCollision(player, pu)) {
          activatePowerUp(pu.type);
          setParticles(p => [...p, ...createParticles(pu.x + pu.width / 2, pu.y + pu.height / 2, ['#FF00FF', '#00FFFF', '#FFFF00'], 12)]);
          return { ...pu, collected: true };
        }
        return { ...pu, x: pu.x - gameState.speed };
      }).filter(pu => pu.x > -50 && !pu.collected);
      return updated;
    });

    // Update particles
    setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.velocityX, y: p.y + p.velocityY, life: p.life - 1 })).filter(p => p.life > 0));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, hasMagnet, hasShield, generateObstacle, generateCoin, generatePowerUp, checkCollision, createParticles, activatePowerUp, endGame]);

  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameState.isPlaying, gameState.isPaused, gameLoop]);

  return { gameState, player, obstacles, coins, powerUps, particles, jump, startGame, pauseGame, revive };
}
