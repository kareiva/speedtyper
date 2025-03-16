import Phaser from 'phaser'
import BackgroundManager from './BackgroundManager'
import GameLoader from './GameLoader'
import UIManager from './UIManager'

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene')
    this.currentWord = ''
    this.currentWordBlocks = []
    this.currentLetterIndex = 0
    this.player = null
    this.score = 0
    this.timeLeft = 60
    this.blockGroup = null
    this.worldWidth = 10000 // Extended world width for scrolling
    this.currentWorldPosition = 0 // Track current position in the world
    this.completedWords = 0 // Track number of completed words
    this.ground = null // Ground platform
    this.wordSpacing = 1000 // Fixed spacing between words
    
    // Initialize managers
    this.backgroundManager = null
    this.gameLoader = null
    this.uiManager = null
    
    // Track if assets are already loaded
    this.assetsLoaded = false
  }

  preload() {
    // Only load assets if they haven't been loaded already
    if (!this.assetsLoaded) {
      // Initialize and use the GameLoader
      this.gameLoader = new GameLoader(this)
      this.gameLoader.preload()
      this.assetsLoaded = true
    }
  }

  create() {
    // Initialize game variables
    this.score = 0
    this.timeLeft = 60
    this.completedWords = 0
    this.currentWorldPosition = 0
    
    // Initialize managers if they don't exist
    if (!this.backgroundManager) {
      this.backgroundManager = new BackgroundManager(this)
    }
    
    if (!this.uiManager) {
      this.uiManager = new UIManager(this)
    }
    
    // Set world bounds for scrolling
    this.physics.world.setBounds(0, 0, this.worldWidth, 600)
    
    // Load words from file
    this.words = this.gameLoader.loadWords()
    
    // Create parallax background layers only if they don't exist
    if (!this.backgroundManager.hasBackgrounds()) {
      this.backgroundManager.createParallaxBackground(this.worldWidth)
    }
    
    // Create ground platform that spans the entire world width
    this.ground = this.physics.add.staticGroup()
    this.ground.create(this.worldWidth/2, 580, 'platform').setScale(this.worldWidth/100, 0.5).refreshBody()
    
    // Create UI elements
    this.uiManager.createUI()
    
    // Create block group
    this.blockGroup = this.physics.add.staticGroup()
    
    // Create player
    this.player = this.physics.add.sprite(100, 450, 'player')
    this.player.setBounce(0.2)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(20) // Ensure player is visible on top
    
    // Add collision between player and blocks/ground
    this.physics.add.collider(this.player, this.blockGroup)
    this.physics.add.collider(this.player, this.ground)
    
    // Set camera to follow player
    this.cameras.main.setBounds(0, 0, this.worldWidth, 600)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    
    // Set a new word
    this.setNewWord()
    
    // Add keyboard input
    this.input.keyboard.on('keydown', this.handleKeyDown, this)
    
    // Timer
    this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    })
  }

  update() {
    // Check if player has fallen off the blocks
    if (this.player.y > 550 && this.currentWordBlocks.length > 0) {
      // Reset player to the current block
      const currentBlock = this.currentWordBlocks[Math.min(this.currentLetterIndex, this.currentWordBlocks.length - 1)]
      this.player.x = currentBlock.block.x
      this.player.y = currentBlock.block.y - 40 // Position player on top of block
      this.player.setVelocity(0, 0)
    }
    
    // Ensure UI elements stay visible
    this.uiManager.ensureVisibility()
  }

  setNewWord() {
    // Clear previous blocks
    this.blockGroup.clear(true, true)
    this.currentWordBlocks = []
    this.currentLetterIndex = 0
    
    // Select a random word
    this.currentWord = this.gameLoader.getRandomWord()
    this.uiManager.updateWordDisplay(this.currentWord)
    
    // Calculate starting position for the new word with fixed spacing
    // First word starts at x=100, subsequent words have fixed spacing
    const startX = 100 + (this.completedWords * this.wordSpacing)
    const y = 500
    
    // Check if we're approaching the world bounds and extend if needed
    if (startX + (this.currentWord.length * 80) > this.worldWidth - 1000) {
      this.worldWidth += 5000
      this.physics.world.setBounds(0, 0, this.worldWidth, 600)
      this.cameras.main.setBounds(0, 0, this.worldWidth, 600)
      
      // Extend the background instead of recreating it
      this.backgroundManager.extendBackground(this.worldWidth)
      
      // Extend the ground
      this.ground.clear(true, true)
      this.ground.create(this.worldWidth/2, 580, 'platform').setScale(this.worldWidth/100, 0.5).refreshBody()
    }
    
    // Create blocks for each letter
    const blockWidth = 60
    const blockSpacing = 20
    
    for (let i = 0; i < this.currentWord.length; i++) {
      const x = startX + i * (blockWidth + blockSpacing)
      const block = this.blockGroup.create(x, y, 'platform')
      block.setScale(0.5, 0.2).refreshBody()
      block.setDepth(10) // Set block depth
      
      // Add letter on top of the block
      const letter = this.add.text(x, y - 20, this.currentWord[i], { 
        fontSize: '32px', 
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 5, y: 5 }
      })
      letter.setOrigin(0.5)
      letter.setDepth(15) // Set letter depth
      
      this.currentWordBlocks.push({ block, letter, character: this.currentWord[i] })
    }
    
    // Position player at the first block
    if (this.currentWordBlocks.length > 0) {
      const firstBlock = this.currentWordBlocks[0]
      this.player.x = firstBlock.block.x
      this.player.y = firstBlock.block.y - 40 // Position player on top of block
      this.player.setVelocity(0, 0) // Reset velocity to prevent falling
      
      // Update current world position
      this.currentWorldPosition = firstBlock.block.x
    }
  }

  handleKeyDown(event) {
    const letter = event.key.toLowerCase()
    
    // Check if the typed letter matches the current letter in the word
    if (this.currentLetterIndex < this.currentWord.length && 
        letter === this.currentWord[this.currentLetterIndex]) {
      
      // Move to the next letter
      this.currentLetterIndex++
      
      // Move player to the next block
      if (this.currentLetterIndex < this.currentWordBlocks.length) {
        const nextBlock = this.currentWordBlocks[this.currentLetterIndex]
        // Animate player jumping to next block
        this.tweens.add({
          targets: this.player,
          x: nextBlock.block.x,
          y: { 
            value: nextBlock.block.y - 40, 
            duration: 300,
            ease: 'Power2',
            yoyo: false
          },
          duration: 300,
          ease: 'Power2',
          onStart: () => {
            // Add a small upward jump at the start
            this.player.setVelocityY(-150)
          }
        })
      }
      
      // If the word is completed
      if (this.currentLetterIndex === this.currentWord.length) {
        this.score += this.currentWord.length
        this.uiManager.updateScore(this.score)
        this.completedWords++
        
        // Wait a moment before setting a new word
        this.time.delayedCall(500, () => {
          this.setNewWord()
        })
      }
    }
  }

  updateTimer() {
    this.timeLeft--
    this.uiManager.updateTime(this.timeLeft)
    
    if (this.timeLeft <= 0) {
      // Game over
      this.input.keyboard.off('keydown', this.handleKeyDown, this)
      
      // Show game over text
      this.uiManager.showGameOver()
      
      // Add restart button
      const restartButton = this.add.text(400, 400, 'Play Again', {
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 20, y: 10 }
      })
      .setScrollFactor(0)
      .setOrigin(0.5)
      .setDepth(100)
      .setInteractive({ useHandCursor: true })
      
      restartButton.on('pointerdown', () => {
        this.restartGame()
      })
    }
  }
  
  restartGame() {
    // Reset game state without reloading assets
    this.blockGroup.clear(true, true)
    this.currentWordBlocks = []
    this.score = 0
    this.timeLeft = 60
    this.completedWords = 0
    this.currentLetterIndex = 0
    
    // Re-enable keyboard input
    this.input.keyboard.on('keydown', this.handleKeyDown, this)
    
    // Reset UI
    this.uiManager.updateScore(0)
    this.uiManager.updateTime(60)
    
    // Set a new word and restart
    this.setNewWord()
    
    // Remove any game over text or restart buttons
    this.children.each(child => {
      if (child.text === 'Game Over!' || child.text === 'Play Again') {
        child.destroy()
      }
    })
  }
}

export default GameScene 