import Phaser from 'phaser'

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    
    // Game state
    this.currentWord = ''
    this.nextWordPosition = 0
    this.currentLetterIndex = 0
    
    // Game objects
    this.player = null
    this.platforms = null
    this.letterBlocks = []
    
    // Game metrics
    this.score = 0
    this.timeLeft = 60
    
    // Word list
    this.words = [
      'hello', 'world', 'javascript', 'phaser', 'game', 'development',
      'typing', 'speed', 'challenge', 'keyboard', 'player', 'score',
      'time', 'letter', 'word', 'block', 'jump', 'move', 'complete',
      'elephant', 'banana', 'computer', 'programming', 'algorithm'
    ]
  }

  preload() {
    // Load game assets
    this.load.image('player', 'assets/player.png')
    this.load.image('platform', 'assets/platform.png')
  }

  create() {
    // Initialize game state
    this.score = 0
    this.timeLeft = 60
    this.nextWordPosition = 100
    this.letterBlocks = []
    
    // Create background
    this.createBackground()
    
    // Create platforms group
    this.platforms = this.physics.add.staticGroup()
    
    // Create player
    this.player = this.physics.add.sprite(50, 300, 'player')
    this.player.setBounce(0.2)
    this.player.setCollideWorldBounds(true)
    this.player.setDepth(10)
    
    // Set up collision between player and platforms
    this.physics.add.collider(this.player, this.platforms)
    
    // Create UI elements
    this.createUI()
    
    // Set up keyboard input
    this.input.keyboard.on('keydown', this.handleKeyDown, this)
    
    // Set up camera to follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setBounds(0, 0, 10000, 600)
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, 10000, 600)
    
    // Add first word
    this.addNewWord()
  }

  createBackground() {
    // Create a simple blue gradient background
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0000ff, 0x0000ff, 0x000066, 0x000066, 1)
    bg.fillRect(0, 0, 10000, 600)
    
    // Add some stars
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, 10000)
      const y = Phaser.Math.Between(0, 600)
      const size = Phaser.Math.Between(1, 3)
      const star = this.add.circle(x, y, size, 0xffffff)
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1))
    }
  }

  createUI() {
    // Create score text
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#ffffff'
    }).setScrollFactor(0).setDepth(100)
    
    // Create timer text
    this.timerText = this.add.text(20, 50, 'Time: 60', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#ffffff'
    }).setScrollFactor(0).setDepth(100)
    
    // Create current word display
    this.wordText = this.add.text(20, 80, 'Word: ', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#ffffff'
    }).setScrollFactor(0).setDepth(100)
  }

  update(time, delta) {
    // Update timer
    if (this.timeLeft > 0) {
      this.timeLeft -= delta / 1000
      if (this.timeLeft <= 0) {
        this.timeLeft = 0
        this.endGame()
      }
      this.timerText.setText(`Time: ${Math.ceil(this.timeLeft)}`)
    }
    
    // Check if player has fallen
    if (this.player.y > 550) {
      this.resetPlayerPosition()
    }
    
    // Check if we need a new word
    if (this.currentLetterIndex >= this.currentWord.length) {
      this.addNewWord()
    }
  }

  handleKeyDown(event) {
    // Ignore input if game is over
    if (this.timeLeft <= 0) return
    
    const key = event.key.toLowerCase()
    
    // Check if the pressed key matches the current letter
    if (this.currentLetterIndex < this.currentWord.length && 
        key === this.currentWord[this.currentLetterIndex]) {
      
      // Move player to the next letter block
      this.movePlayerToBlock(this.currentLetterIndex)
      
      // Highlight the completed letter
      this.highlightLetter(this.currentLetterIndex)
      
      // Increment letter index
      this.currentLetterIndex++
      
      // Update score
      this.score++
      this.scoreText.setText(`Score: ${this.score}`)
      
      // Check if word is completed
      if (this.currentLetterIndex >= this.currentWord.length) {
        // Add bonus points for completing a word
        this.score += 5
        this.scoreText.setText(`Score: ${this.score}`)
      }
    }
  }

  movePlayerToBlock(index) {
    if (index < this.letterBlocks.length) {
      const block = this.letterBlocks[index]
      
      // Stop any existing tweens
      this.tweens.killTweensOf(this.player)
      
      // Move player to the block
      this.tweens.add({
        targets: this.player,
        x: block.x,
        y: block.y - 40, // Position player on top of the block
        duration: 150,
        ease: 'Power1',
        onComplete: () => {
          // Reset velocity to prevent falling
          this.player.setVelocityY(0)
        }
      })
    }
  }

  highlightLetter(index) {
    if (index < this.letterBlocks.length) {
      const letterText = this.letterBlocks[index].letterText
      
      // Change the letter's appearance
      letterText.setStyle({
        fontFamily: 'Arial',
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#4CAF50',
        padding: { x: 5, y: 5 }
      })
    }
  }

  resetPlayerPosition() {
    // Find the current or last completed letter block
    const blockIndex = Math.max(0, this.currentLetterIndex - 1)
    if (blockIndex < this.letterBlocks.length) {
      const block = this.letterBlocks[blockIndex]
      
      // Reset player position
      this.player.x = block.x
      this.player.y = block.y - 40
      this.player.setVelocity(0, 0)
    }
  }

  addNewWord() {
    // Get a random word
    this.currentWord = this.getRandomWord()
    this.currentLetterIndex = 0
    
    // Update word display
    this.wordText.setText(`Word: ${this.currentWord}`)
    
    // Clear previous letter blocks
    this.letterBlocks = []
    
    // Create blocks for each letter
    const blockWidth = 60
    const blockSpacing = 20
    const blockY = 300
    
    for (let i = 0; i < this.currentWord.length; i++) {
      const x = this.nextWordPosition + i * (blockWidth + blockSpacing)
      
      // Create platform
      const platform = this.platforms.create(x, blockY, 'platform')
      platform.setScale(0.5, 0.2).refreshBody()
      platform.setDepth(1)
      
      // Create letter text
      const letterText = this.add.text(x, blockY - 20, this.currentWord[i], {
        fontFamily: 'Arial',
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      })
      letterText.setOrigin(0.5)
      letterText.setDepth(2)
      
      // Store reference to the block and its letter
      this.letterBlocks.push({
        x: x,
        y: blockY,
        platform: platform,
        letterText: letterText
      })
    }
    
    // Position player at the first block if this is the first word
    if (this.nextWordPosition === 100) {
      this.player.x = this.letterBlocks[0].x
      this.player.y = this.letterBlocks[0].y - 40
    }
    
    // Update next word position
    this.nextWordPosition += this.currentWord.length * (blockWidth + blockSpacing) + 100
  }

  getRandomWord() {
    const randomIndex = Math.floor(Math.random() * this.words.length)
    return this.words[randomIndex]
  }

  endGame() {
    // Stop handling input
    this.input.keyboard.removeAllListeners()
    
    // Display game over message
    const gameOverText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      'Game Over!',
      {
        fontFamily: 'Arial',
        fontSize: '48px',
        fill: '#ffffff'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100)
    
    const finalScoreText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2 + 60,
      `Final Score: ${this.score}`,
      {
        fontFamily: 'Arial',
        fontSize: '32px',
        fill: '#ffffff'
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(100)
    
    // Emit game over event
    this.events.emit('gameOver', { score: this.score })
  }
}

export default GameScene 