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

export interface ParallaxLayer {
  x: number;
  speed: number;
  elements: BackgroundElement[];
}

export interface BackgroundElement {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'cloud' | 'mountain' | 'tree' | 'building';
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
}
