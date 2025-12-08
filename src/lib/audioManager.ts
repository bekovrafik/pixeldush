// Audio Manager with Web Audio API - Separate SFX and Music controls
class AudioManager {
  private audioContext: AudioContext | null = null;
  private isSfxMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmPlaying: boolean = false;
  private bgmLoopId: number = 0; // Unique ID to track current loop

  constructor() {
    if (typeof window !== 'undefined') {
      const savedSfx = localStorage.getItem('pixelRunnerSfxMuted');
      const savedMusic = localStorage.getItem('pixelRunnerMusicMuted');
      this.isSfxMuted = savedSfx === 'true';
      this.isMusicMuted = savedMusic === 'true';
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Legacy method for backward compatibility
  setMuted(muted: boolean) {
    this.setSfxMuted(muted);
    this.setMusicMuted(muted);
  }

  getMuted(): boolean {
    return this.isSfxMuted && this.isMusicMuted;
  }

  setSfxMuted(muted: boolean) {
    this.isSfxMuted = muted;
    localStorage.setItem('pixelRunnerSfxMuted', muted.toString());
  }

  getSfxMuted(): boolean {
    return this.isSfxMuted;
  }

  setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    localStorage.setItem('pixelRunnerMusicMuted', muted.toString());
    
    if (muted && this.bgmPlaying) {
      this.stopBGM();
    } else if (!muted && !this.bgmPlaying) {
      this.startBGM();
    }
  }

  getMusicMuted(): boolean {
    return this.isMusicMuted;
  }

  playJump() {
    if (this.isSfxMuted) return;
    
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
    if (this.isSfxMuted) return;
    
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
    if (this.isSfxMuted) return;
    
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

  // Boss warning - dramatic rising tone
  playBossWarning() {
    if (this.isSfxMuted) return;
    
    const ctx = this.getContext();
    
    // Create multiple oscillators for a more dramatic effect
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150 + i * 50, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400 + i * 100, ctx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
      }, i * 200);
    }
  }

  // Boss attack sound - laser/projectile
  playBossAttack() {
    if (this.isSfxMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  // Boss hit sound - player damages boss
  playBossHit() {
    if (this.isSfxMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.setValueAtTime(300, ctx.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  }

  // Boss defeated - victory fanfare
  playBossDefeated() {
    if (this.isSfxMuted) return;
    
    const ctx = this.getContext();
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
      }, i * 100);
    });
  }

  playClick() {
    if (this.isSfxMuted) return;
    
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

  // Hover sound - subtle blip
  playHover() {
    if (this.isSfxMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.03);
  }

  // Purchase success - celebratory chime
  playPurchase() {
    if (this.isSfxMuted) return;
    
    const ctx = this.getContext();
    const notes = [523, 659, 784, 1047, 1319]; // C5, E5, G5, C6, E6
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = 'sine';
      const startTime = ctx.currentTime + i * 0.08;
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  }

  // Select/equip sound - confirmation blip
  playSelect() {
    if (this.isSfxMuted) return;
    
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.05);
    
    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }

  startBGM() {
    if (this.isMusicMuted || this.bgmPlaying) return;
    
    // Stop any existing BGM first
    this.stopBGM();
    
    const ctx = this.getContext();
    this.bgmGain = ctx.createGain();
    this.bgmGain.connect(ctx.destination);
    this.bgmGain.gain.setValueAtTime(0.05, ctx.currentTime);
    
    // Increment loop ID to invalidate old loops
    this.bgmLoopId++;
    const currentLoopId = this.bgmLoopId;
    
    // Simple chiptune-style background melody
    const playNote = (frequency: number, startTime: number, duration: number) => {
      if (!this.bgmGain) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.bgmGain);
      
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
      // Check if this loop is still valid (same ID and still playing)
      if (!this.bgmPlaying || this.isMusicMuted || this.bgmLoopId !== currentLoopId) return;
      
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
    this.bgmLoopId++; // Invalidate any running loop
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
