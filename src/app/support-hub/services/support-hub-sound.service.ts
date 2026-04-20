import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SupportHubSoundService {
  private soundEnabled = signal<boolean>(true);

  constructor() {
    const stored = localStorage.getItem('support-hub-sound-enabled');
    if (stored !== null) {
      this.soundEnabled.set(stored === 'true');
    }
  }

  playNewMessageSound(): void {
    if (!this.soundEnabled()) return;

    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);
    } catch {
      // AudioContext not available (e.g. SSR or restricted environment)
    }
  }

  toggleSound(): void {
    this.soundEnabled.update(v => !v);
    localStorage.setItem('support-hub-sound-enabled', String(this.soundEnabled()));
  }

  isSoundEnabled(): boolean {
    return this.soundEnabled();
  }
}
