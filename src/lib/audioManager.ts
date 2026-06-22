/**
 * Oasis Sensory Engine: Audio Manager
 * Handles background music, ambient soundscapes, and sensory rewards.
 */

class AudioManager {
  private static instance: AudioManager;
  private bgm: HTMLAudioElement | null = null;
  private ambient: HTMLAudioElement | null = null;
  private volume: number = 0.5;

  private constructor() {}

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  setVolume(val: number) {
    this.volume = val;
    if (this.bgm) this.bgm.volume = val;
    if (this.ambient) this.ambient.volume = val * 0.7; // Ambient slightly quieter
  }

  playBGM(track: string) {
    if (this.bgm) {
      this.bgm.pause();
    }
    this.bgm = new Audio(`/music/${track}.mp3`);
    this.bgm.loop = true;
    this.bgm.volume = this.volume;
    this.bgm.play().catch(e => console.log("Audio play blocked", e));
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm = null;
    }
  }

  playAmbient(track: string) {
    if (this.ambient) {
      this.ambient.pause();
    }
    const path = `/music/${track}.mp3`;
    console.log(`AudioManager: Playing ambient ${path}`);
    this.ambient = new Audio(path);
    this.ambient.loop = true;
    this.ambient.volume = this.volume * 0.7;
    this.ambient.play().catch(e => {
        console.warn("AudioManager: Audio play blocked or failed. This usually happens if the user hasn't interacted with the page yet.", e);
    });
  }

  stopAmbient() {
    if (this.ambient) {
      this.ambient.pause();
      this.ambient = null;
    }
  }

  playReward(sound: "success" | "achievement" | "pop") {
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = this.volume;
    audio.play().catch(() => {});
  }
}

export const audioManager = AudioManager.getInstance();
