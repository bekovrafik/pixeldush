import { useRef, useEffect, useCallback } from 'react';
import { Player, Obstacle, Particle, Coin, PowerUp, WorldTheme, WORLD_CONFIGS, ActivePowerUp, VIP_SKIN_EFFECTS } from '@/types/game';
import { Boss, BOSS_CONFIGS, BossArenaState, ARENA_BOSS_SEQUENCE } from '@/types/boss';

interface GameCanvasProps {
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  powerUps: PowerUp[];
  particles: Particle[];
  boss: Boss | null;
  bossWarning: { name: string; countdown: number } | null;
  bossArena: BossArenaState | null;
  score: number;
  coinCount: number;
  speed: number;
  isPlaying: boolean;
  selectedSkin: string;
  world: WorldTheme;
  activePowerUps: ActivePowerUp[];
  isVip?: boolean;
  onTap: () => void;
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
};

export function GameCanvas({ player, obstacles, coins, powerUps, particles, boss, bossWarning, bossArena, score, coinCount, speed, isPlaying, selectedSkin, world, activePowerUps, isVip = false, onTap }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgOffsetRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const trailPositionsRef = useRef<{x: number, y: number}[]>([]);

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

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, parts: Particle[]) => {
    parts.forEach(p => {
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    });
    ctx.globalAlpha = 1;
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
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
    gradient.addColorStop(0, 'rgba(139, 0, 0, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.9)');
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0.8)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 55, CANVAS_WIDTH, 25);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚔️ BOSS ARENA ⚔️', CANVAS_WIDTH / 2, 72);
    
    // Boss queue indicator
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
    
    // Arena complete message
    if (!arena.isActive && arena.bossesDefeated.length >= ARENA_BOSS_SEQUENCE.length) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 50, 300, 100);
      
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 50, 300, 100);
      
      ctx.fillStyle = '#FFD700';
      ctx.font = '14px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 ARENA COMPLETE! 🏆', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(`+${arena.totalRewards.coins} coins`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
      ctx.fillText(`+${arena.totalRewards.xp} XP`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 25);
    }
    
    ctx.restore();
  }, []);

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
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);
    drawGround(ctx);
    obstacles.forEach(obs => drawObstacle(ctx, obs));
    coins.forEach(coin => drawCoin(ctx, coin));
    powerUps.forEach(pu => drawPowerUp(ctx, pu));
    if (boss) drawBoss(ctx, boss);
    drawParticles(ctx, particles);
    drawPlayer(ctx, player);
    drawUI(ctx, score, coinCount, activePowerUps, isVip);
    if (bossArena?.isActive || (bossArena && bossArena.bossesDefeated.length >= ARENA_BOSS_SEQUENCE.length)) {
      drawBossArenaUI(ctx, bossArena);
    }
    if (bossWarning) drawBossWarning(ctx, bossWarning);
  }, [player, obstacles, coins, powerUps, particles, boss, bossWarning, bossArena, score, coinCount, speed, isPlaying, selectedSkin, activePowerUps, isVip, drawBackground, drawGround, drawPlayer, drawObstacle, drawCoin, drawPowerUp, drawBoss, drawParticles, drawUI, drawBossWarning, drawBossArenaUI]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={onTap}
      onTouchStart={(e) => { e.preventDefault(); onTap(); }}
      className="w-full rounded-lg border-4 border-primary/30 cursor-pointer touch-none select-none"
      style={{ imageRendering: 'pixelated', maxHeight: '50vh' }}
    />
  );
}
