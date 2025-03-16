import Phaser from 'phaser'

class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.scoreText = null;
    this.timeText = null;
    this.wordText = null;
    this.uiLayer = null;
    this.gameOverText = null;
  }

  createUI() {
    // If UI elements already exist, just make them visible and return
    if (this.scoreText && this.timeText && this.wordText) {
      this.scoreText.setVisible(true);
      this.timeText.setVisible(true);
      this.wordText.setVisible(true);
      return;
    }
    
    // Create a separate container for UI elements
    this.uiLayer = this.scene.add.container(0, 0);
    this.uiLayer.setDepth(100); // Ensure UI is on top
    
    // Create score display
    this.scoreText = this.scene.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#000',
      backgroundColor: '#ffffff80',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0) // Fixed to camera
    .setDepth(100);
    
    // Create time display
    this.timeText = this.scene.add.text(16, 60, 'Time: 60', { 
      fontSize: '32px', 
      fill: '#000',
      backgroundColor: '#ffffff80',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0) // Fixed to camera
    .setDepth(100);
    
    // Create word display
    this.wordText = this.scene.add.text(400, 100, '', { 
      fontSize: '32px', 
      fill: '#000',
      backgroundColor: '#ffffff80',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0) // Fixed to camera
    .setOrigin(0.5)
    .setDepth(100);
  }

  updateScore(score) {
    if (this.scoreText) {
      this.scoreText.setText('Score: ' + score);
    }
  }

  updateTime(timeLeft) {
    if (this.timeText) {
      this.timeText.setText('Time: ' + timeLeft);
    }
  }

  updateWordDisplay(word) {
    if (this.wordText) {
      this.wordText.setText(word);
    }
  }

  showGameOver() {
    // Remove any existing game over text
    if (this.gameOverText) {
      this.gameOverText.destroy();
    }
    
    // Show game over text that follows the camera
    this.gameOverText = this.scene.add.text(400, 300, 'Game Over!', { 
      fontSize: '64px', 
      fill: '#000',
      backgroundColor: '#fff',
      padding: { x: 10, y: 10 }
    })
    .setScrollFactor(0) // Fixed to camera
    .setOrigin(0.5)
    .setDepth(100);
  }

  hideGameOver() {
    if (this.gameOverText) {
      this.gameOverText.destroy();
      this.gameOverText = null;
    }
  }

  ensureVisibility() {
    // Ensure UI elements stay visible
    if (this.scoreText) this.scoreText.setVisible(true);
    if (this.timeText) this.timeText.setVisible(true);
    if (this.wordText) this.wordText.setVisible(true);
  }
}

export default UIManager; 