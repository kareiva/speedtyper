import Phaser from 'phaser'
import GameScene from './GameScene'

class TypingGame {
  constructor(containerId) {
    this.containerId = containerId;
    this.game = null;
    this.config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerId,
      disableContextMenu: true,
      pixelArt: false,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      scene: [GameScene]
    };
  }
  
  init() {
    // Create the game instance
    this.game = new Phaser.Game(this.config);
    
    // Add event listener for before unload to clean up resources
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    return this.game;
  }
  
  restart() {
    // Get the current scene
    const scene = this.game.scene.getScene('GameScene');
    
    // If the scene exists, restart it
    if (scene) {
      scene.restartGame();
    }
  }
  
  destroy() {
    // Remove event listener
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Destroy the game instance
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
  
  handleBeforeUnload() {
    // Clean up resources before the page unloads
    this.destroy();
  }
}

export default TypingGame 