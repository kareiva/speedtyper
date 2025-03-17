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
    
    // Create starting cliff
    this.createStartingCliff()
    
    // Create player
    this.player = this.physics.add.sprite(50, 200, 'player')
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
    
    // Add second word ahead
    this.addNextWord()
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

  createStartingCliff() {
    // Create a starting cliff platform
    const cliff = this.platforms.create(50, 300, 'platform')
    cliff.setScale(1.5, 0.5).refreshBody()
    cliff.setDepth(1)
    
    // Add some visual details to the cliff
    const cliffTop = this.add.rectangle(50, 285, 150, 10, 0x008800)
    cliffTop.setDepth(2)
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
    
    // Check if we need a new word - make sure we have letter blocks first
    if (this.letterBlocks.length > 0 && this.currentLetterIndex >= this.letterBlocks.length) {
      this.moveToNextWord()
    }
    
    // Check if we need to generate more words ahead
    if (this.player.x > this.nextWordPosition - 800) {
      this.addNextWord()
    }
    
    // Debug check - if the word display doesn't match the platforms, fix it
    if (this.letterBlocks.length > 0) {
      let platformWord = '';
      for (let i = 0; i < this.letterBlocks.length; i++) {
        platformWord += this.letterBlocks[i].letter;
      }
      
      if (this.currentWord !== platformWord) {
        console.log('Word mismatch detected, fixing...');
        this.currentWord = platformWord;
        this.wordText.setText(`Word: ${this.currentWord}`);
      }
    }
  }

  handleKeyDown(event) {
    // Ignore input if game is over
    if (this.timeLeft <= 0) return
    
    const key = event.key.toLowerCase()
    
    // Verify we have letter blocks and are within bounds
    if (this.letterBlocks.length === 0 || this.currentLetterIndex >= this.letterBlocks.length) {
      return;
    }
    
    // Get the expected letter from the current letter block
    const expectedLetter = this.letterBlocks[this.currentLetterIndex].letter;
    
    // Check if the pressed key matches the current letter
    if (key === expectedLetter) {
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
      if (this.currentLetterIndex >= this.letterBlocks.length) {
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
      
      // Calculate jump parameters
      const startX = this.player.x
      const startY = this.player.y
      const endX = block.x
      const endY = block.y - 40 // Position player on top of the block
      const distance = Math.abs(endX - startX)
      
      // Determine jump height based on distance
      const jumpHeight = Math.min(150, Math.max(80, distance * 0.4))
      
      // Calculate duration based on distance (faster for longer jumps)
      const duration = Math.min(600, Math.max(200, distance * 0.8))
      
      // Create a simple arc jump using a single tween with a custom update function
      this.tweens.add({
        targets: this.player,
        x: endX,
        // We don't set y directly, we'll handle it in the update function
        duration: duration,
        ease: 'Sine.Out',
        onUpdate: (tween) => {
          // Calculate progress (0 to 1)
          const progress = tween.progress
          
          // Create an arc effect by modifying the y position based on progress
          // At progress = 0.5, the player should be at the highest point
          const heightFactor = 1 - (2 * Math.abs(progress - 0.5))
          this.player.y = startY - (jumpHeight * heightFactor) + 
                          (progress * (endY - startY))
        },
        onComplete: () => {
          // Ensure final position is correct
          this.player.x = endX
          this.player.y = endY
          
          // Reset velocity to prevent falling
          this.player.setVelocityY(0)
          
          // Add a small bounce effect at the end
          this.tweens.add({
            targets: this.player,
            y: endY + 10,
            duration: 100,
            yoyo: true,
            ease: 'Quad.Out'
          })
        }
      })
      
      // Add a rotation effect for longer jumps
      if (distance > 100) {
        // Determine rotation direction based on movement direction
        const rotationDirection = endX > startX ? 1 : -1
        
        // Add rotation tween
        this.tweens.add({
          targets: this.player,
          angle: rotationDirection * 360,
          duration: duration,
          onComplete: () => {
            // Reset angle at the end
            this.player.angle = 0
          }
        })
      }
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
    // Clear previous letter blocks and platforms
    this.letterBlocks.forEach(block => {
      if (block.platform) block.platform.destroy();
      if (block.letterText) block.letterText.destroy();
    });
    this.letterBlocks = [];
    
    // Get a random word
    const newWord = this.getRandomWord();
    this.currentWord = newWord;
    this.currentLetterIndex = 0;
    
    // Update word display
    this.wordText.setText(`Word: ${this.currentWord}`);
    
    // Create blocks for each letter
    const blockWidth = 60;
    const blockSpacing = 20;
    const blockY = 300;
    
    // Position the first word after the starting cliff
    this.nextWordPosition = 150;
    
    // Create a platform and letter for each character in the word
    for (let i = 0; i < this.currentWord.length; i++) {
      const x = this.nextWordPosition + i * (blockWidth + blockSpacing);
      
      // Create platform
      const platform = this.platforms.create(x, blockY, 'platform');
      platform.setScale(0.5, 0.2).refreshBody();
      platform.setDepth(1);
      
      // Create letter text
      const letterText = this.add.text(x, blockY - 20, this.currentWord[i], {
        fontFamily: 'Arial',
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      });
      letterText.setOrigin(0.5);
      letterText.setDepth(2);
      
      // Store reference to the block and its letter
      this.letterBlocks.push({
        x: x,
        y: blockY,
        platform: platform,
        letterText: letterText,
        letter: this.currentWord[i]  // Store the actual letter for verification
      });
    }
    
    // Position player at the starting cliff
    this.player.x = 50;
    this.player.y = 200;
    
    // Update next word position for future words
    this.nextWordPosition += this.currentWord.length * (blockWidth + blockSpacing) + 150; // Bigger gap between words
  }

  addNextWord() {
    // Get a random word
    const nextWord = this.getRandomWord();
    
    // Create blocks for each letter
    const blockWidth = 60;
    const blockSpacing = 20;
    const blockY = 300;
    
    // Create a platform and letter for each character in the word
    for (let i = 0; i < nextWord.length; i++) {
      const x = this.nextWordPosition + i * (blockWidth + blockSpacing);
      
      // Create platform
      const platform = this.platforms.create(x, blockY, 'platform');
      platform.setScale(0.5, 0.2).refreshBody();
      platform.setDepth(1);
      
      // Create letter text
      const letterText = this.add.text(x, blockY - 20, nextWord[i], {
        fontFamily: 'Arial',
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 5 }
      });
      letterText.setOrigin(0.5);
      letterText.setDepth(2);
    }
    
    // Update next word position for future words
    this.nextWordPosition += nextWord.length * (blockWidth + blockSpacing) + 150; // Bigger gap between words
    
    // Extend world bounds if needed
    if (this.nextWordPosition > this.physics.world.bounds.width - 1000) {
      const newWidth = this.physics.world.bounds.width + 5000;
      this.physics.world.setBounds(0, 0, newWidth, 600);
      this.cameras.main.setBounds(0, 0, newWidth, 600);
      
      // Extend the background
      this.extendBackground(this.physics.world.bounds.width - 5000, newWidth);
    }
  }

  moveToNextWord() {
    // Find the next word's starting position
    const blockWidth = 60;
    const blockSpacing = 20;
    
    // Clear current letter blocks (but don't destroy platforms)
    const oldLetterBlocks = this.letterBlocks;
    this.letterBlocks = [];
    
    // Find the next word's platforms and letters
    let nextWordStartX = oldLetterBlocks[oldLetterBlocks.length - 1].x + blockWidth + 150; // Start looking after the current word
    let foundNextWord = false;
    let nextWordLetters = [];
    
    // Look through all platforms to find the next word
    this.platforms.getChildren().forEach(platform => {
      // Skip platforms that are part of the current word
      let isCurrentWordPlatform = false;
      for (let i = 0; i < oldLetterBlocks.length; i++) {
        if (oldLetterBlocks[i].platform === platform) {
          isCurrentWordPlatform = true;
          break;
        }
      }
      
      if (!isCurrentWordPlatform && platform.x >= nextWordStartX) {
        // Find the letter text at this position
        let letterText = null;
        let letter = '';
        
        this.children.list.forEach(child => {
          if (child.type === 'Text' && 
              Math.abs(child.x - platform.x) < 5 && 
              Math.abs(child.y - (platform.y - 20)) < 5) {
            letterText = child;
            letter = child.text.toLowerCase();
          }
        });
        
        if (letterText) {
          // Add to the next word letters
          nextWordLetters.push({
            x: platform.x,
            y: platform.y,
            platform: platform,
            letterText: letterText,
            letter: letter
          });
          foundNextWord = true;
        }
      }
    });
    
    // Sort the letters by x position
    nextWordLetters.sort((a, b) => a.x - b.x);
    
    // Set the new word
    if (foundNextWord) {
      this.letterBlocks = nextWordLetters;
      
      // Build the new current word
      let newWord = '';
      for (let i = 0; i < this.letterBlocks.length; i++) {
        newWord += this.letterBlocks[i].letter;
      }
      
      this.currentWord = newWord;
      this.currentLetterIndex = 0;
      this.wordText.setText(`Word: ${this.currentWord}`);
    } else {
      // If no next word found, generate a new one
      this.addNewWord();
    }
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

  // Add a method to extend the background
  extendBackground(startX, endX) {
    // Create a simple blue gradient background extension
    const bg = this.add.graphics()
    bg.fillGradientStyle(0x0000ff, 0x0000ff, 0x000066, 0x000066, 1)
    bg.fillRect(startX, 0, endX - startX, 600)
    
    // Add some stars to the new area
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(startX, endX)
      const y = Phaser.Math.Between(0, 600)
      const size = Phaser.Math.Between(1, 3)
      const star = this.add.circle(x, y, size, 0xffffff)
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1))
    }
  }
}

export default GameScene 