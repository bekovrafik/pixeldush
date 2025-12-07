import { useRef, useEffect, useCallback } from 'react';
import { Player, Obstacle, Particle, Coin, PowerUp, WorldTheme, WORLD_CONFIGS, ActivePowerUp } from '@/types/game';

interface GameCanvasProps {
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  powerUps: PowerUp[];
  particles: Particle[];
  score: number;
  coinCount: number;
  speed: number;
  isPlaying: boolean;
  selectedSkin: string;
  world: WorldTheme;
  activePowerUps: ActivePowerUp[];
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
};

export function GameCanvas({ player, obstacles, coins, powerUps, particles, score, coinCount, speed, isPlaying, selectedSkin, world, activePowerUps, onTap }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgOffsetRef = useRef(0);
  const groundOffsetRef = useRef(0);

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

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, p: Player) => {
    const colors = SKIN_COLORS[selectedSkin] || SKIN_COLORS.default;
    const bounce = p.isOnGround ? Math.sin(Date.now() / 100) * 2 : 0;
    const y = p.y + bounce;

    ctx.save();
    
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
  }, [selectedSkin, speed]);

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

  const drawUI = useCallback((ctx: CanvasRenderingContext2D, currentScore: number, coins: number, powerUps: ActivePowerUp[]) => {
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
    
    // Power-up indicators
    powerUps.forEach((pu, i) => {
      const x = 100 + i * 45;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x, 10, 40, 40);
      ctx.fillStyle = pu.type === 'shield' ? '#00BFFF' : pu.type === 'magnet' ? '#FF00FF' : '#FFD700';
      ctx.fillRect(x, 10 + 40 * (1 - pu.remainingTime / 300), 40, 40 * (pu.remainingTime / 300));
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(pu.type === 'shield' ? '🛡️' : pu.type === 'magnet' ? '🧲' : '×2', x + 20, 35);
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (isPlaying) {
      bgOffsetRef.current += speed;
      groundOffsetRef.current = (groundOffsetRef.current + speed) % 20;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawBackground(ctx);
    drawGround(ctx);
    obstacles.forEach(obs => drawObstacle(ctx, obs));
    coins.forEach(coin => drawCoin(ctx, coin));
    powerUps.forEach(pu => drawPowerUp(ctx, pu));
    drawParticles(ctx, particles);
    drawPlayer(ctx, player);
    drawUI(ctx, score, coinCount, activePowerUps);
  }, [player, obstacles, coins, powerUps, particles, score, coinCount, speed, isPlaying, activePowerUps, drawBackground, drawGround, drawPlayer, drawObstacle, drawCoin, drawPowerUp, drawParticles, drawUI]);

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
