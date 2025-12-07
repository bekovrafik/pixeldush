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
}

export interface ActivePowerUp {
  type: PowerUpType;
  remainingTime: number;
}

export type PowerUpType = 'shield' | 'magnet' | 'multiplier';

export type WorldTheme = 'city' | 'forest' | 'desert' | 'snow' | 'space';

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
}

export interface LeaderboardEntry {
  id: string;
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
};

export const DAILY_REWARDS = [
  { day: 1, coins: 10 },
  { day: 2, coins: 20 },
  { day: 3, coins: 30 },
  { day: 4, coins: 50 },
  { day: 5, coins: 75 },
  { day: 6, coins: 100 },
  { day: 7, coins: 200 },
];
