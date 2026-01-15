class AudioController {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  musicGain: GainNode | null = null;
  initialized = false;

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.15;
    this.musicGain.connect(this.ctx.destination);
    
    this.initialized = true;
    this.startAmbientDrone();
  }

  playShot(type: string) {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    if (type === 'pistol' || type === 'rifle') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.2);
    } else if (type === 'shotgun') {
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.3);
        
        osc2.frequency.setValueAtTime(100, t);
        osc2.frequency.linearRampToValueAtTime(20, t + 0.3);

        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        gain2.gain.setValueAtTime(0.5, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.start(t); osc.stop(t + 0.4);
        osc2.start(t); osc2.stop(t + 0.4);
    } else if (type === 'laser') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        osc.start(t); osc.stop(t + 0.2);
    }
  }

  playHit() {
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain); gain.connect(this.masterGain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, t);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.start(t); osc.stop(t + 0.05);
  }

  playEmpty() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.masterGain);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.start(t); osc.stop(t + 0.05);
  }

  playReload() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.masterGain);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.2);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.1);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);
    osc.start(t); osc.stop(t + 0.3);
  }

  startAmbientDrone() {
    if (!this.ctx || !this.musicGain) return;
    // Simple drone logic that repeats
    const playNote = () => {
        const t = this.ctx!.currentTime;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain); gain.connect(this.musicGain!);
        
        const freq = 50 + Math.random() * 5; // Deep drone
        osc.frequency.value = freq;
        osc.type = 'triangle';
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 4);
        gain.gain.linearRampToValueAtTime(0, t + 10);
        
        osc.start(t);
        osc.stop(t + 10);
        setTimeout(playNote, 4000);
    };
    playNote();
  }
}

export const audioService = new AudioController();