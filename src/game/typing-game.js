import Phaser from 'phaser'

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.words = []
    this.currentWord = ''
    this.currentWordBlocks = []
    this.currentLetterIndex = 0
    this.player = null
    this.scoreText = null
    this.score = 0
    this.timeText = null
    this.timeLeft = 60
    this.blockGroup = null
    this.wordText = null
    this.worldWidth = 10000 // Extended world width for scrolling
    this.currentWorldPosition = 0 // Track current position in the world
    this.completedWords = 0 // Track number of completed words
    this.ground = null // Ground platform
    this.wordSpacing = 1000 // Fixed spacing between words
    this.uiLayer = null // Layer for UI elements
  }

  preload() {
    this.load.image('platform', 'assets/platform.png')
    this.load.image('player', 'assets/player.png')
    this.load.text('words', 'assets/english.txt')
  }

  create() {
    // Initialize game variables
    this.score = 0
    this.timeLeft = 60
    this.completedWords = 0
    this.currentWorldPosition = 0
    
    // Set world bounds for scrolling
    this.physics.world.setBounds(0, 0, this.worldWidth, 600)
    
    // Load words from file
    const wordContent = this.cache.text.get('words')
    this.words = wordContent.split('\n').filter(word => word.trim().length > 0)
    
    // Create background
    this.add.rectangle(this.worldWidth/2, 300, this.worldWidth, 600, 0x87CEEB)
    
    // Create ground platform that spans the entire world width
    this.ground = this.physics.add.staticGroup();
    this.ground.create(this.worldWidth/2, 580, 'platform').setScale(this.worldWidth/100, 0.5).refreshBody();
    
    // Create a separate camera for UI elements
    this.uiLayer = this.add.container(0, 0);
    this.uiLayer.setDepth(100); // Ensure UI is on top
    
    // Create score and time display - these will be in the UI layer
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#000',
      backgroundColor: '#ffffff80',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0) // Fixed to camera
    .setDepth(100);
    
    this.timeText = this.add.text(16, 60, 'Time: 60', { 
      fontSize: '32px', 
      fill: '#000',
      backgroundColor: '#ffffff80',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0) // Fixed to camera
    .setDepth(100);
    
    // Create word display - this will be in the UI layer
    this.wordText = this.add.text(400, 100, '', { 
      fontSize: '32px', 
      fill: '#000',
      backgroundColor: '#ffffff80',
      padding: { x: 10, y: 5 }
    })
    .setScrollFactor(0) // Fixed to camera
    .setOrigin(0.5)
    .setDepth(100);
    
    // Create block group
    this.blockGroup = this.physics.add.staticGroup();
    
    // Create player
    this.player = this.physics.add.sprite(100, 450, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    
    // Add collision between player and blocks/ground
    this.physics.add.collider(this.player, this.blockGroup);
    this.physics.add.collider(this.player, this.ground);
    
    // Set camera to follow player
    this.cameras.main.setBounds(0, 0, this.worldWidth, 600);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    
    // Set a new word
    this.setNewWord();
    
    // Add keyboard input
    this.input.keyboard.on('keydown', this.handleKeyDown, this);
    
    // Timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
  }

  update() {
    // Check if player has fallen off the blocks
    if (this.player.y > 550 && this.currentWordBlocks.length > 0) {
      // Reset player to the current block
      const currentBlock = this.currentWordBlocks[Math.min(this.currentLetterIndex, this.currentWordBlocks.length - 1)];
      this.player.x = currentBlock.block.x;
      this.player.y = currentBlock.block.y - 50;
      this.player.setVelocity(0, 0);
    }
    
    // Ensure UI elements stay visible
    this.scoreText.setVisible(true);
    this.timeText.setVisible(true);
    this.wordText.setVisible(true);
  }

  setNewWord() {
    // Clear previous blocks
    this.blockGroup.clear(true, true);
    this.currentWordBlocks = [];
    this.currentLetterIndex = 0;
    
    // Select a random word
    const randomIndex = Math.floor(Math.random() * this.words.length);
    this.currentWord = this.words[randomIndex].toLowerCase();
    this.wordText.setText(this.currentWord);
    
    // Calculate starting position for the new word with fixed spacing
    // First word starts at x=100, subsequent words have fixed spacing
    const startX = 100 + (this.completedWords * this.wordSpacing);
    const y = 500;
    
    // Check if we're approaching the world bounds and extend if needed
    if (startX + (this.currentWord.length * 80) > this.worldWidth - 1000) {
      this.worldWidth += 5000;
      this.physics.world.setBounds(0, 0, this.worldWidth, 600);
      this.cameras.main.setBounds(0, 0, this.worldWidth, 600);
      
      // Extend the background and ground
      this.add.rectangle(this.worldWidth/2, 300, this.worldWidth, 600, 0x87CEEB);
      this.ground.clear(true, true);
      this.ground.create(this.worldWidth/2, 580, 'platform').setScale(this.worldWidth/100, 0.5).refreshBody();
    }
    
    // Create blocks for each letter
    const blockWidth = 60;
    const blockSpacing = 20;
    
    for (let i = 0; i < this.currentWord.length; i++) {
      const x = startX + i * (blockWidth + blockSpacing);
      const block = this.blockGroup.create(x, y, 'platform');
      block.setScale(0.5, 0.2).refreshBody();
      
      // Add letter on top of the block
      const letter = this.add.text(x, y - 20, this.currentWord[i], { 
        fontSize: '32px', 
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 5, y: 5 }
      });
      letter.setOrigin(0.5);
      
      this.currentWordBlocks.push({ block, letter, character: this.currentWord[i] });
    }
    
    // Position player at the first block
    if (this.currentWordBlocks.length > 0) {
      const firstBlock = this.currentWordBlocks[0];
      this.player.x = firstBlock.block.x;
      this.player.y = firstBlock.block.y - 50;
      this.player.setVelocity(0, 0); // Reset velocity to prevent falling
      
      // Update current world position
      this.currentWorldPosition = firstBlock.block.x;
    }
  }

  handleKeyDown(event) {
    const letter = event.key.toLowerCase();
    
    // Check if the typed letter matches the current letter in the word
    if (this.currentLetterIndex < this.currentWord.length && 
        letter === this.currentWord[this.currentLetterIndex]) {
      
      // Move to the next letter
      this.currentLetterIndex++;
      
      // Move player to the next block
      if (this.currentLetterIndex < this.currentWordBlocks.length) {
        const nextBlock = this.currentWordBlocks[this.currentLetterIndex];
        this.tweens.add({
          targets: this.player,
          x: nextBlock.block.x,
          y: nextBlock.block.y - 50,
          duration: 200,
          ease: 'Power2'
        });
      }
      
      // If the word is completed
      if (this.currentLetterIndex === this.currentWord.length) {
        this.score += this.currentWord.length;
        this.scoreText.setText('Score: ' + this.score);
        this.completedWords++;
        
        // Wait a moment before setting a new word
        this.time.delayedCall(500, () => {
          this.setNewWord();
        });
      }
    }
  }

  updateTimer() {
    this.timeLeft--;
    this.timeText.setText('Time: ' + this.timeLeft);
    
    if (this.timeLeft <= 0) {
      // Game over
      this.input.keyboard.off('keydown', this.handleKeyDown, this);
      
      // Show game over text that follows the camera
      this.add.text(400, 300, 'Game Over!', { 
        fontSize: '64px', 
        fill: '#000',
        backgroundColor: '#fff',
        padding: { x: 10, y: 10 }
      })
      .setScrollFactor(0) // Fixed to camera
      .setOrigin(0.5)
      .setDepth(100);
    }
  }
}

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
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true)
    }
  }
}

export default TypingGame 