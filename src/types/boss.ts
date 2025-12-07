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

export const BOSS_CONFIGS: BossConfig[] = [
  {
    type: 'mech',
    name: 'CYBER MECH',
    triggerDistance: 1000,
    health: 5,
    width: 80,
    height: 100,
    color: '#FF4444',
    attackInterval: 120,
    rewardCoins: 100,
    rewardXP: 200,
  },
  {
    type: 'dragon',
    name: 'SHADOW DRAGON',
    triggerDistance: 3000,
    health: 8,
    width: 100,
    height: 80,
    color: '#9933FF',
    attackInterval: 90,
    rewardCoins: 250,
    rewardXP: 400,
  },
  {
    type: 'titan',
    name: 'COSMIC TITAN',
    triggerDistance: 6000,
    health: 12,
    width: 120,
    height: 120,
    color: '#FFD700',
    attackInterval: 60,
    rewardCoins: 500,
    rewardXP: 800,
  },
];
