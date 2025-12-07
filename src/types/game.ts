export interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  score: number;
  distance: number;
  speed: number;
  coins: number;
  canRevive: boolean;
  hasRevived: boolean;
  multiplier: number;
  world: WorldTheme;
  activePowerUps: ActivePowerUp[];
  activeWeapon: WeaponType | null;
  weaponAmmo: number;
  comboCount: number;
  comboTimer: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
}

export type PowerUpType = 'shield' | 'magnet' | 'multiplier';
export type WeaponType = 'fireball' | 'laser' | 'bomb';

export type WorldTheme = 'city' | 'forest' | 'desert' | 'snow' | 'space' | 'neon' | 'crystal' | 'volcano';

export interface WorldConfig {
  id: WorldTheme;
  name: string;
  unlockDistance: number;
  colors: {
    sky: string[];
    ground: string;
    groundAccent: string;
    buildings: string;
  };
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  isJumping: boolean;
  isOnGround: boolean;
  frameIndex: number;
  frameTimer: number;
  hasShield: boolean;
  doubleJumpAvailable: boolean;
  hasDoubleJumped: boolean;
}

export interface PlayerProjectile {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  type: 'energy' | WeaponType;
  damage: number;
}

export interface WeaponPowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: WeaponType;
  collected: boolean;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'block' | 'flying' | 'double' | 'moving';
  passed: boolean;
  velocityY?: number;
  minY?: number;
  maxY?: number;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
  animationFrame: number;
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PowerUpType;
  collected: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'score' | 'distance' | 'coins' | 'runs' | 'streak';
  requirement_value: number;
  reward_coins: number;
}

export interface UserAchievement {
  id: string;
  profile_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface CharacterSkin {
  id: string;
  name: string;
  price: number;
  description: string | null;
  is_premium: boolean;
  speed_bonus: number;
  coin_multiplier: number;
  jump_power_bonus: number;
  shield_duration_bonus: number;
}

export interface LeaderboardEntry {
  id: string;
  profile_id: string;
  score: number;
  distance: number;
  character_skin: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  high_score: number;
  total_runs: number;
  total_distance: number;
  coins: number;
  current_world: WorldTheme;
  login_streak: number;
  last_daily_claim: string | null;
  tutorial_completed: boolean;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const WORLD_CONFIGS: Record<WorldTheme, WorldConfig> = {
  city: {
    id: 'city',
    name: 'Night City',
    unlockDistance: 0,
    colors: {
      sky: ['#1a1a2e', '#16213e', '#0f3460'],
      ground: '#3d5a4f',
      groundAccent: '#4a6b5e',
      buildings: '#2d4a6f',
    },
  },
  forest: {
    id: 'forest',
    name: 'Enchanted Forest',
    unlockDistance: 5000,
    colors: {
      sky: ['#1a3320', '#0d2818', '#0a1f12'],
      ground: '#2d4a2f',
      groundAccent: '#3d6a3f',
      buildings: '#1a3a1f',
    },
  },
  desert: {
    id: 'desert',
    name: 'Scorching Desert',
    unlockDistance: 15000,
    colors: {
      sky: ['#4a3728', '#6b4423', '#8b5a2b'],
      ground: '#c4a35a',
      groundAccent: '#d4b36a',
      buildings: '#8b7355',
    },
  },
  snow: {
    id: 'snow',
    name: 'Frozen Peaks',
    unlockDistance: 30000,
    colors: {
      sky: ['#1a2a3a', '#2a3a4a', '#3a4a5a'],
      ground: '#dce5eb',
      groundAccent: '#ecf5fb',
      buildings: '#8a9aaa',
    },
  },
  space: {
    id: 'space',
    name: 'Cosmic Void',
    unlockDistance: 50000,
    colors: {
      sky: ['#0a0015', '#150030', '#1a0040'],
      ground: '#2a1a4a',
      groundAccent: '#3a2a5a',
      buildings: '#4a3a6a',
    },
  },
  neon: {
    id: 'neon',
    name: 'Neon Paradise',
    unlockDistance: 0,
    colors: {
      sky: ['#0f0030', '#1a0050', '#2a0070'],
      ground: '#1a0a2a',
      groundAccent: '#ff00ff',
      buildings: '#00ffff',
    },
  },
  crystal: {
    id: 'crystal',
    name: 'Crystal Caverns',
    unlockDistance: 0,
    colors: {
      sky: ['#0a1a2a', '#1a2a3a', '#2a3a4a'],
      ground: '#4a5a6a',
      groundAccent: '#7affff',
      buildings: '#5a7a9a',
    },
  },
  volcano: {
    id: 'volcano',
    name: 'Volcanic Fury',
    unlockDistance: 0,
    colors: {
      sky: ['#1a0a00', '#3a1a00', '#5a2a00'],
      ground: '#2a1a1a',
      groundAccent: '#ff4400',
      buildings: '#4a2a1a',
    },
  },
};

// VIP-exclusive world IDs
export const VIP_WORLD_IDS: WorldTheme[] = ['neon', 'crystal', 'volcano'];

// Helper to get VIP worlds config
export const VIP_WORLD_CONFIGS = Object.fromEntries(
  VIP_WORLD_IDS.map(id => [id, { ...WORLD_CONFIGS[id], isVip: true as const }])
) as Record<string, WorldConfig & { isVip: true }>;

export const DAILY_REWARDS = [
  { day: 1, coins: 10 },
  { day: 2, coins: 20 },
  { day: 3, coins: 30 },
  { day: 4, coins: 50 },
  { day: 5, coins: 75 },
  { day: 6, coins: 100 },
  { day: 7, coins: 200 },
];

// VIP Skin Effects Configuration
export interface VipSkinEffect {
  skinId: string;
  trailColors: string[];
  glowColor: string;
  particleType: 'sparkle' | 'fire' | 'shadow' | 'ice' | 'lightning' | 'cosmic';
  trailLength: number;
  particleCount: number;
}

export const VIP_SKIN_EFFECTS: Record<string, VipSkinEffect> = {
  diamond: {
    skinId: 'diamond',
    trailColors: ['#00BFFF', '#87CEEB', '#E0FFFF', '#FFFFFF'],
    glowColor: 'rgba(0, 191, 255, 0.4)',
    particleType: 'sparkle',
    trailLength: 5,
    particleCount: 3,
  },
  phoenix: {
    skinId: 'phoenix',
    trailColors: ['#FF4500', '#FF6600', '#FF8800', '#FFAA00'],
    glowColor: 'rgba(255, 69, 0, 0.4)',
    particleType: 'fire',
    trailLength: 6,
    particleCount: 4,
  },
  shadow_king: {
    skinId: 'shadow_king',
    trailColors: ['#4B0082', '#800080', '#9400D3', '#1a1a1a'],
    glowColor: 'rgba(75, 0, 130, 0.5)',
    particleType: 'shadow',
    trailLength: 4,
    particleCount: 3,
  },
  frost_queen: {
    skinId: 'frost_queen',
    trailColors: ['#ADD8E6', '#87CEEB', '#B0E0E6', '#FFFFFF'],
    glowColor: 'rgba(173, 216, 230, 0.5)',
    particleType: 'ice',
    trailLength: 5,
    particleCount: 4,
  },
  thunder_lord: {
    skinId: 'thunder_lord',
    trailColors: ['#FFD700', '#FFFF00', '#87CEEB', '#FFFFFF'],
    glowColor: 'rgba(255, 215, 0, 0.5)',
    particleType: 'lightning',
    trailLength: 4,
    particleCount: 5,
  },
  cosmic_guardian: {
    skinId: 'cosmic_guardian',
    trailColors: ['#9400D3', '#4B0082', '#0000FF', '#FF1493'],
    glowColor: 'rgba(148, 0, 211, 0.4)',
    particleType: 'cosmic',
    trailLength: 6,
    particleCount: 4,
  },
};

// Weapon configurations
export const WEAPON_CONFIGS: Record<WeaponType, { damage: number; speed: number; ammo: number; color: string; emoji: string }> = {
  fireball: { damage: 2, speed: 10, ammo: 3, color: '#FF4500', emoji: '🔥' },
  laser: { damage: 1, speed: 20, ammo: 5, color: '#00FFFF', emoji: '⚡' },
  bomb: { damage: 3, speed: 8, ammo: 2, color: '#FFD700', emoji: '💣' },
};

// Combo system constants
export const COMBO_TIMEOUT = 120; // 2 seconds at 60fps
export const MAX_COMBO = 5;
export const COMBO_DAMAGE_MULTIPLIERS = [1, 2, 3, 4, 5]; // x1, x2, x3, x4, x5
