class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
      document.addEventListener('keydown', this.initAudioContext.bind(this), { once: true });
    }
  }

  private initAudioContext(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private createBeep(frequency: number, duration: number, volume: number = 0.1): void {
    if (!this.enabled || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Could not play sound:', error);
    }
  }

  // Sound effects
  playTurnNotification(): void {
    // Pleasant ascending chime
    this.createBeep(523.25, 0.15, 0.08); // C5
    setTimeout(() => this.createBeep(659.25, 0.15, 0.08), 100); // E5
  }

  playMoveSuccess(): void {
    // Quick success beep
    this.createBeep(800, 0.1, 0.06);
  }

  playOpponentMove(): void {
    // Subtle notification
    this.createBeep(400, 0.12, 0.05);
  }

  playGameStart(): void {
    // Cheerful game start melody
    this.createBeep(523.25, 0.1, 0.06); // C5
    setTimeout(() => this.createBeep(659.25, 0.1, 0.06), 120); // E5
    setTimeout(() => this.createBeep(783.99, 0.15, 0.06), 240); // G5
  }

  playGameEnd(): void {
    // Victory fanfare - more elaborate
    this.createBeep(523.25, 0.15, 0.08); // C5
    setTimeout(() => this.createBeep(659.25, 0.15, 0.08), 120); // E5
    setTimeout(() => this.createBeep(783.99, 0.15, 0.08), 240); // G5
    setTimeout(() => this.createBeep(1046.5, 0.2, 0.08), 360); // C6
    setTimeout(() => this.createBeep(783.99, 0.25, 0.08), 480); // G5
  }

  playGameLoss(): void {
    // Gentle, encouraging sound
    this.createBeep(440, 0.2, 0.05); // A4
    setTimeout(() => this.createBeep(523.25, 0.2, 0.05), 200); // C5
    setTimeout(() => this.createBeep(659.25, 0.3, 0.05), 400); // E5
  }

  playCelebration(): void {
    // Celebration sound with multiple tones
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((note, i) => {
      setTimeout(() => this.createBeep(note, 0.1, 0.06), i * 80);
    });
  }

  playError(): void {
    // Error sound
    this.createBeep(200, 0.2, 0.05);
  }

  // Settings
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

export const soundManager = new SoundManager();
