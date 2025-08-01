'use client';

/**
 * Sound service for playing message sounds
 */
class SoundService {
  private sentSound: HTMLAudioElement | null = null;
  private receivedSound: HTMLAudioElement | null = null;
  private bellSound: HTMLAudioElement | null = null;
  private happySound: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;

  constructor() {
    this.initializeSounds();
  }

  private initializeSounds() {
    if (typeof window === 'undefined') return;

    try {
      this.sentSound = new Audio('/sounds/sent.mp3');
      this.receivedSound = new Audio('/sounds/received.mp3');
      this.bellSound = new Audio('/sounds/bell.mp3');
      this.happySound = new Audio('/sounds/happy.mp3');

      // Preload audio files
      this.sentSound.preload = 'auto';
      this.receivedSound.preload = 'auto';
      this.bellSound.preload = 'auto';
      this.happySound.preload = 'auto';

      // Set volume (0.0 to 1.0)
      this.sentSound.volume = 0.5;
      this.receivedSound.volume = 0.5;
      this.bellSound.volume = 0.6;
      this.happySound.volume = 0.7;
    } catch (error) {
      console.warn('Failed to initialize sound files:', error);
    }
  }

  /**
   * Play sound when sending a message
   */
  playSentSound() {
    if (!this.isEnabled || !this.sentSound) return;

    try {
      // Reset audio to beginning and play
      this.sentSound.currentTime = 0;
      this.sentSound.play().catch(error => {
        console.warn('Failed to play sent sound:', error);
      });
    } catch (error) {
      console.warn('Error playing sent sound:', error);
    }
  }

  /**
   * Play sound when receiving a message
   */
  playReceivedSound() {
    if (!this.isEnabled || !this.receivedSound) return;

    try {
      // Reset audio to beginning and play
      this.receivedSound.currentTime = 0;
      this.receivedSound.play().catch(error => {
        console.warn('Failed to play received sound:', error);
      });
    } catch (error) {
      console.warn('Error playing received sound:', error);
    }
  }

  /**
   * Play bell sound for notifications
   */
  playBellSound() {
    if (!this.isEnabled || !this.bellSound) return;

    try {
      // Reset audio to beginning and play
      this.bellSound.currentTime = 0;
      this.bellSound.play().catch(error => {
        console.warn('Failed to play bell sound:', error);
      });
    } catch (error) {
      console.warn('Error playing bell sound:', error);
    }
  }

  /**
   * Play happy sound for positive notifications (chat requests, connections, etc.)
   */
  playHappySound() {
    if (!this.isEnabled || !this.happySound) return;

    try {
      // Reset audio to beginning and play
      this.happySound.currentTime = 0;
      this.happySound.play().catch(error => {
        console.warn('Failed to play happy sound:', error);
      });
    } catch (error) {
      console.warn('Error playing happy sound:', error);
    }
  }

  /**
   * Enable or disable sound playback
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isAudioEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set volume for all sounds (0.0 to 1.0)
   */
  setVolume(volume: number) {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    if (this.sentSound) {
      this.sentSound.volume = clampedVolume;
    }
    if (this.receivedSound) {
      this.receivedSound.volume = clampedVolume;
    }
    if (this.bellSound) {
      this.bellSound.volume = clampedVolume;
    }
    if (this.happySound) {
      this.happySound.volume = clampedVolume;
    }
  }
}

// Create and export singleton instance
export const soundService = new SoundService();
