export interface Boss {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
  type: 'mech' | 'dragon' | 'titan';
  phase: number;
  attackTimer: number;
  isAttacking: boolean;
  projectiles: BossProjectile[];
}

export interface BossProjectile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  type: 'laser' | 'missile' | 'fireball';
}

export interface BossConfig {
  type: Boss['type'];
  name: string;
  triggerDistance: number;
  health: number;
  width: number;
  height: number;
  color: string;
  attackInterval: number;
  rewardCoins: number;
  rewardXP: number;
}

export interface BossArenaState {
  isActive: boolean;
  currentBossIndex: number;
  bossesDefeated: string[];
  breakTimer: number;
  totalRewards: { coins: number; xp: number };
  arenaStartDistance: number;
  hasDied: boolean;
  isRushMode: boolean; // Boss Rush: no breaks, higher difficulty, bigger rewards
  isEndlessMode: boolean; // Endless: bosses keep spawning with increasing difficulty
  endlessWave: number; // Current wave in endless mode
  startTime: number; // Timestamp when arena started (for time tracking)
}

export const RUSH_MODE_MULTIPLIER = 1.5; // 50% more health/rewards in rush mode
export const ENDLESS_DIFFICULTY_SCALE = 0.15; // 15% harder per wave

export const ARENA_TRIGGER_DISTANCE = 5000; // Increased from 2000 - more time to play before boss arena
export const ARENA_BREAK_DURATION = 180; // 3 seconds at 60fps
export const ARENA_BOSS_SEQUENCE: Boss['type'][] = ['mech', 'dragon', 'titan'];

export const BOSS_CONFIGS: BossConfig[] = [
  {
    type: 'mech',
    name: 'CYBER MECH',
    triggerDistance: 3000, // Increased from 1000
    health: 4, // Reduced from 5
    width: 80,
    height: 100,
    color: '#FF4444',
    attackInterval: 150, // Increased from 120 (slower attacks)
    rewardCoins: 100,
    rewardXP: 200,
  },
  {
    type: 'dragon',
    name: 'SHADOW DRAGON',
    triggerDistance: 7000, // Increased from 3000
    health: 6, // Reduced from 8
    width: 100,
    height: 80,
    color: '#9933FF',
    attackInterval: 120, // Increased from 90 (slower attacks)
    rewardCoins: 250,
    rewardXP: 400,
  },
  {
    type: 'titan',
    name: 'COSMIC TITAN',
    triggerDistance: 12000, // Increased from 6000
    health: 10, // Reduced from 12
    width: 120,
    height: 120,
    color: '#FFD700',
    attackInterval: 90, // Increased from 60 (slower attacks)
    rewardCoins: 500,
    rewardXP: 800,
  },
];

export const getArenaBossConfig = (bossType: Boss['type'], bossIndex: number, isRushMode: boolean = false, endlessWave: number = 0): BossConfig => {
  const baseConfig = BOSS_CONFIGS.find(c => c.type === bossType)!;
  const difficultyMultiplier = 1 + bossIndex * 0.25;
  const rushMultiplier = isRushMode ? RUSH_MODE_MULTIPLIER : 1;
  const endlessMultiplier = 1 + (endlessWave * ENDLESS_DIFFICULTY_SCALE);
  
  return {
    ...baseConfig,
    health: Math.ceil(baseConfig.health * difficultyMultiplier * rushMultiplier * endlessMultiplier),
    attackInterval: Math.max(20, Math.floor(baseConfig.attackInterval / (difficultyMultiplier * (isRushMode ? 1.2 : 1) * (1 + endlessWave * 0.05)))),
    rewardCoins: Math.floor(baseConfig.rewardCoins * (1 + bossIndex * 0.5) * rushMultiplier * (1 + endlessWave * 0.3)),
    rewardXP: Math.floor(baseConfig.rewardXP * (1 + bossIndex * 0.5) * rushMultiplier * (1 + endlessWave * 0.3)),
  };
};
