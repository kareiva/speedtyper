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
    this.nextWordBlocks = [] // Track the next word's blocks separately
    
    // Game metrics
    this.score = 0
    this.timeLeft = 60
    
    // Language settings - get from URL parameter if available
    this.currentLanguage = this.getLanguageFromURL()
    
    // Word lists
    this.wordLists = {
      english: [],
      lithuanian: []
    }
  }

  // Get language from URL parameter
  getLanguageFromURL() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const langParam = urlParams.get('lang');
      
      // If lang parameter exists and is valid, use it
      if (langParam && (langParam === 'english' || langParam === 'lithuanian')) {
        console.log(`Language set from URL: ${langParam}`);
        return langParam;
      }
    }
    
    // Default to English if no valid parameter
    return 'english';
  }

  preload() {
    // Load game assets
    this.load.image('player', 'assets/player.png')
    this.load.image('platform', 'assets/platform.png')
    
    // Load word lists
    this.load.text('english_words', 'assets/english.txt')
    this.load.text('lithuanian_words', 'assets/lithuanian.txt')
  }

  create() {
    // Load word lists from files
    this.loadWordLists()
    
    // Initialize game state
    this.score = 0
    this.timeLeft = 60
    this.nextWordPosition = 100
    this.letterBlocks = []
    this.nextWordBlocks = []
    
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
  }

  loadWordLists() {
    // Load English words
    if (this.cache.text.has('english_words')) {
      const englishText = this.cache.text.get('english_words');
      this.wordLists.english = englishText.split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);
      console.log(`Loaded ${this.wordLists.english.length} English words`);
    } else {
      console.error('English word list not found!');
      // Fallback words
      this.wordLists.english = ['error', 'loading', 'failed'];
    }
    
    // Load Lithuanian words
    if (this.cache.text.has('lithuanian_words')) {
      const lithuanianText = this.cache.text.get('lithuanian_words');
      this.wordLists.lithuanian = lithuanianText.split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0);
      console.log(`Loaded ${this.wordLists.lithuanian.length} Lithuanian words`);
    } else {
      console.error('Lithuanian word list not found!');
      // Fallback words
      this.wordLists.lithuanian = ['klaida', 'nepavyko', 'ikelti'];
    }
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
    
    // Create language toggle button
    const languageButton = this.add.text(700, 20, 'Language', {
      fontFamily: 'Arial',
      fontSize: '20px',
      fill: '#ffffff',
      backgroundColor: '#4CAF50',
      padding: { x: 10, y: 5 }
    }).setScrollFactor(0).setDepth(100).setInteractive();
    
    // Update button text based on current language
    languageButton.setText(`Language: ${this.currentLanguage === 'english' ? 'English' : 'Lithuanian'}`);
    
    // Add click handler for language toggle via URL
    languageButton.on('pointerdown', () => {
      this.switchLanguageViaURL();
    });
    
    this.languageButton = languageButton;
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
  }

  handleKeyDown(event) {
    // Ignore input if game is over
    if (this.timeLeft <= 0) return
    
    const key = event.key.toLowerCase()
    
    // Language toggle with L key - now uses URL parameter
    if (key === 'l' && event.ctrlKey) {
      this.switchLanguageViaURL();
      return;
    }
    
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

  moveToNextWord() {
    // The next word becomes the current word
    if (this.nextWordBlocks.length > 0) {
      // Clear current letter blocks array
      this.letterBlocks.forEach(block => {
        // Don't destroy the platforms or text, they stay visible
        // Just remove them from our tracking array
      });
      
      // The next word blocks become the current word blocks
      this.letterBlocks = this.nextWordBlocks;
      this.nextWordBlocks = [];
      
      // Update current word
      this.currentWord = '';
      for (let i = 0; i < this.letterBlocks.length; i++) {
        this.currentWord += this.letterBlocks[i].letter;
      }
      
      // Reset letter index
      this.currentLetterIndex = 0;
      
      // Update word display
      this.wordText.setText(`Word: ${this.currentWord}`);
      
      // Position player at the first letter of the new word
      if (this.letterBlocks.length > 0) {
        this.player.x = this.letterBlocks[0].x;
        this.player.y = this.letterBlocks[0].y - 40;
      }
      
      // Generate a new "next word"
      this.addNextWord();
    } else {
      // If there's no next word yet, create one
      this.addNextWord();
      this.moveToNextWord();
    }
  }

  addNewWord() {
    // Clear ALL previous platforms and letter blocks to avoid any leftover blocks
    this.platforms.clear(true, true);
    
    // Recreate the starting cliff since we cleared all platforms
    this.createStartingCliff();
    
    // Clear letter blocks array
    this.letterBlocks.forEach(block => {
      if (block.letterText) block.letterText.destroy();
    });
    this.letterBlocks = [];
    this.nextWordBlocks = []; // Clear next word blocks too
    
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
    
    // Add the next word ahead
    this.addNextWord();
  }

  addNextWord() {
    // Get a random word for the next word
    const nextWord = this.getRandomWord();
    
    // Create blocks for each letter
    const blockWidth = 60;
    const blockSpacing = 20;
    const blockY = 300;
    
    // Store the starting position of this word
    const wordStartX = this.nextWordPosition;
    
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
      
      // Store reference to the block and its letter in the nextWordBlocks array
      this.nextWordBlocks.push({
        x: x,
        y: blockY,
        platform: platform,
        letterText: letterText,
        letter: nextWord[i]
      });
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

  getRandomWord() {
    // Get a random word from the current language's word list
    const wordList = this.wordLists[this.currentLanguage];
    
    // Check if the word list is empty
    if (!wordList || wordList.length === 0) {
      console.error(`Word list for ${this.currentLanguage} is empty!`);
      return this.currentLanguage === 'english' ? 'error' : 'klaida';
    }
    
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const word = wordList[randomIndex];
    
    // Ensure we have a valid word (not empty or undefined)
    if (!word || word.length === 0) {
      return this.currentLanguage === 'english' ? 'error' : 'klaida';
    }
    
    return word;
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

  // Switch language by reloading the page with a new URL parameter
  switchLanguageViaURL() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Get the new language (opposite of current)
      const newLang = this.currentLanguage === 'english' ? 'lithuanian' : 'english';
      
      // Create URL with the new language parameter
      const url = new URL(window.location.href);
      url.searchParams.set('lang', newLang);
      
      // Reload the page with the new URL
      window.location.href = url.toString();
    }
  }

  restartGame() {
    // Clear all existing platforms and letter blocks
    this.platforms.clear(true, true);
    this.letterBlocks.forEach(block => {
      if (block.letterText) block.letterText.destroy();
    });
    this.letterBlocks = [];
    this.nextWordBlocks = [];
    
    // Reset game state
    this.score = 0;
    this.timeLeft = 60;
    this.nextWordPosition = 100;
    this.currentLetterIndex = 0;
    
    // Update UI
    this.scoreText.setText('Score: 0');
    this.timerText.setText('Time: 60');
    
    // Recreate the starting cliff
    this.createStartingCliff();
    
    // Reset player position
    this.player.x = 50;
    this.player.y = 200;
    this.player.setVelocity(0, 0);
    
    // Add first word
    this.addNewWord();
    
    // Re-enable input
    this.input.keyboard.on('keydown', this.handleKeyDown, this);
  }
}

export default GameScene 