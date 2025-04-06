export class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};

  private constructor() {
    this.sounds = {
      shoot: new Audio('/sounds/shoot.mp3'),
      explosion: new Audio('/sounds/explosion.mp3'),
      hit: new Audio('/sounds/hit.mp3'),
      move: new Audio('/sounds/move.mp3'),
      select: new Audio('/sounds/select.mp3')
    };

    // Preload sounds
    Object.values(this.sounds).forEach(sound => {
      sound.load();
    });
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  play(soundName: string) {
    const sound = this.sounds[soundName];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {
        // Ignore errors if sound can't play (e.g., user hasn't interacted with page)
      });
    }
  }
} 