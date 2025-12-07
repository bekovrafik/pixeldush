// Simple audio manager using Web Audio API for game sounds
class AudioManager {
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmOscillator: OscillatorNode | null = null;
  private bgmPlaying: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pixelRunnerMuted');
      this.isMuted = saved === 'true';
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('pixelRunnerMuted', muted.toString());
    
    if (muted && this.bgmPlaying) {
      this.stopBGM();
    } else if (!muted && !this.bgmPlaying) {
      this.startBGM();
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  playJump() {
    if (this.isMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  playCoin() {
    if (this.isMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }

  playDeath() {
    if (this.isMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  }

  playClick() {
    if (this.isMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }

  startBGM() {
    if (this.isMuted || this.bgmPlaying) return;
    
    const ctx = this.getContext();
    this.bgmGain = ctx.createGain();
    this.bgmGain.connect(ctx.destination);
    this.bgmGain.gain.setValueAtTime(0.05, ctx.currentTime);
    
    // Simple chiptune-style background melody
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.bgmGain!);
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(frequency, startTime);
      
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.setValueAtTime(0, startTime + duration - 0.01);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    // Simple looping melody
    const melody = [262, 294, 330, 349, 392, 349, 330, 294]; // C D E F G F E D
    const beatDuration = 0.25;
    let noteIndex = 0;
    
    const loopMelody = () => {
      if (!this.bgmPlaying || this.isMuted) return;
      
      const now = ctx.currentTime;
      for (let i = 0; i < 8; i++) {
        playNote(melody[(noteIndex + i) % melody.length], now + i * beatDuration, beatDuration * 0.9);
      }
      noteIndex = (noteIndex + 8) % melody.length;
      
      setTimeout(loopMelody, beatDuration * 8 * 1000);
    };
    
    this.bgmPlaying = true;
    loopMelody();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmGain) {
      this.bgmGain.disconnect();
      this.bgmGain = null;
    }
  }

  resumeContext() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioManager = new AudioManager();
