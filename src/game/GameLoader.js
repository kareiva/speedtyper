import Phaser from 'phaser'

// Static flag to track if assets have been loaded across all instances
let globalAssetsLoaded = false;

class GameLoader {
  constructor(scene) {
    this.scene = scene;
    this.words = [];
    // Use the global flag instead of instance-specific flag
  }

  preload() {
    // Only load assets if they haven't been loaded already (using global flag)
    if (!globalAssetsLoaded) {
      console.log('Loading game assets for the first time');
      // Load game assets
      this.scene.load.image('platform', 'assets/platform.png');
      this.scene.load.image('player', 'assets/player.png');
      this.scene.load.text('words', 'assets/english.txt');
      globalAssetsLoaded = true;
    } else {
      console.log('Assets already loaded, skipping load');
    }
  }

  loadWords() {
    // Only load words if they haven't been loaded already
    if (this.words.length === 0 && this.scene.cache.text.has('words')) {
      const wordContent = this.scene.cache.text.get('words');
      this.words = wordContent.split('\n').filter(word => word.trim().length > 0);
    }
    return this.words;
  }

  getRandomWord() {
    if (this.words.length === 0) {
      return 'error'; // Fallback word if no words are loaded
    }
    const randomIndex = Math.floor(Math.random() * this.words.length);
    return this.words[randomIndex].toLowerCase();
  }
}

export default GameLoader; 