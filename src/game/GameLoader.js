import Phaser from 'phaser'

class GameLoader {
  constructor(scene) {
    this.scene = scene;
    this.words = [];
  }

  preload() {
    // Load game assets
    this.scene.load.image('platform', 'assets/platform.png');
    this.scene.load.image('player', 'assets/player.png');
    this.scene.load.text('words', 'assets/english.txt');
  }

  loadWords() {
    // Load words from file
    const wordContent = this.scene.cache.text.get('words');
    this.words = wordContent.split('\n').filter(word => word.trim().length > 0);
    return this.words;
  }

  getRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.words.length);
    return this.words[randomIndex].toLowerCase();
  }
}

export default GameLoader; 