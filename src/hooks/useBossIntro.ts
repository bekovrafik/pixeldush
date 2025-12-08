import { useState, useCallback, useRef, useEffect } from 'react';
import { Boss, BOSS_CONFIGS } from '@/types/boss';
import { hapticsManager } from '@/lib/hapticsManager';

export interface BossIntroState {
  isActive: boolean;
  stage: 'darken' | 'name_reveal' | 'shake' | 'fight' | 'complete';
  timer: number;
  bossType: Boss['type'] | null;
  bossName: string;
}

const STAGE_DURATIONS = {
  darken: 500,      // 0.5s
  name_reveal: 1200, // 1.2s
  shake: 400,       // 0.4s
  fight: 600,       // 0.6s
  complete: 0,
};

export function useBossIntro() {
  const [introState, setIntroState] = useState<BossIntroState>({
    isActive: false,
    stage: 'darken',
    timer: 0,
    bossType: null,
    bossName: '',
  });
  
  const startTimeRef = useRef<number>(0);
  const stageStartRef = useRef<number>(0);

  const startBossIntro = useCallback((bossType: Boss['type']) => {
    const bossConfig = BOSS_CONFIGS.find(c => c.type === bossType);
    if (!bossConfig) return;
    
    startTimeRef.current = Date.now();
    stageStartRef.current = Date.now();
    
    setIntroState({
      isActive: true,
      stage: 'darken',
      timer: 0,
      bossType,
      bossName: bossConfig.name,
    });
    
    hapticsManager.heavyImpact();
  }, []);

  const updateBossIntro = useCallback(() => {
    if (!introState.isActive) return;
    
    const now = Date.now();
    const stageElapsed = now - stageStartRef.current;
    const currentStageDuration = STAGE_DURATIONS[introState.stage];
    
    if (stageElapsed >= currentStageDuration) {
      stageStartRef.current = now;
      
      const stages: BossIntroState['stage'][] = ['darken', 'name_reveal', 'shake', 'fight', 'complete'];
      const currentIndex = stages.indexOf(introState.stage);
      
      if (currentIndex < stages.length - 1) {
        const nextStage = stages[currentIndex + 1];
        
        // Haptic feedback for stage transitions
        if (nextStage === 'name_reveal') {
          hapticsManager.mediumImpact();
        } else if (nextStage === 'shake') {
          hapticsManager.heavyImpact();
        } else if (nextStage === 'fight') {
          hapticsManager.successNotification();
        }
        
        setIntroState(prev => ({ ...prev, stage: nextStage }));
      } else {
        setIntroState(prev => ({ ...prev, isActive: false }));
      }
    }
    
    setIntroState(prev => ({ ...prev, timer: stageElapsed }));
  }, [introState.isActive, introState.stage]);

  const drawBossIntro = useCallback((ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    if (!introState.isActive) return;
    
    ctx.save();
    
    const stageElapsed = Date.now() - stageStartRef.current;
    const stageDuration = STAGE_DURATIONS[introState.stage];
    const stageProgress = Math.min(stageElapsed / stageDuration, 1);
    
    // Letterbox effect (cinematic bars)
    const barHeight = 40;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, barHeight);
    ctx.fillRect(0, canvasHeight - barHeight, canvasWidth, barHeight);
    
    switch (introState.stage) {
      case 'darken': {
        // Screen darkens with vignette
        const darkProgress = stageProgress;
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * darkProgress})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Vignette effect
        const gradient = ctx.createRadialGradient(
          canvasWidth / 2, canvasHeight / 2, 0,
          canvasWidth / 2, canvasHeight / 2, canvasWidth * 0.7
        );
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${0.5 * darkProgress})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        break;
      }
      
      case 'name_reveal': {
        // Dark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Boss name with zoom effect
        const zoomProgress = Math.min(stageProgress * 2, 1);
        const scale = 0.5 + zoomProgress * 0.5;
        const alpha = stageProgress;
        
        ctx.globalAlpha = alpha;
        
        // Warning text
        ctx.fillStyle = '#FF4444';
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        const warningY = canvasHeight / 2 - 50;
        ctx.fillText('⚠️ BOSS APPROACHING ⚠️', canvasWidth / 2, warningY);
        
        // Boss name with scale effect
        const fontSize = Math.floor(28 * scale);
        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        
        // Glow effect
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 20 + stageProgress * 15;
        
        // Name gradient
        const nameGradient = ctx.createLinearGradient(
          canvasWidth / 2 - 150, canvasHeight / 2,
          canvasWidth / 2 + 150, canvasHeight / 2
        );
        nameGradient.addColorStop(0, '#FF4444');
        nameGradient.addColorStop(0.5, '#FFFFFF');
        nameGradient.addColorStop(1, '#FF4444');
        
        ctx.fillStyle = nameGradient;
        ctx.fillText(introState.bossName, canvasWidth / 2, canvasHeight / 2);
        
        // Decorative lines
        ctx.strokeStyle = '#FF4444';
        ctx.lineWidth = 2;
        const lineWidth = 100 * stageProgress;
        ctx.beginPath();
        ctx.moveTo(canvasWidth / 2 - lineWidth, canvasHeight / 2 + 25);
        ctx.lineTo(canvasWidth / 2 + lineWidth, canvasHeight / 2 + 25);
        ctx.stroke();
        break;
      }
      
      case 'shake': {
        // Dark background with shake
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Red flash
        const flashIntensity = Math.abs(Math.sin(stageElapsed / 30)) * 0.3;
        ctx.fillStyle = `rgba(255, 0, 0, ${flashIntensity})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Boss name (static)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#FF0000';
        ctx.shadowBlur = 25;
        ctx.fillText(introState.bossName, canvasWidth / 2, canvasHeight / 2);
        break;
      }
      
      case 'fight': {
        // "FIGHT!" text with explosive reveal
        const expandProgress = stageProgress;
        const textScale = 0.5 + expandProgress * 1.5;
        const alpha = stageProgress < 0.8 ? 1 : 1 - (stageProgress - 0.8) * 5;
        
        ctx.globalAlpha = Math.max(0, alpha);
        
        // Background dims out
        ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * (1 - stageProgress)})`;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // FIGHT text
        const fontSize = Math.floor(40 * textScale);
        ctx.font = `bold ${fontSize}px "Press Start 2P", monospace`;
        ctx.textAlign = 'center';
        
        // Explosive glow
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30 + expandProgress * 20;
        
        const fightGradient = ctx.createLinearGradient(
          canvasWidth / 2 - 80, canvasHeight / 2,
          canvasWidth / 2 + 80, canvasHeight / 2
        );
        fightGradient.addColorStop(0, '#FFD700');
        fightGradient.addColorStop(0.5, '#FFFFFF');
        fightGradient.addColorStop(1, '#FFD700');
        
        ctx.fillStyle = fightGradient;
        ctx.fillText('FIGHT!', canvasWidth / 2, canvasHeight / 2);
        
        // Burst lines
        for (let i = 0; i < 8; i++) {
          const angle = (Math.PI * 2 * i) / 8;
          const lineLength = 50 * expandProgress;
          ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(
            canvasWidth / 2 + Math.cos(angle) * 80,
            canvasHeight / 2 + Math.sin(angle) * 30
          );
          ctx.lineTo(
            canvasWidth / 2 + Math.cos(angle) * (80 + lineLength),
            canvasHeight / 2 + Math.sin(angle) * (30 + lineLength * 0.5)
          );
          ctx.stroke();
        }
        break;
      }
    }
    
    ctx.restore();
  }, [introState]);

  const getShakeOffset = useCallback(() => {
    if (!introState.isActive || introState.stage !== 'shake') {
      return { x: 0, y: 0 };
    }
    
    const intensity = 10;
    return {
      x: (Math.random() - 0.5) * 2 * intensity,
      y: (Math.random() - 0.5) * 2 * intensity,
    };
  }, [introState.isActive, introState.stage]);

  return {
    introState,
    startBossIntro,
    updateBossIntro,
    drawBossIntro,
    getShakeOffset,
    isIntroActive: introState.isActive,
  };
}
