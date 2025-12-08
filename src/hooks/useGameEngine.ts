import { useState, useCallback, useRef, useEffect } from 'react';
import { GameState, Player, Obstacle, Particle, Coin, PowerUp, PowerUpType, WorldTheme, PlayerProjectile, WeaponPowerUp, WeaponType, WEAPON_CONFIGS, COMBO_TIMEOUT, MAX_COMBO, COMBO_DAMAGE_MULTIPLIERS } from '@/types/game';
import { Boss, BossProjectile, BOSS_CONFIGS, BossArenaState, ARENA_TRIGGER_DISTANCE, ARENA_BREAK_DURATION, ARENA_BOSS_SEQUENCE, getArenaBossConfig } from '@/types/boss';
import { audioManager } from '@/lib/audioManager';

const GRAVITY = 0.8;
const JUMP_FORCE = -15;
const DOUBLE_JUMP_FORCE = -12;
const GROUND_Y = 280;
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 40;
const INITIAL_SPEED = 5;
const MAX_SPEED = 12;
const SPEED_INCREMENT = 0.001;
const POWERUP_DURATION = 300; // frames (~5 seconds at 60fps)

interface SkinAbilities {
  speedBonus: number;
  coinMultiplier: number;
  jumpPowerBonus: number;
  shieldDurationBonus: number;
}

interface GameEngineOptions {
  isVip?: boolean;
  onPlayerDamage?: () => void;
  onBossDefeat?: (bossType: string) => void;
  onPlayerHit?: () => void;
  onBossHit?: () => void;
  onPowerUpCollect?: (type: string, x: number, y: number) => void;
  onWeaponCollect?: (type: string, x: number, y: number) => void;
  onBossSpawn?: (bossType: string) => void;
  onPhaseTransition?: (bossType: string, phase: number) => void;
}

export function useGameEngine(selectedSkin: string, currentWorld: WorldTheme = 'city', skinAbilities: SkinAbilities = { speedBonus: 0, coinMultiplier: 1, jumpPowerBonus: 0, shieldDurationBonus: 0 }, options: GameEngineOptions = {}) {
  const { isVip = false, onPlayerDamage, onBossDefeat, onPlayerHit, onBossHit, onPowerUpCollect, onWeaponCollect, onBossSpawn, onPhaseTransition } = options;
  const [justPickedUpWeapon, setJustPickedUpWeapon] = useState(false);
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
    activeWeapon: null,
    weaponAmmo: 0,
    comboCount: 0,
    comboTimer: 0,
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
    doubleJumpAvailable: true,
    hasDoubleJumped: false,
  });

  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [weaponPowerUps, setWeaponPowerUps] = useState<WeaponPowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [playerProjectiles, setPlayerProjectiles] = useState<PlayerProjectile[]>([]);
  const [boss, setBoss] = useState<Boss | null>(null);
  const [defeatedBosses, setDefeatedBosses] = useState<string[]>([]);
  const [bossRewards, setBossRewards] = useState<{ coins: number; xp: number } | null>(null);
  const [bossWarning, setBossWarning] = useState<{ name: string; countdown: number } | null>(null);
  const [bossArena, setBossArena] = useState<BossArenaState | null>(null);
  const [rushModeEnabled, setRushModeEnabled] = useState(false);
  const [endlessModeEnabled, setEndlessModeEnabled] = useState(false);
  
  // Kill cam state for slow-motion effect
  const [killCam, setKillCam] = useState<{ isActive: boolean; bossType: string; startTime: number; bossX: number; bossY: number } | null>(null);
  
  // Environmental hazards state
  const [environmentalHazards, setEnvironmentalHazards] = useState<{ id: string; x: number; y: number; width: number; height: number; type: 'fire' | 'electric' | 'void'; damage: number; timer: number }[]>([]);
  
  // Boss rage meter state
  const [bossRage, setBossRage] = useState<{ current: number; max: number; isEnraged: boolean }>({ current: 0, max: 100, isEnraged: false });
  
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const obstacleTimerRef = useRef<number>(0);
  const coinTimerRef = useRef<number>(0);
  const powerUpTimerRef = useRef<number>(0);
  const weaponTimerRef = useRef<number>(0);
  const bossSpawnedRef = useRef<Set<string>>(new Set());
  const arenaTriggeredRef = useRef<boolean>(false);
  const lastBossHitRef = useRef<number>(0);
  
  const toggleRushMode = useCallback(() => {
    if (!endlessModeEnabled) {
      setRushModeEnabled(prev => !prev);
    }
  }, [endlessModeEnabled]);

  const toggleEndlessMode = useCallback(() => {
    if (!rushModeEnabled) {
      setEndlessModeEnabled(prev => !prev);
    }
  }, [rushModeEnabled]);

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

  const generateWeaponPowerUp = useCallback((): WeaponPowerUp => {
    const types: WeaponType[] = ['fireball', 'laser', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    // Spawn weapon power-ups lower so they're easier to collect while running
    const y = GROUND_Y - 45 - Math.random() * 30;
    return { id: Math.random().toString(36).substr(2, 9), x: 900, y, width: 32, height: 32, type, collected: false };
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

  const checkCollision = useCallback((p: Player | { x: number; y: number; width: number; height: number }, obj: { x: number; y: number; width: number; height: number }): boolean => {
    const padding = 5;
    return p.x + padding < obj.x + obj.width && p.x + ('width' in p ? p.width : 32) - padding > obj.x && p.y + padding < obj.y + obj.height && p.y + ('height' in p ? p.height : 40) - padding > obj.y;
  }, []);

  const jump = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    
    const jumpForceWithBonus = JUMP_FORCE * (1 + skinAbilities.jumpPowerBonus / 100);
    const doubleJumpForceWithBonus = DOUBLE_JUMP_FORCE * (1 + skinAbilities.jumpPowerBonus / 100);
    
    setPlayer(prev => {
      // First jump from ground
      if (prev.isOnGround) {
        audioManager.playJump();
        setParticles(current => [...current, ...createParticles(prev.x + PLAYER_WIDTH / 2, prev.y + PLAYER_HEIGHT, ['#8B7355'], 5)]);
        return { ...prev, velocityY: jumpForceWithBonus, isJumping: true, isOnGround: false, hasDoubleJumped: false, doubleJumpAvailable: true };
      }
      // Double jump in air
      else if (prev.doubleJumpAvailable && !prev.hasDoubleJumped) {
        audioManager.playJump();
        setParticles(current => [...current, ...createParticles(prev.x + PLAYER_WIDTH / 2, prev.y + PLAYER_HEIGHT, ['#00FFFF', '#FF00FF'], 8)]);
        return { ...prev, velocityY: doubleJumpForceWithBonus, hasDoubleJumped: true, doubleJumpAvailable: false };
      }
      return prev;
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, createParticles, skinAbilities.jumpPowerBonus]);

  const attack = useCallback(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) return;
    if (!boss && !bossArena?.isActive) return; // Only attack during boss fights
    
    setPlayer(currentPlayer => {
      // Check if we have a weapon
      if (gameState.activeWeapon && gameState.weaponAmmo > 0) {
        const weapon = WEAPON_CONFIGS[gameState.activeWeapon];
        const projectile: PlayerProjectile = {
          id: Math.random().toString(36).substr(2, 9),
          x: currentPlayer.x + currentPlayer.width,
          y: currentPlayer.y + currentPlayer.height / 2 - 8,
          width: gameState.activeWeapon === 'bomb' ? 24 : 16,
          height: gameState.activeWeapon === 'bomb' ? 24 : 12,
          velocityX: weapon.speed,
          velocityY: 0,
          type: gameState.activeWeapon,
          damage: weapon.damage,
        };
        
        setPlayerProjectiles(prev => [...prev, projectile]);
        setGameState(gs => ({
          ...gs,
          weaponAmmo: gs.weaponAmmo - 1,
          activeWeapon: gs.weaponAmmo - 1 <= 0 ? null : gs.activeWeapon,
        }));
        audioManager.playCoin(); // Use coin sound for now
      } else {
        // Default energy shot (always available during boss fights)
        const projectile: PlayerProjectile = {
          id: Math.random().toString(36).substr(2, 9),
          x: currentPlayer.x + currentPlayer.width,
          y: currentPlayer.y + currentPlayer.height / 2 - 6,
          width: 12,
          height: 8,
          velocityX: 12,
          velocityY: 0,
          type: 'energy',
          damage: 1,
        };
        setPlayerProjectiles(prev => [...prev, projectile]);
        audioManager.playCoin();
      }
      
      return currentPlayer;
    });
  }, [gameState.isPlaying, gameState.isPaused, gameState.isGameOver, gameState.activeWeapon, gameState.weaponAmmo, boss, bossArena]);

  const startGame = useCallback(() => {
    audioManager.resumeContext();
    audioManager.startBGM();
    
    setGameState({
      isPlaying: true, isPaused: false, isGameOver: false,
      score: 0, distance: 0, speed: INITIAL_SPEED, coins: 0,
      canRevive: true, hasRevived: false, multiplier: 1,
      world: currentWorld, activePowerUps: [],
      activeWeapon: null, weaponAmmo: 0,
      comboCount: 0, comboTimer: 0,
    });
    setPlayer({
      x: 80, y: GROUND_Y - PLAYER_HEIGHT, width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
      velocityY: 0, isJumping: false, isOnGround: true,
      frameIndex: 0, frameTimer: 0, hasShield: false,
      doubleJumpAvailable: true, hasDoubleJumped: false,
    });
    setObstacles([]);
    setCoins([]);
    setPowerUps([]);
    setWeaponPowerUps([]);
    setParticles([]);
    setPlayerProjectiles([]);
    setBoss(null);
    setBossRewards(null);
    setBossArena(null);
    bossSpawnedRef.current = new Set();
    arenaTriggeredRef.current = false;
    obstacleTimerRef.current = 0;
    coinTimerRef.current = 0;
    powerUpTimerRef.current = 0;
    weaponTimerRef.current = 0;
    lastBossHitRef.current = 0;
  }, [currentWorld]);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const goHome = useCallback(() => {
    audioManager.stopBGM();
    setGameState({
      isPlaying: false, isPaused: false, isGameOver: false,
      score: 0, distance: 0, speed: INITIAL_SPEED, coins: 0,
      canRevive: true, hasRevived: false, multiplier: 1,
      world: currentWorld, activePowerUps: [],
      activeWeapon: null, weaponAmmo: 0,
      comboCount: 0, comboTimer: 0,
    });
    setPlayer({
      x: 80, y: GROUND_Y - PLAYER_HEIGHT, width: PLAYER_WIDTH, height: PLAYER_HEIGHT,
      velocityY: 0, isJumping: false, isOnGround: true,
      frameIndex: 0, frameTimer: 0, hasShield: false,
      doubleJumpAvailable: true, hasDoubleJumped: false,
    });
    setObstacles([]);
    setCoins([]);
    setPowerUps([]);
    setWeaponPowerUps([]);
    setParticles([]);
    setPlayerProjectiles([]);
    setBoss(null);
    setBossRewards(null);
    setBossArena(null);
    arenaTriggeredRef.current = false;
  }, [currentWorld]);

  const endGame = useCallback(() => {
    audioManager.playDeath();
    audioManager.stopBGM();
    setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }));
    setParticles(current => [...current, ...createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, ['#FF6B6B', '#FFE66D', '#4ECDC4'], 20)]);
    onPlayerDamage?.();
  }, [player.x, player.y, createParticles, onPlayerDamage]);

  const revive = useCallback(() => {
    if (!gameState.canRevive || gameState.hasRevived) return;
    audioManager.startBGM();
    setGameState(prev => ({ ...prev, isPlaying: true, isGameOver: false, hasRevived: true, canRevive: false }));
    setPlayer(prev => ({ ...prev, y: GROUND_Y - PLAYER_HEIGHT, velocityY: 0, isJumping: false, isOnGround: true, hasDoubleJumped: false, doubleJumpAvailable: true }));
    setObstacles([]);
    setPlayerProjectiles([]);
    if (bossArena?.isActive) {
      setBossArena(prev => prev ? { ...prev, hasDied: true } : null);
    }
  }, [gameState.canRevive, gameState.hasRevived, bossArena]);

  const activatePowerUp = useCallback((type: PowerUpType) => {
    audioManager.playCoin();
    const duration = type === 'shield' 
      ? POWERUP_DURATION * (1 + skinAbilities.shieldDurationBonus / 100)
      : POWERUP_DURATION;
    
    setGameState(prev => {
      const existing = prev.activePowerUps.find(p => p.type === type);
      if (existing) {
        return {
          ...prev,
          activePowerUps: prev.activePowerUps.map(p => p.type === type ? { ...p, remainingTime: duration } : p),
        };
      }
      return { ...prev, activePowerUps: [...prev.activePowerUps, { type, remainingTime: duration }] };
    });
  }, [skinAbilities.shieldDurationBonus]);

  const activateWeapon = useCallback((type: WeaponType) => {
    audioManager.playCoin();
    const config = WEAPON_CONFIGS[type];
    setGameState(prev => ({
      ...prev,
      activeWeapon: type,
      weaponAmmo: config.ammo,
    }));
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
      let doubleJumpAvailable = prev.doubleJumpAvailable;
      let hasDoubleJumped = prev.hasDoubleJumped;

      if (newY >= GROUND_Y - PLAYER_HEIGHT) {
        newY = GROUND_Y - PLAYER_HEIGHT;
        newVelocityY = 0;
        isOnGround = true;
        doubleJumpAvailable = true;
        hasDoubleJumped = false;
      }

      let newFrameTimer = prev.frameTimer + 1;
      let newFrameIndex = prev.frameIndex;
      if (newFrameTimer >= 6) { newFrameTimer = 0; newFrameIndex = (prev.frameIndex + 1) % 4; }

      return { ...prev, y: newY, velocityY: newVelocityY, isOnGround, isJumping: !isOnGround, frameIndex: newFrameIndex, frameTimer: newFrameTimer, hasShield: hasShield, doubleJumpAvailable, hasDoubleJumped };
    });

    // Update game state (including combo timer)
    setGameState(prev => {
      const speedWithBonus = SPEED_INCREMENT * (1 + skinAbilities.speedBonus / 100);
      const newSpeed = Math.min(prev.speed + speedWithBonus, MAX_SPEED * (1 + skinAbilities.speedBonus / 200));
      const baseScore = Math.floor((prev.distance + newSpeed) / 10);
      const multiplier = prev.activePowerUps.some(p => p.type === 'multiplier') ? 2 : 1;
      
      const updatedPowerUps = prev.activePowerUps
        .map(p => ({ ...p, remainingTime: p.remainingTime - 1 }))
        .filter(p => p.remainingTime > 0);
      
      let newWorld = prev.world;
      const totalDist = prev.distance + newSpeed;
      if (totalDist >= 50000) newWorld = 'space';
      else if (totalDist >= 30000) newWorld = 'snow';
      else if (totalDist >= 15000) newWorld = 'desert';
      else if (totalDist >= 5000) newWorld = 'forest';
      
      // Update combo timer
      let comboCount = prev.comboCount;
      let comboTimer = prev.comboTimer;
      if (comboTimer > 0) {
        comboTimer -= 1;
        if (comboTimer <= 0) {
          comboCount = 0;
        }
      }
      
      return {
        ...prev,
        distance: prev.distance + newSpeed,
        score: baseScore + prev.coins * 10 * multiplier,
        speed: newSpeed,
        multiplier,
        world: newWorld,
        activePowerUps: updatedPowerUps,
        comboCount,
        comboTimer,
      };
    });

    // Check for boss arena trigger
    const currentDistance = gameState.distance;
    
    if (!arenaTriggeredRef.current && currentDistance >= ARENA_TRIGGER_DISTANCE && !bossArena && !boss) {
      arenaTriggeredRef.current = true;
      setBossArena({
        isActive: true,
        currentBossIndex: 0,
        bossesDefeated: [],
        breakTimer: 0,
        totalRewards: { coins: 0, xp: 0 },
        arenaStartDistance: currentDistance,
        hasDied: false,
        isRushMode: rushModeEnabled,
        isEndlessMode: endlessModeEnabled,
        endlessWave: 0,
        startTime: Date.now(),
      });
      audioManager.playBossWarning();
    }
    
    // Handle Boss Arena Mode
    if (bossArena?.isActive) {
      if (bossArena.breakTimer > 0 && !bossArena.isRushMode && !bossArena.isEndlessMode) {
        setBossArena(prev => prev ? { ...prev, breakTimer: prev.breakTimer - 1 } : null);
        
        if (bossArena.breakTimer === 1 && bossArena.currentBossIndex < ARENA_BOSS_SEQUENCE.length) {
          const nextBossType = ARENA_BOSS_SEQUENCE[bossArena.currentBossIndex];
          const bossConfig = getArenaBossConfig(nextBossType, bossArena.currentBossIndex, bossArena.isRushMode, bossArena.endlessWave);
          setBoss({
            id: bossConfig.type,
            x: 850,
            y: GROUND_Y - bossConfig.height,
            width: bossConfig.width,
            height: bossConfig.height,
            health: bossConfig.health,
            maxHealth: bossConfig.health,
            type: bossConfig.type,
            phase: 1,
            attackTimer: bossConfig.attackInterval,
            isAttacking: false,
            projectiles: [],
          });
          onBossSpawn?.(bossConfig.type);
          if (isVip && !bossArena.isRushMode && !bossArena.isEndlessMode) {
            activatePowerUp('shield');
          }
        }
      }
      else if (!boss && bossArena.currentBossIndex === 0 && bossArena.bossesDefeated.length === 0) {
        const firstBossType = ARENA_BOSS_SEQUENCE[0];
        const bossConfig = getArenaBossConfig(firstBossType, 0, bossArena.isRushMode, bossArena.endlessWave);
        setBoss({
          id: bossConfig.type,
          x: 850,
          y: GROUND_Y - bossConfig.height,
          width: bossConfig.width,
          height: bossConfig.height,
          health: bossConfig.health,
          maxHealth: bossConfig.health,
          type: bossConfig.type,
          phase: 1,
          attackTimer: bossConfig.attackInterval,
          isAttacking: false,
          projectiles: [],
        });
        onBossSpawn?.(bossConfig.type);
        if (isVip && !bossArena.isRushMode && !bossArena.isEndlessMode) {
          activatePowerUp('shield');
        }
      }
      else if (!boss && (bossArena.isRushMode || bossArena.isEndlessMode) && bossArena.bossesDefeated.length > 0) {
        const nextBossType = ARENA_BOSS_SEQUENCE[bossArena.currentBossIndex % ARENA_BOSS_SEQUENCE.length];
        const bossConfig = getArenaBossConfig(nextBossType, bossArena.currentBossIndex, bossArena.isRushMode, bossArena.endlessWave);
        setBoss({
          id: `${bossConfig.type}_wave${bossArena.endlessWave}`,
          x: 850,
          y: GROUND_Y - bossConfig.height,
          width: bossConfig.width,
          height: bossConfig.height,
          health: bossConfig.health,
          maxHealth: bossConfig.health,
          type: bossConfig.type,
          phase: 1,
          attackTimer: bossConfig.attackInterval,
          isAttacking: false,
          projectiles: [],
        });
        onBossSpawn?.(bossConfig.type);
      }
    }
    
    // Legacy boss spawn
    if (!bossArena) {
      for (const bossConfig of BOSS_CONFIGS) {
        const warningDistance = bossConfig.triggerDistance - 200;
        
        if (!bossSpawnedRef.current.has(bossConfig.type) && 
            currentDistance >= warningDistance && 
            currentDistance < bossConfig.triggerDistance &&
            !bossWarning) {
          const countdown = Math.ceil((bossConfig.triggerDistance - currentDistance) / gameState.speed / 60);
          setBossWarning({ name: bossConfig.name, countdown: Math.max(1, countdown) });
          audioManager.playBossWarning();
        }
        
        if (!bossSpawnedRef.current.has(bossConfig.type) && 
            currentDistance >= bossConfig.triggerDistance && 
            currentDistance < bossConfig.triggerDistance + 100) {
          bossSpawnedRef.current.add(bossConfig.type);
          setBossWarning(null);
          setBoss({
            id: bossConfig.type,
            x: 850,
            y: GROUND_Y - bossConfig.height,
            width: bossConfig.width,
            height: bossConfig.height,
            health: bossConfig.health,
            maxHealth: bossConfig.health,
            type: bossConfig.type,
            phase: 1,
            attackTimer: bossConfig.attackInterval,
            isAttacking: false,
            projectiles: [],
          });
          onBossSpawn?.(bossConfig.type);
        }
      }
    }
    
    if (bossWarning && bossWarning.countdown > 0) {
      setBossWarning(prev => prev ? { ...prev, countdown: Math.max(0, prev.countdown - 0.016) } : null);
    }

    // Generate obstacles (skip during boss fight or arena mode)
    if (!boss && !bossArena?.isActive) {
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
    }

    // Generate coins
    coinTimerRef.current += 1;
    const coinInterval = bossArena?.isActive ? 80 : 50;
    if (coinTimerRef.current >= coinInterval + Math.random() * 30) {
      coinTimerRef.current = 0;
      setCoins(prev => [...prev, generateCoin()]);
    }

    // Generate power-ups
    powerUpTimerRef.current += 1;
    const powerUpInterval = bossArena?.isActive ? 600 : 400;
    if (powerUpTimerRef.current >= powerUpInterval + Math.random() * 200) {
      powerUpTimerRef.current = 0;
      setPowerUps(prev => [...prev, generatePowerUp()]);
    }

    // Generate weapon power-ups (only during boss fights)
    if (boss || bossArena?.isActive) {
      weaponTimerRef.current += 1;
      if (weaponTimerRef.current >= 300 + Math.random() * 200) {
        weaponTimerRef.current = 0;
        setWeaponPowerUps(prev => [...prev, generateWeaponPowerUp()]);
      }
    }

    // Update player projectiles and check boss collision
    setPlayerProjectiles(prev => {
      let updated = prev.map(p => ({ ...p, x: p.x + p.velocityX, y: p.y + p.velocityY }))
        .filter(p => p.x < 900);
      
      // Check collision with boss
      if (boss) {
        for (const proj of updated) {
          if (proj.x < boss.x + boss.width && proj.x + proj.width > boss.x &&
              proj.y < boss.y + boss.height && proj.y + proj.height > boss.y) {
            // Hit boss!
            setBoss(prevBoss => {
              if (!prevBoss) return null;
              
              // Apply combo multiplier
              const comboDamage = proj.damage * COMBO_DAMAGE_MULTIPLIERS[Math.min(gameState.comboCount, MAX_COMBO - 1)];
              const newHealth = prevBoss.health - comboDamage;
              
              // Update combo
              setGameState(gs => ({
                ...gs,
                comboCount: Math.min(gs.comboCount + 1, MAX_COMBO),
                comboTimer: COMBO_TIMEOUT,
              }));
              
              setParticles(p => [...p, ...createParticles(proj.x, proj.y, ['#FF4444', '#FF8844', '#FFCC44'], 12)]);
              audioManager.playBossHit();
              onBossHit?.();
              
              if (newHealth <= 0) {
                // Boss defeated - trigger kill cam
                setKillCam({
                  isActive: true,
                  bossType: prevBoss.type,
                  startTime: Date.now(),
                  bossX: prevBoss.x + prevBoss.width / 2,
                  bossY: prevBoss.y + prevBoss.height / 2,
                });
                
                // Clear environmental hazards and reset rage
                setEnvironmentalHazards([]);
                setBossRage({ current: 0, max: 100, isEnraged: false });
                
                const bossConfig = bossArena 
                  ? getArenaBossConfig(prevBoss.type, bossArena.currentBossIndex, bossArena.isRushMode, bossArena.endlessWave)
                  : BOSS_CONFIGS.find(c => c.type === prevBoss.type)!;
                setBossRewards({ coins: bossConfig.rewardCoins, xp: bossConfig.rewardXP });
                setGameState(gs => ({ ...gs, coins: gs.coins + bossConfig.rewardCoins, comboCount: 0, comboTimer: 0 }));
                setDefeatedBosses(prev => [...prev, prevBoss.type]);
                setParticles(p => [...p, ...createParticles(prevBoss.x + prevBoss.width / 2, prevBoss.y + prevBoss.height / 2, ['#FFD700', '#FF4444', '#9933FF'], 30)]);
                audioManager.playBossDefeated();
                onBossDefeat?.(prevBoss.type);
                
                handleBossDefeat(prevBoss);
                return null;
              }
              
              if (newHealth <= prevBoss.maxHealth / 2 && prevBoss.phase === 1) {
                onPhaseTransition?.(prevBoss.type, 2);
                return { ...prevBoss, health: newHealth, phase: 2 };
              }
              
              return { ...prevBoss, health: newHealth };
            });
            
            // Remove projectile on hit
            updated = updated.filter(p => p.id !== proj.id);
          }
        }
        
        // Also check collision with boss projectiles (destroy them with bomb)
        if (boss) {
          for (const proj of updated) {
            if (proj.type === 'bomb') {
              setBoss(prevBoss => {
                if (!prevBoss) return null;
                const newProjectiles = prevBoss.projectiles.filter(bp => {
                  const dist = Math.sqrt(Math.pow(bp.x - proj.x, 2) + Math.pow(bp.y - proj.y, 2));
                  return dist > 60; // Bomb blast radius
                });
                return { ...prevBoss, projectiles: newProjectiles };
              });
            }
          }
        }
      }
      
      return updated;
    });

    // Update boss
    if (boss) {
      setBoss(prevBoss => {
        if (!prevBoss) return null;
        
        let newBoss = { ...prevBoss };
        
        newBoss.attackTimer -= 1;
        if (newBoss.attackTimer <= 0) {
          const bossConfig = BOSS_CONFIGS.find(c => c.type === prevBoss.type)!;
          newBoss.attackTimer = bossConfig.attackInterval / newBoss.phase;
          newBoss.isAttacking = true;
          
          const projectileType = prevBoss.type === 'mech' ? 'laser' : prevBoss.type === 'dragon' ? 'fireball' : 'missile';
          
          // Phase 2 has enhanced attack patterns
          const isPhase2 = newBoss.phase >= 2;
          const newProjectiles: BossProjectile[] = [];
          
          if (isPhase2) {
            // PHASE 2 ATTACK PATTERNS - More projectiles, different patterns
            if (prevBoss.type === 'mech') {
              // Mech Phase 2: Triple laser burst
              const speeds = [-10, -12, -10];
              const offsets = [-30, 0, 30];
              for (let i = 0; i < 3; i++) {
                newProjectiles.push({
                  id: Math.random().toString(36).substr(2, 9),
                  x: prevBoss.x,
                  y: GROUND_Y - 40 + offsets[i],
                  width: 35,
                  height: 15,
                  velocityX: speeds[i],
                  velocityY: 0,
                  type: 'laser',
                });
              }
            } else if (prevBoss.type === 'dragon') {
              // Dragon Phase 2: Fire wave pattern (5 fireballs in arc)
              const arcAngles = [-0.4, -0.2, 0, 0.2, 0.4];
              const baseSpeed = 11;
              for (const angle of arcAngles) {
                newProjectiles.push({
                  id: Math.random().toString(36).substr(2, 9),
                  x: prevBoss.x,
                  y: prevBoss.y + prevBoss.height / 2,
                  width: 28,
                  height: 28,
                  velocityX: Math.cos(Math.PI + angle) * baseSpeed,
                  velocityY: Math.sin(angle) * baseSpeed * 0.6,
                  type: 'fireball',
                });
              }
            } else if (prevBoss.type === 'titan') {
              // Titan Phase 2: Missile barrage + homing missile
              // 3 regular missiles at different heights
              const heights = [GROUND_Y - 30, GROUND_Y - 70, GROUND_Y - 110];
              for (const h of heights) {
                newProjectiles.push({
                  id: Math.random().toString(36).substr(2, 9),
                  x: prevBoss.x,
                  y: h,
                  width: 32,
                  height: 18,
                  velocityX: -13,
                  velocityY: 0,
                  type: 'missile',
                });
              }
              // Plus a tracking missile aimed at player
              const dy = player.y - (prevBoss.y + prevBoss.height / 2);
              const trackingAngle = Math.atan2(dy, player.x - prevBoss.x);
              newProjectiles.push({
                id: Math.random().toString(36).substr(2, 9),
                x: prevBoss.x,
                y: prevBoss.y + prevBoss.height / 2,
                width: 36,
                height: 22,
                velocityX: Math.cos(trackingAngle) * 10,
                velocityY: Math.sin(trackingAngle) * 6,
                type: 'missile',
              });
            }
          } else {
            // PHASE 1 - Original attack patterns
            const projectileVariant = Math.random();
            let targetY: number;
            let velocityY: number = 0;
            
            if (projectileVariant < 0.4) {
              // 40%: Aim at player's current position
              targetY = player.y + PLAYER_HEIGHT / 2;
              const dx = player.x - prevBoss.x;
              const dy = targetY - (prevBoss.y + prevBoss.height / 2);
              const speed = 10;
              const angle = Math.atan2(dy, dx);
              velocityY = Math.sin(angle) * speed * 0.5;
            } else if (projectileVariant < 0.7) {
              // 30%: Ground-level projectile
              targetY = GROUND_Y - 25;
              velocityY = 0;
            } else {
              // 30%: Mid-level projectile
              targetY = GROUND_Y - 60;
              velocityY = 0;
            }
            
            newProjectiles.push({
              id: Math.random().toString(36).substr(2, 9),
              x: prevBoss.x,
              y: targetY,
              width: 30,
              height: 20,
              velocityX: -8,
              velocityY: velocityY,
              type: projectileType,
            });
          }
          
          newBoss.projectiles = [...newBoss.projectiles, ...newProjectiles];
          audioManager.playBossAttack();
        } else {
          newBoss.isAttacking = false;
        }
        
        newBoss.projectiles = newBoss.projectiles
          .map(p => ({ ...p, x: p.x + p.velocityX, y: p.y + p.velocityY }))
          .filter(p => p.x > -50);
        
        // Check projectile collision with player
        for (const projectile of newBoss.projectiles) {
          if (checkCollision(player, projectile)) {
            if (hasShield) {
              setGameState(gs => ({ ...gs, activePowerUps: gs.activePowerUps.filter(p => p.type !== 'shield') }));
              setParticles(p => [...p, ...createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, ['#00BFFF', '#87CEEB'], 10)]);
              newBoss.projectiles = newBoss.projectiles.filter(p => p.id !== projectile.id);
              onPlayerHit?.();
            } else {
              endGame();
              return newBoss;
            }
          }
        }
        
        // Check if player jumped over boss (damage boss with combo)
        const now = Date.now();
        if (player.isJumping && player.y < prevBoss.y - 20 && 
            player.x + player.width > prevBoss.x && player.x < prevBoss.x + prevBoss.width &&
            now - lastBossHitRef.current > 300) { // Prevent multiple hits per jump
          lastBossHitRef.current = now;
          
          // Apply combo damage
          const comboDamage = COMBO_DAMAGE_MULTIPLIERS[Math.min(gameState.comboCount, MAX_COMBO - 1)];
          newBoss.health -= comboDamage;
          
          // Update combo
          setGameState(gs => ({
            ...gs,
            comboCount: Math.min(gs.comboCount + 1, MAX_COMBO),
            comboTimer: COMBO_TIMEOUT,
          }));
          
          setParticles(p => [...p, ...createParticles(prevBoss.x + prevBoss.width / 2, prevBoss.y, ['#FF4444', '#FF8844', '#FFCC44'], 15)]);
          audioManager.playBossHit();
          
          if (newBoss.health <= 0) {
            const bossConfig = bossArena 
              ? getArenaBossConfig(prevBoss.type, bossArena.currentBossIndex, bossArena.isRushMode, bossArena.endlessWave)
              : BOSS_CONFIGS.find(c => c.type === prevBoss.type)!;
            setBossRewards({ coins: bossConfig.rewardCoins, xp: bossConfig.rewardXP });
            setGameState(gs => ({ ...gs, coins: gs.coins + bossConfig.rewardCoins, comboCount: 0, comboTimer: 0 }));
            setDefeatedBosses(prev => [...prev, prevBoss.type]);
            setParticles(p => [...p, ...createParticles(prevBoss.x + prevBoss.width / 2, prevBoss.y + prevBoss.height / 2, ['#FFD700', '#FF4444', '#9933FF'], 30)]);
            audioManager.playBossDefeated();
            onBossDefeat?.(prevBoss.type);
            
            handleBossDefeat(prevBoss);
            return null;
          }
          
          if (newBoss.health <= prevBoss.maxHealth / 2 && prevBoss.phase === 1) {
            onPhaseTransition?.(prevBoss.type, 2);
            newBoss.phase = 2;
          }
        }
        
        // Player collision with boss body
        if (checkCollision(player, prevBoss) && player.y >= prevBoss.y) {
          if (!hasShield) {
            endGame();
          }
        }
        
        return newBoss;
      });
      
      // Update boss rage meter and environmental hazards
      setBossRage(prev => {
        if (!boss) return { current: 0, max: 100, isEnraged: false };
        
        // Rage fills slower - more time between devastating attacks
        const rageIncrement = boss.phase >= 2 ? 0.15 : 0.08; // Reduced from 0.5/0.25
        const newRage = Math.min(prev.current + rageIncrement, prev.max);
        const isNowEnraged = newRage >= prev.max && !prev.isEnraged;
        
        // Trigger rage attack when meter fills
        if (isNowEnraged) {
          // Spawn rage attack - fewer projectiles than before
          setBoss(prevBoss => {
            if (!prevBoss) return null;
            const rageProjectiles: BossProjectile[] = [];
            
            if (prevBoss.type === 'mech') {
              // Mech: Laser barrage (reduced from 7 to 4)
              for (let i = 0; i < 4; i++) {
                rageProjectiles.push({
                  id: Math.random().toString(36).substr(2, 9),
                  x: prevBoss.x,
                  y: GROUND_Y - 40 - i * 40,
                  width: 40,
                  height: 10,
                  velocityX: -12,
                  velocityY: 0,
                  type: 'laser',
                });
              }
            } else if (prevBoss.type === 'dragon') {
              // Dragon: Fire rain (reduced from 8 to 5)
              for (let i = 0; i < 5; i++) {
                rageProjectiles.push({
                  id: Math.random().toString(36).substr(2, 9),
                  x: 150 + i * 120,
                  y: 0,
                  width: 25,
                  height: 25,
                  velocityX: 0,
                  velocityY: 6 + Math.random() * 3,
                  type: 'fireball',
                });
              }
            } else if (prevBoss.type === 'titan') {
              // Titan: Missile storm (reduced from 10 to 6)
              for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * i) / 5 + Math.PI * 0.5;
                rageProjectiles.push({
                  id: Math.random().toString(36).substr(2, 9),
                  x: prevBoss.x,
                  y: prevBoss.y + prevBoss.height / 2,
                  width: 24,
                  height: 14,
                  velocityX: Math.cos(angle) * 10,
                  velocityY: Math.sin(angle) * 6,
                  type: 'missile',
                });
              }
            }
            
            return { ...prevBoss, projectiles: [...prevBoss.projectiles, ...rageProjectiles] };
          });
          
          return { current: 0, max: prev.max, isEnraged: true };
        }
        
        // Reset enraged state after a delay
        if (prev.isEnraged && newRage >= 10) {
          return { current: newRage, max: prev.max, isEnraged: false };
        }
        
        return { current: newRage, max: prev.max, isEnraged: prev.isEnraged };
      });
      
      // Generate environmental hazards based on boss type (less frequent)
      setEnvironmentalHazards(prev => {
        if (!boss) return [];
        
        // Spawn new hazards periodically - reduced from 2% to 0.5%
        const shouldSpawn = Math.random() < 0.005;
        if (!shouldSpawn) {
          // Update existing hazards
          return prev
            .map(h => ({ ...h, x: h.x - gameState.speed * 0.5, timer: h.timer - 1 }))
            .filter(h => h.x > -50 && h.timer > 0);
        }
        
        // Limit max hazards on screen
        if (prev.length >= 2) {
          return prev
            .map(h => ({ ...h, x: h.x - gameState.speed * 0.5, timer: h.timer - 1 }))
            .filter(h => h.x > -50 && h.timer > 0);
        }
        
        const hazardType = boss.type === 'mech' ? 'electric' : boss.type === 'dragon' ? 'fire' : 'void';
        const newHazard = {
          id: Math.random().toString(36).substr(2, 9),
          x: 250 + Math.random() * 350,
          y: GROUND_Y - 12,
          width: 50 + Math.random() * 30, // Smaller hazards
          height: 12,
          type: hazardType as 'fire' | 'electric' | 'void',
          damage: 1,
          timer: 200 + Math.random() * 150, // Shorter duration
        };
        
        return [...prev.map(h => ({ ...h, x: h.x - gameState.speed * 0.5, timer: h.timer - 1 }))
          .filter(h => h.x > -50 && h.timer > 0), newHazard];
      });
      
      // Check hazard collision with player
      for (const hazard of environmentalHazards) {
        if (player.x + player.width > hazard.x && player.x < hazard.x + hazard.width &&
            player.y + player.height > hazard.y) {
          if (!hasShield) {
            onPlayerHit?.();
            // Don't end game, just damage/knockback
            setParticles(p => [...p, ...createParticles(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2, 
              hazard.type === 'fire' ? ['#FF4500', '#FF8C00', '#FFD700'] : 
              hazard.type === 'electric' ? ['#00FFFF', '#FFFF00', '#FFFFFF'] :
              ['#4B0082', '#8B008B', '#9400D3'], 10)]);
          }
        }
      }
      
      // Clear kill cam after duration
      if (killCam && Date.now() - killCam.startTime > 2000) {
        setKillCam(null);
      }
    }

    // Helper function for boss defeat handling
    function handleBossDefeat(defeatedBoss: Boss) {
      if (bossArena?.isActive) {
        const bossConfig = getArenaBossConfig(defeatedBoss.type, bossArena.currentBossIndex, bossArena.isRushMode, bossArena.endlessWave);
        const newBossesDefeated = [...bossArena.bossesDefeated, defeatedBoss.type];
        const baseNewRewards = {
          coins: bossArena.totalRewards.coins + bossConfig.rewardCoins,
          xp: bossArena.totalRewards.xp + bossConfig.rewardXP,
        };
        
        if (bossArena.isEndlessMode) {
          const newWave = bossArena.endlessWave + 1;
          const nextBossIndex = newWave % ARENA_BOSS_SEQUENCE.length;
          setBossArena({
            ...bossArena,
            currentBossIndex: nextBossIndex,
            bossesDefeated: newBossesDefeated,
            totalRewards: baseNewRewards,
            breakTimer: 0,
            endlessWave: newWave,
          });
        } else if (newBossesDefeated.length >= ARENA_BOSS_SEQUENCE.length) {
          const streakMultiplier = bossArena.hasDied ? 1 : 2;
          const rushBonus = bossArena.isRushMode ? 1.5 : 1;
          const finalRewards = {
            coins: Math.floor(baseNewRewards.coins * streakMultiplier * rushBonus),
            xp: Math.floor(baseNewRewards.xp * streakMultiplier * rushBonus),
          };
          
          const bonusCoins = finalRewards.coins - baseNewRewards.coins;
          if (bonusCoins > 0) {
            setGameState(gs => ({ ...gs, coins: gs.coins + bonusCoins }));
          }
          
          setBossArena({
            ...bossArena,
            isActive: false,
            bossesDefeated: newBossesDefeated,
            totalRewards: finalRewards,
            breakTimer: 0,
          });
        } else {
          setBossArena({
            ...bossArena,
            currentBossIndex: bossArena.currentBossIndex + 1,
            bossesDefeated: newBossesDefeated,
            totalRewards: baseNewRewards,
            breakTimer: bossArena.isRushMode ? 0 : ARENA_BREAK_DURATION,
          });
        }
      }
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

    // Update coins
    setCoins(prev => {
      let coinsCollected = 0;
      const newParticles: Particle[] = [];
      
      const updated = prev.map(coin => {
        let newX = coin.x - gameState.speed;
        let newY = coin.y;
        
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
          const vipMultiplier = isVip ? 2 : 1;
          const coinValue = Math.round(1 * skinAbilities.coinMultiplier * vipMultiplier);
          coinsCollected += coinValue;
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
          onPowerUpCollect?.(pu.type, pu.x + pu.width / 2, pu.y + pu.height / 2);
          return { ...pu, collected: true };
        }
        return { ...pu, x: pu.x - gameState.speed };
      }).filter(pu => pu.x > -50 && !pu.collected);
      return updated;
    });

    // Update weapon power-ups
    setWeaponPowerUps(prev => {
      const updated = prev.map(wp => {
        if (!wp.collected && checkCollision(player, wp)) {
          activateWeapon(wp.type);
          setParticles(p => [...p, ...createParticles(wp.x + wp.width / 2, wp.y + wp.height / 2, [WEAPON_CONFIGS[wp.type].color, '#FFFFFF'], 15)]);
          onWeaponCollect?.(wp.type, wp.x + wp.width / 2, wp.y + wp.height / 2);
          setJustPickedUpWeapon(true);
          setTimeout(() => setJustPickedUpWeapon(false), 3000);
          return { ...wp, collected: true };
        }
        return { ...wp, x: wp.x - gameState.speed };
      }).filter(wp => wp.x > -50 && !wp.collected);
      return updated;
    });

    // Update particles
    setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.velocityX, y: p.y + p.velocityY, life: p.life - 1 })).filter(p => p.life > 0));

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, player, hasMagnet, hasShield, boss, bossArena, bossWarning, generateObstacle, generateCoin, generatePowerUp, generateWeaponPowerUp, checkCollision, createParticles, activatePowerUp, activateWeapon, endGame, skinAbilities, isVip, rushModeEnabled, endlessModeEnabled]);

  useEffect(() => {
    if (gameState.isPlaying && !gameState.isPaused) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameState.isPlaying, gameState.isPaused, gameLoop]);

  return { 
    gameState, player, obstacles, coins, powerUps, weaponPowerUps, particles, playerProjectiles, 
    boss, bossRewards, bossWarning, bossArena, defeatedBosses, rushModeEnabled, endlessModeEnabled,
    justPickedUpWeapon, killCam, environmentalHazards, bossRage,
    jump, attack, startGame, pauseGame, revive, goHome, toggleRushMode, toggleEndlessMode 
  };
}
