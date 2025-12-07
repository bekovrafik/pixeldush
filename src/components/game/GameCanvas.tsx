import { useRef, useEffect, useCallback } from 'react';
import { Player, Obstacle, Particle, Coin } from '@/types/game';

interface GameCanvasProps {
  player: Player;
  obstacles: Obstacle[];
  coins: Coin[];
  particles: Particle[];
  score: number;
  coinCount: number;
  speed: number;
  isPlaying: boolean;
  selectedSkin: string;
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

export function GameCanvas({ 
  player, 
  obstacles,
  coins,
  particles, 
  score,
  coinCount,
  speed,
  isPlaying,
  selectedSkin,
  onTap 
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgOffsetRef = useRef(0);
  const groundOffsetRef = useRef(0);

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, GROUND_Y);

    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 73 + bgOffsetRef.current * 0.1) % CANVAS_WIDTH;
      const y = (i * 37) % (GROUND_Y - 50);
      const size = (i % 3) + 1;
      const opacity = 0.3 + (Math.sin(Date.now() / 1000 + i) + 1) * 0.35;
      ctx.globalAlpha = opacity;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#1e3a5f';
    for (let i = 0; i < 5; i++) {
      const x = ((i * 200 - bgOffsetRef.current * 0.3) % (CANVAS_WIDTH + 200)) - 100;
      const height = 80 + (i % 3) * 30;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.lineTo(x + 100, GROUND_Y - height);
      ctx.lineTo(x + 200, GROUND_Y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#2d4a6f';
    for (let i = 0; i < 8; i++) {
      const x = ((i * 120 - bgOffsetRef.current * 0.5) % (CANVAS_WIDTH + 120)) - 60;
      const width = 40 + (i % 3) * 20;
      const height = 60 + (i % 4) * 25;
      ctx.fillRect(x, GROUND_Y - height, width, height);
      
      ctx.fillStyle = '#ffd700';
      for (let wy = 0; wy < height - 15; wy += 15) {
        for (let wx = 5; wx < width - 10; wx += 12) {
          if (Math.random() > 0.3) {
            ctx.fillRect(x + wx, GROUND_Y - height + wy + 5, 6, 8);
          }
        }
      }
      ctx.fillStyle = '#2d4a6f';
    }
  }, []);

  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#3d5a4f';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);

    ctx.fillStyle = '#4a6b5e';
    for (let i = 0; i < CANVAS_WIDTH / 20 + 2; i++) {
      const x = ((i * 20 - groundOffsetRef.current) % (CANVAS_WIDTH + 40)) - 20;
      ctx.fillRect(x, GROUND_Y, 10, 4);
      ctx.fillRect(x + 5, GROUND_Y + 8, 10, 4);
    }

    ctx.strokeStyle = '#5a8b6e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
  }, []);

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, p: Player) => {
    const colors = SKIN_COLORS[selectedSkin] || SKIN_COLORS.default;
    const bounce = p.isOnGround ? Math.sin(Date.now() / 100) * 2 : 0;
    const y = p.y + bounce;

    ctx.save();
    
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
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(obs.x + 3, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + 5);
        ctx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'block':
        ctx.fillStyle = '#9b59b6';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        ctx.fillStyle = '#be90d4';
        ctx.fillRect(obs.x, obs.y, obs.width, 4);
        ctx.fillRect(obs.x, obs.y, 4, obs.height);
        ctx.fillStyle = '#6c3483';
        ctx.fillRect(obs.x + obs.width - 4, obs.y, 4, obs.height);
        ctx.fillRect(obs.x, obs.y + obs.height - 4, obs.width, 4);
        break;
        
      case 'flying':
        // Flying bat/bird enemy
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.ellipse(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, obs.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wings
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
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(obs.x + 8, obs.y + 6, 6, 6);
        ctx.fillRect(obs.x + obs.width - 14, obs.y + 6, 6, 6);
        ctx.fillStyle = '#000';
        ctx.fillRect(obs.x + 10, obs.y + 8, 3, 3);
        ctx.fillRect(obs.x + obs.width - 12, obs.y + 8, 3, 3);
        break;
        
      case 'double':
        // Same as spike but rendered individually
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'moving':
        // Moving platform enemy
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        // Angry face
        ctx.fillStyle = '#000';
        ctx.fillRect(obs.x + 5, obs.y + 8, 6, 6);
        ctx.fillRect(obs.x + obs.width - 11, obs.y + 8, 6, 6);
        ctx.fillRect(obs.x + 8, obs.y + 20, obs.width - 16, 4);
        // Glow effect
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(obs.x - 3, obs.y - 3, obs.width + 6, obs.height + 6);
        ctx.globalAlpha = 1;
        break;
    }
    
    ctx.restore();
  }, []);

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, coin: Coin) => {
    ctx.save();
    
    const scale = 0.8 + Math.abs(Math.sin(coin.animationFrame)) * 0.2;
    const centerX = coin.x + coin.width / 2;
    const centerY = coin.y + coin.height / 2;
    
    // Glow effect
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(centerX, centerY, coin.width / 2 + 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Coin body
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, (coin.width / 2) * scale, coin.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = '#ffec8b';
    ctx.beginPath();
    ctx.ellipse(centerX - 3, centerY - 3, 4 * scale, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner detail
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (coin.width / 3) * scale, 0, Math.PI * 2);
    ctx.stroke();
    
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

  const drawUI = useCallback((ctx: CanvasRenderingContext2D, currentScore: number, coins: number) => {
    // Score background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(CANVAS_WIDTH - 150, 10, 140, 40);
    
    ctx.fillStyle = '#4ECDC4';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${currentScore}`, CANVAS_WIDTH - 20, 38);
    
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('SCORE', CANVAS_WIDTH - 20, 25);
    
    // Coin counter
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 100, 40);
    
    ctx.fillStyle = '#ffd700';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${coins}`, 45, 38);
    
    // Coin icon
    ctx.beginPath();
    ctx.arc(25, 30, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(25, 30, 6, 0, Math.PI * 2);
    ctx.stroke();
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
    drawParticles(ctx, particles);
    drawPlayer(ctx, player);
    drawUI(ctx, score, coinCount);

  }, [player, obstacles, coins, particles, score, coinCount, speed, isPlaying, drawBackground, drawGround, drawPlayer, drawObstacle, drawCoin, drawParticles, drawUI]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={onTap}
      onTouchStart={(e) => {
        e.preventDefault();
        onTap();
      }}
      className="w-full max-w-4xl rounded-lg border-4 border-primary/30 cursor-pointer touch-none"
      style={{ 
        imageRendering: 'pixelated',
        aspectRatio: '2/1',
      }}
    />
  );
}
