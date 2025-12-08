import { useRef, useEffect, useCallback } from 'react';
import { Player, Obstacle, Particle, Coin, PowerUp, WorldTheme, WORLD_CONFIGS, ActivePowerUp, VIP_SKIN_EFFECTS, PlayerProjectile, WeaponPowerUp, WEAPON_CONFIGS, WeaponType } from '@/types/game';
import { Boss, BOSS_CONFIGS, BossArenaState, ARENA_BOSS_SEQUENCE } from '@/types/boss';
import { ScreenFlash, PowerUpExplosion } from '@/hooks/usePowerUpEffects';
import { BossIntroState } from '@/hooks/useBossIntro';

interface GameCanvasProps {
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  powerUps: PowerUp[];
  weaponPowerUps: WeaponPowerUp[];
  playerProjectiles: PlayerProjectile[];
  particles: Particle[];
  boss: Boss | null;
  bossWarning: { name: string; countdown: number } | null;
  bossArena: BossArenaState | null;
  score: number;
  distance: number;
  coinCount: number;
  speed: number;
  isPlaying: boolean;
  selectedSkin: string;
  world: WorldTheme;
  activePowerUps: ActivePowerUp[];
  activeWeapon: WeaponType | null;
  weaponAmmo: number;
  comboCount: number;
  hasDoubleJumped: boolean;
  isVip?: boolean;
  onTap: () => void;
  // Power-up effects
  screenFlash?: ScreenFlash | null;
  powerUpExplosions?: PowerUpExplosion[];
  // Boss intro
  bossIntro?: BossIntroState | null;
  bossIntroShakeOffset?: { x: number; y: number };
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 280;

const SKIN_COLORS: Record<string, { body: string; accent: string }> = {
  default: { body: '#4ECDC4', accent: '#2C3E50' },
  cat: { body: '#FF9F43', accent: '#2C3E50' },
  robot: { body: '#A8A8A8', accent: '#3498DB' },
  ninja: { body: '#2C3E50', accent: '#E74C3C' },
  zombie: { body: '#7CB342', accent: '#558B2F' },
  astronaut: { body: '#ECF0F1', accent: '#3498DB' },
  diamond: { body: '#00BFFF', accent: '#87CEEB' },
  phoenix: { body: '#FF4500', accent: '#FFD700' },
  shadow_king: { body: '#4B0082', accent: '#800080' },
  frost_queen: { body: '#ADD8E6', accent: '#87CEEB' },
  thunder_lord: { body: '#FFD700', accent: '#87CEEB' },
  cosmic_guardian: { body: '#9400D3', accent: '#FF1493' },
};

export function GameCanvas({ player, obstacles, coins, powerUps, weaponPowerUps, playerProjectiles, particles, boss, bossWarning, bossArena, score, distance, coinCount, speed, isPlaying, selectedSkin, world, activePowerUps, activeWeapon, weaponAmmo, comboCount, hasDoubleJumped, isVip = false, onTap, screenFlash, powerUpExplosions = [], bossIntro, bossIntroShakeOffset = { x: 0, y: 0 } }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgOffsetRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const trailPositionsRef = useRef<{x: number, y: number}[]>([]);
  const doubleJumpTrailRef = useRef<{x: number, y: number, alpha: number, size: number}[]>([]);

  const worldConfig = WORLD_CONFIGS[world];

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    worldConfig.colors.sky.forEach((color, i) => gradient.addColorStop(i / (worldConfig.colors.sky.length - 1), color));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    // Stars (visible in all worlds but more prominent in space)
    const starCount = world === 'space' ? 80 : 50;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < starCount; i++) {
      const x = (i * 73 + bgOffsetRef.current * 0.1) % CANVAS_WIDTH;
      const y = (i * 37) % (GROUND_Y - 50);
      const size = (i % 3) + 1;
      const opacity = 0.3 + (Math.sin(Date.now() / 1000 + i) + 1) * 0.35;
      ctx.globalAlpha = opacity;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    // World-specific elements
    if (world === 'forest') {
      ctx.fillStyle = '#0d3810';
      for (let i = 0; i < 6; i++) {
        const x = ((i * 150 - bgOffsetRef.current * 0.3) % (CANVAS_WIDTH + 150)) - 75;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x + 40, GROUND_Y - 100 - (i % 3) * 20);
        ctx.lineTo(x + 80, GROUND_Y);
        ctx.fill();
      }
    } else if (world === 'desert') {
      ctx.fillStyle = '#a08050';
      for (let i = 0; i < 4; i++) {
        const x = ((i * 250 - bgOffsetRef.current * 0.2) % (CANVAS_WIDTH + 250)) - 125;
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.quadraticCurveTo(x + 100, GROUND_Y - 80, x + 200, GROUND_Y);
        ctx.fill();
      }
    } else if (world === 'space') {
      // Planets
      ctx.fillStyle = '#8b4a8b';
      ctx.beginPath();
      ctx.arc(((bgOffsetRef.current * 0.05) % CANVAS_WIDTH), 80, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a8b8b';
      ctx.beginPath();
      ctx.arc((500 + (bgOffsetRef.current * 0.03) % CANVAS_WIDTH), 150, 25, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Buildings for city/snow
      ctx.fillStyle = worldConfig.colors.buildings;
      for (let i = 0; i < 8; i++) {
        const x = ((i * 120 - bgOffsetRef.current * 0.5) % (CANVAS_WIDTH + 120)) - 60;
        const width = 40 + (i % 3) * 20;
        const height = 60 + (i % 4) * 25;
        ctx.fillRect(x, GROUND_Y - height, width, height);
        ctx.fillStyle = world === 'snow' ? '#aabbcc' : '#ffd700';
        for (let wy = 0; wy < height - 15; wy += 15) {
          for (let wx = 5; wx < width - 10; wx += 12) {
            if (Math.random() > 0.3) ctx.fillRect(x + wx, GROUND_Y - height + wy + 5, 6, 8);
          }
        }
        ctx.fillStyle = worldConfig.colors.buildings;
      }
    }
  }, [world, worldConfig]);

  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = worldConfig.colors.ground;
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
    ctx.fillStyle = worldConfig.colors.groundAccent;
    for (let i = 0; i < CANVAS_WIDTH / 20 + 2; i++) {
      const x = ((i * 20 - groundOffsetRef.current) % (CANVAS_WIDTH + 40)) - 20;
      ctx.fillRect(x, GROUND_Y, 10, 4);
      ctx.fillRect(x + 5, GROUND_Y + 8, 10, 4);
    }
    ctx.strokeStyle = worldConfig.colors.groundAccent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
  }, [worldConfig]);

  const drawVipSkinEffects = useCallback((ctx: CanvasRenderingContext2D, p: Player) => {
    const effect = VIP_SKIN_EFFECTS[selectedSkin];
    if (!effect) return;

    ctx.save();

    // Draw trailing particles
    const trail = trailPositionsRef.current;
    for (let i = 0; i < trail.length; i++) {
      const pos = trail[i];
      const alpha = (i + 1) / trail.length * 0.6;
      const size = 6 + (i / trail.length) * 8;
      
      ctx.globalAlpha = alpha;
      ctx.fillStyle = effect.trailColors[i % effect.trailColors.length];
      
      if (effect.particleType === 'sparkle') {
        // Diamond sparkles
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - size);
        ctx.lineTo(pos.x + size, pos.y);
        ctx.lineTo(pos.x, pos.y + size);
        ctx.lineTo(pos.x - size, pos.y);
        ctx.closePath();
        ctx.fill();
      } else if (effect.particleType === 'fire') {
        // Fire particles
        const flicker = Math.sin(Date.now() / 50 + i) * 2;
        ctx.beginPath();
        ctx.arc(pos.x + flicker, pos.y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect.particleType === 'shadow') {
        // Shadow mist
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (effect.particleType === 'ice') {
        // Ice crystals - hexagonal shape
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (Math.PI / 3) * j + Date.now() / 2000;
          const px = pos.x + Math.cos(angle) * size;
          const py = pos.y + Math.sin(angle) * size;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      } else if (effect.particleType === 'lightning') {
        // Lightning bolts
        ctx.strokeStyle = effect.trailColors[i % effect.trailColors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.x - size, pos.y - size);
        ctx.lineTo(pos.x + size * 0.3, pos.y);
        ctx.lineTo(pos.x - size * 0.3, pos.y);
        ctx.lineTo(pos.x + size, pos.y + size);
        ctx.stroke();
      } else if (effect.particleType === 'cosmic') {
        // Cosmic stars with rotation
        const starAngle = Date.now() / 500 + i;
        ctx.beginPath();
        for (let j = 0; j < 5; j++) {
          const outerAngle = starAngle + (j * Math.PI * 2) / 5;
          const innerAngle = outerAngle + Math.PI / 5;
          const outerX = pos.x + Math.cos(outerAngle) * size;
          const outerY = pos.y + Math.sin(outerAngle) * size;
          const innerX = pos.x + Math.cos(innerAngle) * (size * 0.4);
          const innerY = pos.y + Math.sin(innerAngle) * (size * 0.4);
          if (j === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          ctx.lineTo(innerX, innerY);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw glow around player
    ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 200) * 0.15;
    ctx.fillStyle = effect.glowColor;
    ctx.beginPath();
    ctx.arc(p.x + p.width / 2, p.y + p.height / 2, p.width * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Draw floating particles around player
    for (let i = 0; i < effect.particleCount; i++) {
      const angle = (Date.now() / 500 + i * (Math.PI * 2 / effect.particleCount)) % (Math.PI * 2);
      const radius = p.width * 0.8 + Math.sin(Date.now() / 300 + i) * 5;
      const px = p.x + p.width / 2 + Math.cos(angle) * radius;
      const py = p.y + p.height / 2 + Math.sin(angle) * radius * 0.6;
      
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = effect.trailColors[i % effect.trailColors.length];
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [selectedSkin]);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, p: Player) => {
    const colors = SKIN_COLORS[selectedSkin] || SKIN_COLORS.default;
    const bounce = p.isOnGround ? Math.sin(Date.now() / 100) * 2 : 0;
    const y = p.y + bounce;

    ctx.save();
    
    // Draw VIP skin effects first (behind player)
    if (VIP_SKIN_EFFECTS[selectedSkin]) {
      drawVipSkinEffects(ctx, { ...p, y });
    }
    
    // Shield effect
    if (p.hasShield) {
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 100) * 0.2;
      ctx.fillStyle = '#00BFFF';
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, y + p.height / 2, p.width, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(p.x + p.width / 2, GROUND_Y + 2, p.width / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.body;
    ctx.fillRect(p.x + 4, y + 8, p.width - 8, p.height - 16);
    ctx.fillRect(p.x + 2, y, p.width - 4, 14);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(p.x + 18, y + 4, 8, 6);
    ctx.fillStyle = colors.accent;
    ctx.fillRect(p.x + 22, y + 4, 4, 6);

    const legOffset = p.isOnGround ? Math.sin(Date.now() / 80) * 4 : 0;
    ctx.fillStyle = colors.accent;
    ctx.fillRect(p.x + 6, y + p.height - 10 + legOffset, 8, 10);
    ctx.fillRect(p.x + p.width - 14, y + p.height - 10 - legOffset, 8, 10);

    if (speed > 7) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = colors.body;
      ctx.fillRect(p.x - 10, y + 10, 8, p.height - 20);
      ctx.globalAlpha = 0.15;
      ctx.fillRect(p.x - 20, y + 12, 6, p.height - 24);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }, [selectedSkin, speed, drawVipSkinEffects]);

  const drawObstacle = useCallback((ctx: CanvasRenderingContext2D, obs: Obstacle) => {
    ctx.save();
    switch (obs.type) {
      case 'spike':
      case 'double':
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        break;
      case 'block':
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        break;
      case 'flying':
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        const wingFlap = Math.sin(Date.now() / 100) * 8;
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height / 2);
        ctx.lineTo(obs.x - 15, obs.y + obs.height / 2 + wingFlap);
        ctx.lineTo(obs.x, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(obs.x + obs.width, obs.y + obs.height / 2);
        ctx.lineTo(obs.x + obs.width + 15, obs.y + obs.height / 2 - wingFlap);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        break;
      case 'moving':
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.globalAlpha = 0.3;
        ctx.fillRect(obs.x - 3, obs.y - 3, obs.width + 6, obs.height + 6);
        ctx.globalAlpha = 1;
        break;
    }
    ctx.restore();
  }, []);

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: Coin) => {
    const scale = 0.8 + Math.abs(Math.sin(coin.animationFrame)) * 0.2;
    const cx = coin.x + coin.width / 2, cy = coin.y + coin.height / 2;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(cx, cy, coin.width / 2 + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(cx, cy, (coin.width / 2) * scale, coin.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawPowerUp = useCallback((ctx: CanvasRenderingContext2D, pu: PowerUp) => {
    const cx = pu.x + pu.width / 2, cy = pu.y + pu.height / 2;
    const pulse = Math.sin(Date.now() / 200) * 3;
    
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = pu.type === 'shield' ? '#00BFFF' : pu.type === 'magnet' ? '#FF00FF' : '#FFD700';
    ctx.beginPath();
    ctx.arc(cx, cy, pu.width / 2 + 8 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = pu.type === 'shield' ? '#00BFFF' : pu.type === 'magnet' ? '#FF00FF' : '#FFD700';
    ctx.beginPath();
    ctx.arc(cx, cy, pu.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pu.type === 'shield' ? '🛡️' : pu.type === 'magnet' ? '🧲' : '×2', cx, cy);
    ctx.restore();
  }, []);

  const drawWeaponPowerUp = useCallback((ctx: CanvasRenderingContext2D, wp: WeaponPowerUp) => {
    const cx = wp.x + wp.width / 2, cy = wp.y + wp.height / 2;
    const pulse = Math.sin(Date.now() / 150) * 4;
    const config = WEAPON_CONFIGS[wp.type];
    
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(cx, cy, wp.width / 2 + 10 + pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = config.color;
    ctx.beginPath();
    ctx.arc(cx, cy, wp.width / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.emoji, cx, cy);
    ctx.restore();
  }, []);

  const drawPlayerProjectile = useCallback((ctx: CanvasRenderingContext2D, proj: PlayerProjectile) => {
    ctx.save();
    const colors: Record<string, string> = {
      energy: '#00FFFF',
      fireball: '#FF4500',
      laser: '#00FFFF',
      bomb: '#FFD700',
    };
    
    ctx.fillStyle = colors[proj.type] || '#FFFFFF';
    if (proj.type === 'bomb') {
      ctx.beginPath();
      ctx.arc(proj.x + proj.width / 2, proj.y + proj.height / 2, proj.width / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
      ctx.globalAlpha = 0.5;
      ctx.fillRect(proj.x - 10, proj.y + 2, 10, proj.height - 4);
    }
    ctx.restore();
  }, []);

  const drawComboIndicator = useCallback((ctx: CanvasRenderingContext2D, combo: number, playerY: number) => {
    if (combo <= 0) return;
    
    ctx.save();
    
    // Escalating colors: white -> yellow -> orange -> red -> magenta -> rainbow
    const comboColors = [
      ['#FFFFFF', '#CCCCCC'], // 1x
      ['#FFFF00', '#FFD700'], // 2x
      ['#FF8800', '#FF6600'], // 3x
      ['#FF4400', '#FF2200'], // 4x
      ['#FF00FF', '#CC00CC'], // 5x (max)
    ];
    const colorIndex = Math.min(combo - 1, comboColors.length - 1);
    const [mainColor, accentColor] = comboColors[colorIndex];
    
    // Escalating text sizes
    const baseSize = 16 + combo * 6;
    const size = baseSize + Math.sin(Date.now() / 100) * (combo * 1.5); // Pulsing effect
    
    // Position with bounce animation
    const bounceY = Math.sin(Date.now() / 80) * (5 + combo);
    const y = 100 + bounceY;
    
    // Glow effect for higher combos
    if (combo >= 3) {
      ctx.shadowColor = mainColor;
      ctx.shadowBlur = 15 + combo * 5;
    }
    
    // Background flash for max combo
    if (combo >= 5) {
      const flashIntensity = Math.abs(Math.sin(Date.now() / 50)) * 0.15;
      ctx.fillStyle = `rgba(255, 0, 255, ${flashIntensity})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
    
    // Draw outline/stroke for better visibility
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3 + combo;
    ctx.font = `bold ${size}px "Press Start 2P", monospace`;
    ctx.textAlign = 'center';
    ctx.strokeText(`${combo}x COMBO!`, CANVAS_WIDTH / 2, y);
    
    // Main text with gradient for high combos
    if (combo >= 4) {
      const gradient = ctx.createLinearGradient(CANVAS_WIDTH / 2 - 100, y - 20, CANVAS_WIDTH / 2 + 100, y + 20);
      gradient.addColorStop(0, mainColor);
      gradient.addColorStop(0.5, '#FFFFFF');
      gradient.addColorStop(1, mainColor);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = mainColor;
    }
    ctx.fillText(`${combo}x COMBO!`, CANVAS_WIDTH / 2, y);
    
    // Particle burst around text for combo 3+
    if (combo >= 3) {
      const particleCount = combo * 3;
      for (let i = 0; i < particleCount; i++) {
        const angle = (Date.now() / 500 + i * (Math.PI * 2 / particleCount)) % (Math.PI * 2);
        const radius = 80 + combo * 10 + Math.sin(Date.now() / 200 + i) * 15;
        const px = CANVAS_WIDTH / 2 + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * (radius * 0.4);
        
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = comboColors[i % comboColors.length][0];
        ctx.beginPath();
        ctx.arc(px, py, 3 + combo, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    ctx.restore();
  }, []);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, parts: Particle[]) => {
    parts.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
  }, []);

  const drawDoubleJumpTrail = useCallback((ctx: CanvasRenderingContext2D, p: Player) => {
    const trail = doubleJumpTrailRef.current;
    
    // Draw trail particles
    trail.forEach((particle, i) => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      
      // Create gradient for each trail particle
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size
      );
      gradient.addColorStop(0, '#00FFFF');
      gradient.addColorStop(0.5, '#00BFFF');
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Add sparkle effect
      if (i % 2 === 0) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.globalAlpha = particle.alpha * 0.8;
        const sparkleSize = particle.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(particle.x - sparkleSize, particle.y);
        ctx.lineTo(particle.x + sparkleSize, particle.y);
        ctx.moveTo(particle.x, particle.y - sparkleSize);
        ctx.lineTo(particle.x, particle.y + sparkleSize);
        ctx.stroke();
      }
      
      ctx.restore();
    });
    
    // Update trail - fade out and remove old particles
    doubleJumpTrailRef.current = trail
      .map(p => ({ ...p, alpha: p.alpha - 0.03, size: p.size * 0.95 }))
      .filter(p => p.alpha > 0);
  }, []);

  const drawBoss = useCallback((ctx: CanvasRenderingContext2D, b: Boss) => {
    const bossConfig = BOSS_CONFIGS.find(c => c.type === b.type);
    if (!bossConfig) return;

    ctx.save();
    
    // Boss shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(b.x + b.width / 2, GROUND_Y + 5, b.width / 2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Boss body glow
    const pulseIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7;
    ctx.globalAlpha = 0.3 * pulseIntensity;
    ctx.fillStyle = bossConfig.color;
    ctx.fillRect(b.x - 10, b.y - 10, b.width + 20, b.height + 20);
    ctx.globalAlpha = 1;
    
    // Boss body
    ctx.fillStyle = bossConfig.color;
    ctx.fillRect(b.x, b.y, b.width, b.height);
    
    // Boss details based on type
    if (b.type === 'mech') {
      // Mech eyes
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(b.x + 15, b.y + 20, 15, 10);
      ctx.fillRect(b.x + b.width - 30, b.y + 20, 15, 10);
      // Mech arms
      ctx.fillStyle = '#AA3333';
      ctx.fillRect(b.x - 20, b.y + 40, 20, 40);
      ctx.fillRect(b.x + b.width, b.y + 40, 20, 40);
    } else if (b.type === 'dragon') {
      // Dragon wings
      const wingFlap = Math.sin(Date.now() / 150) * 15;
      ctx.fillStyle = '#7722AA';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 30);
      ctx.lineTo(b.x - 40, b.y + 10 + wingFlap);
      ctx.lineTo(b.x, b.y + 60);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(b.x + b.width, b.y + 30);
      ctx.lineTo(b.x + b.width + 40, b.y + 10 - wingFlap);
      ctx.lineTo(b.x + b.width, b.y + 60);
      ctx.closePath();
      ctx.fill();
      // Dragon eyes
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(b.x + 25, b.y + 25, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.type === 'titan') {
      // Titan crown
      ctx.fillStyle = '#FFD700';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(b.x + 10 + i * 25, b.y);
        ctx.lineTo(b.x + 22 + i * 25, b.y - 20);
        ctx.lineTo(b.x + 35 + i * 25, b.y);
        ctx.closePath();
        ctx.fill();
      }
      // Titan face
      ctx.fillStyle = '#8B0000';
      ctx.fillRect(b.x + 30, b.y + 30, 20, 15);
      ctx.fillRect(b.x + b.width - 50, b.y + 30, 20, 15);
    }
    
    // Health bar
    const healthBarWidth = b.width;
    const healthBarHeight = 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(b.x, b.y - 20, healthBarWidth, healthBarHeight);
    ctx.fillStyle = b.health > b.maxHealth / 2 ? '#00FF00' : b.health > b.maxHealth / 4 ? '#FFFF00' : '#FF0000';
    ctx.fillRect(b.x, b.y - 20, (b.health / b.maxHealth) * healthBarWidth, healthBarHeight);
    
    // Boss name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(bossConfig.name, b.x + b.width / 2, b.y - 25);
    
    // Draw projectiles
    b.projectiles.forEach(p => {
      ctx.fillStyle = p.type === 'laser' ? '#FF0000' : p.type === 'fireball' ? '#FF6600' : '#FFFF00';
      ctx.beginPath();
      ctx.ellipse(p.x + p.width / 2, p.y + p.height / 2, p.width / 2, p.height / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Projectile trail
      ctx.globalAlpha = 0.5;
      ctx.fillRect(p.x + p.width, p.y + p.height / 4, 20, p.height / 2);
      ctx.globalAlpha = 0.25;
      ctx.fillRect(p.x + p.width + 20, p.y + p.height / 3, 15, p.height / 3);
      ctx.globalAlpha = 1;
    });
    
    ctx.restore();
  }, []);

  const drawUI = useCallback((ctx: CanvasRenderingContext2D, currentScore: number, coins: number, powerUps: ActivePowerUp[], showVipBadge: boolean) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(CANVAS_WIDTH - 150, 10, 140, 40);
    ctx.fillStyle = '#4ECDC4';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentScore}`, CANVAS_WIDTH - 20, 38);
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('SCORE', CANVAS_WIDTH - 20, 25);
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 80, 40);
    ctx.fillStyle = '#ffd700';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${coins}`, 40, 36);
    ctx.beginPath();
    ctx.arc(25, 30, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // VIP Badge
    if (showVipBadge) {
      const vipX = CANVAS_WIDTH - 160;
      const vipY = 15;
      
      // VIP badge background with glow
      ctx.save();
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 10;
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fillRect(vipX - 5, vipY - 2, 55, 25);
      ctx.restore();
      
      // VIP badge
      const gradient = ctx.createLinearGradient(vipX, vipY, vipX + 45, vipY + 20);
      gradient.addColorStop(0, '#FFD700');
      gradient.addColorStop(0.5, '#FFA500');
      gradient.addColorStop(1, '#FFD700');
      ctx.fillStyle = gradient;
      ctx.fillRect(vipX, vipY, 45, 20);
      
      ctx.fillStyle = '#1a1a1a';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VIP', vipX + 22, vipY + 14);
      
      // Crown icon
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(vipX + 10, vipY - 3);
      ctx.lineTo(vipX + 15, vipY - 8);
      ctx.lineTo(vipX + 22, vipY - 3);
      ctx.lineTo(vipX + 29, vipY - 8);
      ctx.lineTo(vipX + 34, vipY - 3);
      ctx.lineTo(vipX + 34, vipY);
      ctx.lineTo(vipX + 10, vipY);
      ctx.closePath();
      ctx.fill();
      
      // 2x coin indicator
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(95, 10, 35, 20);
      ctx.fillStyle = '#00FF00';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('2x', 112, 24);
    }
    
    // Power-up indicators
    const powerUpStartX = showVipBadge ? 135 : 100;
    powerUps.forEach((pu, i) => {
      const x = powerUpStartX + i * 45;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, 10, 40, 40);
      ctx.fillStyle = pu.type === 'shield' ? '#00BFFF' : pu.type === 'magnet' ? '#FF00FF' : '#FFD700';
      ctx.fillRect(x, 10 + 40 * (1 - pu.remainingTime / 300), 40, 40 * (pu.remainingTime / 300));
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(pu.type === 'shield' ? '🛡️' : pu.type === 'magnet' ? '🧲' : '×2', x + 20, 35);
    });
  }, []);

  const drawBossProgressBar = useCallback((ctx: CanvasRenderingContext2D, currentDistance: number) => {
    const BOSS_TRIGGER_DISTANCE = 2000; // ARENA_TRIGGER_DISTANCE
    const progress = Math.min(currentDistance / BOSS_TRIGGER_DISTANCE, 1);
    
    // Don't show if already at boss
    if (progress >= 1) return;
    
    ctx.save();
    
    // Bar dimensions and position (below score HUD)
    const barWidth = 300;
    const barHeight = 16;
    const barX = (CANVAS_WIDTH - barWidth) / 2;
    const barY = 56;
    
    // Background with dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(barX - 5, barY - 5, barWidth + 10, barHeight + 28, 8);
    ctx.fill();
    
    // Border glow that intensifies as player gets closer
    const glowIntensity = 0.3 + progress * 0.7;
    const pulseEffect = Math.sin(Date.now() / 200) * 0.1 * progress;
    ctx.strokeStyle = `rgba(255, ${Math.floor(100 - progress * 100)}, 0, ${glowIntensity + pulseEffect})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(barX - 5, barY - 5, barWidth + 10, barHeight + 28, 8);
    ctx.stroke();
    
    // Title text
    ctx.fillStyle = '#AAAAAA';
    ctx.font = '6px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ BOSS ARENA', CANVAS_WIDTH / 2, barY + 5);
    
    // Progress bar background
    ctx.fillStyle = 'rgba(80, 20, 20, 0.8)';
    ctx.beginPath();
    ctx.roundRect(barX, barY + 10, barWidth, barHeight, 4);
    ctx.fill();
    
    // Progress bar fill with gradient
    if (progress > 0) {
      const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth * progress, 0);
      gradient.addColorStop(0, '#8B0000');
      gradient.addColorStop(0.5, '#FF4500');
      gradient.addColorStop(1, '#FFD700');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(barX, barY + 10, barWidth * progress, barHeight, 4);
      ctx.fill();
      
      // Animated shine effect on the bar
      const shinePos = ((Date.now() / 20) % (barWidth + 40)) - 20;
      if (shinePos < barWidth * progress) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(barX, barY + 10, barWidth * progress, barHeight);
        ctx.clip();
        const shineGradient = ctx.createLinearGradient(shinePos - 10, 0, shinePos + 30, 0);
        shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        shineGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shineGradient;
        ctx.fillRect(shinePos, barY + 10, 40, barHeight);
        ctx.restore();
      }
    }
    
    // Progress text
    const remaining = BOSS_TRIGGER_DISTANCE - currentDistance;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '7px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(currentDistance)}m`, barX + 5, barY + 21);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = progress > 0.8 ? '#FFD700' : '#888888';
    ctx.fillText(`${BOSS_TRIGGER_DISTANCE}m`, barX + barWidth - 5, barY + 21);
    
    // Boss icon at the end
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const bossIconX = barX + barWidth + 15;
    const iconPulse = progress > 0.8 ? 1 + Math.sin(Date.now() / 100) * 0.15 : 1;
    ctx.save();
    ctx.translate(bossIconX, barY + 18);
    ctx.scale(iconPulse, iconPulse);
    ctx.fillText('👹', 0, 0);
    ctx.restore();
    
    // "CYBER MECH" text if close
    if (progress > 0.7) {
      const textAlpha = (progress - 0.7) / 0.3;
      ctx.globalAlpha = textAlpha;
      ctx.fillStyle = '#FF4444';
      ctx.font = '5px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CYBER MECH INCOMING!', CANVAS_WIDTH / 2, barY + 38);
    }
    
    ctx.restore();
  }, []);

  const drawBossWarning = useCallback((ctx: CanvasRenderingContext2D, warning: { name: string; countdown: number }) => {
    ctx.save();
    
    // Flashing red overlay
    const flashIntensity = Math.abs(Math.sin(Date.now() / 100)) * 0.3;
    ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Warning box
    const boxWidth = 300;
    const boxHeight = 80;
    const boxX = (CANVAS_WIDTH - boxWidth) / 2;
    const boxY = (CANVAS_HEIGHT - boxHeight) / 2 - 50;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    
    // Red border with pulse effect
    ctx.strokeStyle = `rgba(255, 0, 0, ${0.5 + flashIntensity})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Warning text
    ctx.fillStyle = '#FF4444';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️ WARNING ⚠️', CANVAS_WIDTH / 2, boxY + 25);
    
    // Boss name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px "Press Start 2P", monospace';
    ctx.fillText(warning.name, CANVAS_WIDTH / 2, boxY + 50);
    
    // Countdown
    ctx.fillStyle = '#FFD700';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`INCOMING: ${Math.ceil(warning.countdown)}s`, CANVAS_WIDTH / 2, boxY + 70);
    
    ctx.restore();
  }, []);

  const drawBossArenaUI = useCallback((ctx: CanvasRenderingContext2D, arena: BossArenaState) => {
    ctx.save();
    
    // Arena banner at top
    const isRush = arena.isRushMode;
    const isEndless = arena.isEndlessMode;
    
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    if (isEndless) {
      gradient.addColorStop(0, 'rgba(128, 0, 255, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 0, 128, 1)');
      gradient.addColorStop(1, 'rgba(128, 0, 255, 0.9)');
    } else if (isRush) {
      gradient.addColorStop(0, 'rgba(255, 0, 0, 0.9)');
      gradient.addColorStop(0.5, 'rgba(255, 165, 0, 1)');
      gradient.addColorStop(1, 'rgba(255, 0, 0, 0.9)');
    } else {
      gradient.addColorStop(0, 'rgba(139, 0, 0, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.9)');
      gradient.addColorStop(1, 'rgba(139, 0, 0, 0.8)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 55, CANVAS_WIDTH, 25);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    
    if (isEndless) {
      ctx.fillText('♾️ ENDLESS MODE ♾️', CANVAS_WIDTH / 2, 72);
    } else if (isRush) {
      ctx.fillText('⚡ BOSS RUSH ⚡', CANVAS_WIDTH / 2, 72);
    } else {
      ctx.fillText('⚔️ BOSS ARENA ⚔️', CANVAS_WIDTH / 2, 72);
    }
    
    // Endless mode HUD - Wave counter and timer
    if (isEndless && arena.isActive) {
      const wave = arena.endlessWave + 1;
      const elapsedTime = (Date.now() - arena.startTime) / 1000;
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = Math.floor(elapsedTime % 60);
      
      // Wave counter on left
      ctx.fillStyle = 'rgba(128, 0, 255, 0.7)';
      ctx.fillRect(10, 90, 100, 45);
      ctx.strokeStyle = '#FF00FF';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 90, 100, 45);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WAVE', 60, 105);
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.fillStyle = wave >= 50 ? '#FFD700' : wave >= 25 ? '#FF00FF' : wave >= 10 ? '#00FFFF' : '#FFFFFF';
      ctx.fillText(`${wave}`, 60, 128);
      
      // Timer on right
      ctx.fillStyle = 'rgba(128, 0, 255, 0.7)';
      ctx.fillRect(CANVAS_WIDTH - 110, 90, 100, 45);
      ctx.strokeStyle = '#FF00FF';
      ctx.strokeRect(CANVAS_WIDTH - 110, 90, 100, 45);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TIME', CANVAS_WIDTH - 60, 105);
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH - 60, 126);
      
      // Milestone indicator
      const nextMilestone = wave < 10 ? 10 : wave < 25 ? 25 : wave < 50 ? 50 : null;
      if (nextMilestone) {
        ctx.font = '6px "Press Start 2P", monospace';
        ctx.fillStyle = '#AAAAAA';
        ctx.fillText(`Next milestone: Wave ${nextMilestone}`, CANVAS_WIDTH / 2, 108);
      }
    } else if (!isEndless) {
      // Boss queue indicator (regular/rush mode)
      const iconSize = 20;
      const spacing = 30;
      const startX = CANVAS_WIDTH / 2 - (ARENA_BOSS_SEQUENCE.length * spacing) / 2;
      
      ARENA_BOSS_SEQUENCE.forEach((bossType, index) => {
        const x = startX + index * spacing;
        const y = 90;
        const isDefeated = arena.bossesDefeated.includes(bossType);
        const isCurrent = index === arena.currentBossIndex && !isDefeated;
        
        ctx.globalAlpha = isDefeated ? 0.4 : 1;
        ctx.fillStyle = isDefeated ? '#888888' : isCurrent ? '#FFD700' : '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, iconSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        if (isDefeated) {
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 8, y - 8);
          ctx.lineTo(x + 8, y + 8);
          ctx.moveTo(x + 8, y - 8);
          ctx.lineTo(x - 8, y + 8);
          ctx.stroke();
        }
        
        // Boss type initial
        ctx.fillStyle = isDefeated ? '#444' : '#000';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(bossType[0].toUpperCase(), x, y);
      });
    }
    
    ctx.globalAlpha = 1;
    
    // Break timer between bosses
    if (arena.breakTimer > 0) {
      const seconds = Math.ceil(arena.breakTimer / 60);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 - 30, 200, 60);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NEXT BOSS IN', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 5);
      ctx.font = '20px "Press Start 2P", monospace';
      ctx.fillText(`${seconds}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    }
    
    // Arena/Endless complete message
    if (!arena.isActive && (arena.bossesDefeated.length >= ARENA_BOSS_SEQUENCE.length || arena.isEndlessMode)) {
      const hasStreak = !arena.hasDied;
      const isRush = arena.isRushMode;
      const isEndless = arena.isEndlessMode;
      const wave = arena.endlessWave;
      
      const bonusLines = (hasStreak ? 1 : 0) + (isRush ? 1 : 0) + (isEndless ? 1 : 0);
      const boxHeight = isEndless ? 130 : 100 + bonusLines * 20;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 70, 300, boxHeight);
      
      const borderColor = isEndless ? '#FF00FF' : isRush ? '#FF4500' : hasStreak ? '#00FF00' : '#FFD700';
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 70, 300, boxHeight);
      
      ctx.textAlign = 'center';
      
      if (isEndless) {
        // Endless mode game over
        ctx.fillStyle = '#FF00FF';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText('♾️ ENDLESS OVER ♾️', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 45);
        
        // Wave reached
        ctx.fillStyle = wave >= 50 ? '#FFD700' : wave >= 25 ? '#FF00FF' : wave >= 10 ? '#00FFFF' : '#FFFFFF';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillText(`WAVE ${wave} REACHED!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
        
        // Milestone message
        if (wave >= 50) {
          ctx.fillStyle = '#FFD700';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.fillText('🏆 LEGENDARY! Cosmic Guardian!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        } else if (wave >= 25) {
          ctx.fillStyle = '#FF00FF';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.fillText('⭐ EPIC! Thunder Lord!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        } else if (wave >= 10) {
          ctx.fillStyle = '#00FFFF';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.fillText('🎉 Frost Queen unlocked!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillText(`+${arena.totalRewards.coins} coins`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
        ctx.fillText(`+${arena.totalRewards.xp} XP`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
      } else {
        // Regular/Rush complete
        ctx.fillStyle = isRush ? '#FF4500' : '#FFD700';
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillText(isRush ? '⚡ RUSH COMPLETE! ⚡' : '🏆 ARENA COMPLETE! 🏆', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 35);
        
        let bonusY = CANVAS_HEIGHT / 2 - 15;
        if (isRush) {
          ctx.fillStyle = '#FF4500';
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillText('🔥 RUSH MODE! 1.5X BONUS 🔥', CANVAS_WIDTH / 2, bonusY);
          bonusY += 18;
        }
        if (hasStreak) {
          ctx.fillStyle = '#00FF00';
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillText('⚡ PERFECT STREAK! 2X BONUS ⚡', CANVAS_WIDTH / 2, bonusY);
          bonusY += 18;
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px "Press Start 2P", monospace';
        const rewardsY = bonusY + 10;
        ctx.fillText(`+${arena.totalRewards.coins} coins`, CANVAS_WIDTH / 2, rewardsY);
        ctx.fillText(`+${arena.totalRewards.xp} XP`, CANVAS_WIDTH / 2, rewardsY + 20);
      }
    }
    
    ctx.restore();
  }, []);

  // Track double jump for trail effect
  const prevDoubleJumpedRef = useRef(false);
  
  useEffect(() => {
    // Trigger double jump trail when hasDoubleJumped changes from false to true
    if (hasDoubleJumped && !prevDoubleJumpedRef.current) {
      // Add burst of trail particles
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        doubleJumpTrailRef.current.push({
          x: player.x + player.width / 2 + Math.cos(angle) * 15,
          y: player.y + player.height / 2 + Math.sin(angle) * 15,
          alpha: 1,
          size: 12 + Math.random() * 8
        });
      }
    }
    prevDoubleJumpedRef.current = hasDoubleJumped;
  }, [hasDoubleJumped, player.x, player.y, player.width, player.height]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isPlaying) {
      bgOffsetRef.current += speed;
      groundOffsetRef.current = (groundOffsetRef.current + speed) % 20;
      
      // Update VIP skin trail positions
      if (VIP_SKIN_EFFECTS[selectedSkin]) {
        const effect = VIP_SKIN_EFFECTS[selectedSkin];
        trailPositionsRef.current.unshift({ x: player.x, y: player.y + player.height / 2 });
        if (trailPositionsRef.current.length > effect.trailLength) {
          trailPositionsRef.current = trailPositionsRef.current.slice(0, effect.trailLength);
        }
      }
      
      // Add continuous trail for double jump
      if (hasDoubleJumped && !player.isOnGround) {
        doubleJumpTrailRef.current.push({
          x: player.x + player.width / 2 + (Math.random() - 0.5) * 10,
          y: player.y + player.height / 2 + (Math.random() - 0.5) * 10,
          alpha: 0.8,
          size: 6 + Math.random() * 4
        });
      }
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);
    drawGround(ctx);
    obstacles.forEach(obs => drawObstacle(ctx, obs));
    
    // Draw collectibles BEHIND the player (filter out ones too close to player - they're being collected)
    const playerCenterX = player.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    const collectDistanceThreshold = 30; // Items this close are being collected, don't draw
    
    coins.filter(coin => {
      const dist = Math.hypot(coin.x + 10 - playerCenterX, coin.y + 10 - playerCenterY);
      return dist > collectDistanceThreshold;
    }).forEach(coin => drawCoin(ctx, coin));
    
    powerUps.filter(pu => {
      const dist = Math.hypot(pu.x + 15 - playerCenterX, pu.y + 15 - playerCenterY);
      return dist > collectDistanceThreshold;
    }).forEach(pu => drawPowerUp(ctx, pu));
    
    weaponPowerUps.filter(wp => {
      const dist = Math.hypot(wp.x + 15 - playerCenterX, wp.y + 15 - playerCenterY);
      return dist > collectDistanceThreshold;
    }).forEach(wp => drawWeaponPowerUp(ctx, wp));
    
    // Draw player projectiles behind player
    playerProjectiles.forEach(proj => drawPlayerProjectile(ctx, proj));
    
    // Draw double jump trail behind player
    drawDoubleJumpTrail(ctx, player);
    
    // Draw player
    drawPlayer(ctx, player);
    
    // Draw boss and particles AFTER player (in front)
    if (boss) drawBoss(ctx, boss);
    drawParticles(ctx, particles);
    
    // UI elements
    drawUI(ctx, score, coinCount, activePowerUps, isVip);
    drawComboIndicator(ctx, comboCount, player.y);
    
    // Show boss progress bar when NOT in boss arena
    const isInBossArena = bossArena?.isActive || (bossArena && (bossArena.bossesDefeated.length >= ARENA_BOSS_SEQUENCE.length || bossArena.isEndlessMode));
    if (!isInBossArena && !bossWarning && isPlaying) {
      drawBossProgressBar(ctx, distance);
    }
    
    if (isInBossArena && bossArena) {
      drawBossArenaUI(ctx, bossArena);
    }
    if (bossWarning) drawBossWarning(ctx, bossWarning);
    
    // Draw power-up explosions
    powerUpExplosions.forEach(explosion => {
      ctx.save();
      explosion.particles.forEach(particle => {
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
    
    // Draw screen flash
    if (screenFlash) {
      const elapsed = Date.now() - screenFlash.startTime;
      const progress = elapsed / screenFlash.duration;
      const intensity = screenFlash.intensity * (1 - progress);
      
      if (intensity > 0) {
        ctx.save();
        ctx.fillStyle = screenFlash.color;
        ctx.globalAlpha = intensity;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
      }
    }
    
    // Draw boss intro overlay
    if (bossIntro?.isActive) {
      ctx.save();
      
      const stageElapsed = bossIntro.timer;
      
      // Letterbox effect
      const barHeight = 40;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, CANVAS_WIDTH, barHeight);
      ctx.fillRect(0, CANVAS_HEIGHT - barHeight, CANVAS_WIDTH, barHeight);
      
      switch (bossIntro.stage) {
        case 'darken':
          ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * Math.min(stageElapsed / 500, 1)})`;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          break;
        case 'name_reveal':
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          ctx.globalAlpha = Math.min(stageElapsed / 600, 1);
          ctx.fillStyle = '#FF4444';
          ctx.font = '12px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⚠️ BOSS APPROACHING ⚠️', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
          
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 24px "Press Start 2P", monospace';
          ctx.fillText(bossIntro.bossName, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          break;
        case 'shake':
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          const flashIntensity = Math.abs(Math.sin(stageElapsed / 30)) * 0.3;
          ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity})`;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 24px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur = 25;
          ctx.fillText(bossIntro.bossName, CANVAS_WIDTH / 2 + bossIntroShakeOffset.x, CANVAS_HEIGHT / 2 + bossIntroShakeOffset.y);
          break;
        case 'fight':
          const expandProgress = Math.min(stageElapsed / 600, 1);
          const alpha = expandProgress < 0.8 ? 1 : 1 - (expandProgress - 0.8) * 5;
          
          ctx.globalAlpha = Math.max(0, alpha);
          ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * (1 - expandProgress)})`;
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 30 + expandProgress * 20;
          ctx.fillStyle = '#FFD700';
          ctx.font = `bold ${Math.floor(32 + expandProgress * 16)}px "Press Start 2P", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('FIGHT!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
          break;
      }
      
      ctx.restore();
    }
  }, [player, obstacles, coins, powerUps, weaponPowerUps, playerProjectiles, particles, boss, bossWarning, bossArena, score, distance, coinCount, speed, isPlaying, selectedSkin, activePowerUps, comboCount, hasDoubleJumped, isVip, screenFlash, powerUpExplosions, bossIntro, bossIntroShakeOffset, drawBackground, drawGround, drawPlayer, drawObstacle, drawCoin, drawPowerUp, drawWeaponPowerUp, drawPlayerProjectile, drawBoss, drawParticles, drawDoubleJumpTrail, drawUI, drawComboIndicator, drawBossProgressBar, drawBossWarning, drawBossArenaUI]);

  const touchBlockRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Block rapid-fire touches (debounce for 150ms)
    if (touchBlockRef.current) return;
    touchBlockRef.current = true;
    
    onTap();
    
    setTimeout(() => {
      touchBlockRef.current = false;
    }, 150);
  }, [onTap]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Skip all mouse events on touch devices - touch events already handle input
    if ('ontouchstart' in window) return;
    onTap();
  }, [onTap]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onTouchStart={handleTouchStart}
      onMouseDown={handleClick}
      className="w-full h-full rounded-lg sm:border-4 sm:border-primary/30 cursor-pointer touch-none select-none game-canvas"
      style={{ 
        imageRendering: 'pixelated',
        objectFit: 'cover',
      }}
    />
  );
}
