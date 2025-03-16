import Phaser from 'phaser'
import GameScene from './GameScene'

class TypingGame {
  constructor(containerId) {
    this.config = {
      type: Phaser.AUTO,
      parent: containerId,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      scene: [GameScene]
    }
    
    this.game = new Phaser.Game(this.config)
    
    // Store reference to the game instance
    this.gameInstance = this.game
    
    // Add event listener for when the game is about to be destroyed
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this))
  }
  
  handleBeforeUnload() {
    // This ensures assets are properly cleaned up before the page unloads
    if (this.gameInstance) {
      // Get the current scene
      const scene = this.gameInstance.scene.getScene('GameScene')
      if (scene) {
        // Clean up any resources that might be causing issues
        scene.input.keyboard.off('keydown')
      }
    }
  }

  destroy() {
    // Remove event listener
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this))
    
    if (this.game) {
      // Properly clean up resources before destroying
      const scene = this.game.scene.getScene('GameScene')
      if (scene) {
        // Clean up any resources that might be causing issues
        scene.input.keyboard.off('keydown')
      }
      
      this.game.destroy(true)
      this.game = null
    }
  }
  
  restart() {
    // Restart the game scene
    if (this.game) {
      const scene = this.game.scene.getScene('GameScene')
      if (scene && scene.restartGame) {
        scene.restartGame()
      }
    }
  }
}

export default TypingGame 