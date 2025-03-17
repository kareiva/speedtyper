import Phaser from 'phaser'
import BackgroundManager from './BackgroundManager'
import GameLoader from './GameLoader'

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    // Game state
    this.currentWord = ''
    this.currentWordBlocks = []
    this.currentLetterIndex = 0
    this.isTransitioning = false // Flag to prevent word changes during transitions
    
    // Game objects
    this.player = null
    this.blockGroup = null
    this.ground = null
    
    // Game metrics
    this.score = 0
    this.timeLeft = 60
    this.highScore = 0
    this.completedWords = 0
    
    // World settings
    this.worldWidth = 2000
    this.currentWorldPosition = 0
    this.wordSpacing = 1000
    
    // Managers
    this.backgroundManager = null
    this.gameLoader = null
  }

  preload() {
    console.log('GameScene preload');
    // Load game assets
    this.load.image('player', 'assets/player.png');
    this.load.image('platform', 'assets/platform.png');
    
    // Load word list
    this.words = [
      'hello', 'world', 'javascript', 'phaser', 'game', 'development',
      'typing', 'speed', 'challenge', 'keyboard', 'player', 'score',
      'time', 'letter', 'word', 'block', 'jump', 'move', 'complete',
      'elephant', 'banana', 'computer', 'programming', 'algorithm'
    ];
    
    console.log('Assets loaded');
  }
  
  loadHighScore() {
    try {
      const savedHighScore = localStorage.getItem('typingGameHighScore')
      if (savedHighScore) {
        this.highScore = parseInt(savedHighScore)
      }
    } catch (e) {
      console.warn('Could not load high score from localStorage:', e)
    }
  }
  
  saveHighScore() {
    try {
      // Get current high score from local storage
      const highScore = localStorage.getItem('highScore') || 0;
      
      // Update high score if current score is higher
      if (this.score > highScore) {
        localStorage.setItem('highScore', this.score);
        console.log(`New high score: ${this.score}`);
      }
    } catch (error) {
      console.error('Error saving high score:', error);
    }
  }

  create() {
    console.log('GameScene create');
    // Initialize game variables
    this.score = 0;
    this.completedWords = 0;
    this.timeLeft = 60;
    this.currentWord = '';
    this.currentWordBlocks = [];
    this.currentLetterIndex = 0;
    this.isTransitioning = false;
    this.gameStarted = true;
    
    // Set up world bounds
    this.worldWidth = 2000;
    this.physics.world.setBounds(0, 0, this.worldWidth, 600);
    this.cameras.main.setBounds(0, 0, this.worldWidth, 600);
    
    // Create background
    this.createBackground();
    
    // Create the block group for physics
    this.blockGroup = this.physics.add.staticGroup();
    
    // Create the player
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(20);
    
    // Set up collision between player and blocks
    this.physics.add.collider(this.player, this.blockGroup);
    
    // Create UI elements
    this.createUI();
    
    // Set up keyboard input
    this.input.keyboard.on('keydown', this.handleKeyDown, this);
    
    // Set up camera to follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    
    // Set the first word
    this.setNewWord();
  }
  
  // Add a method to create the background
  createBackground() {
    // Create a gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0000ff, 0x0000ff, 0x000066, 0x000066, 1);
    bg.fillRect(0, 0, 2000, 600);
    bg.setDepth(0); // Ensure background is at the bottom
    
    // Add some decorative elements
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, 2000);
      const y = Phaser.Math.Between(0, 600);
      const size = Phaser.Math.Between(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff);
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      star.setDepth(1); // Stars just above the background
    }
  }
  
  // Add a method to create UI elements
  createUI() {
    // Create score text
    this.scoreText = this.add.text(20, 20, 'Score: 0', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#ffffff'
    }).setScrollFactor(0).setDepth(100);
    
    // Create timer text
    this.timerText = this.add.text(20, 50, 'Time: 60', {
      fontFamily: 'Arial',
      fontSize: '24px',
      fill: '#ffffff'
    }).setScrollFactor(0).setDepth(100);
    
    // Create word display
    this.wordText = this.add.text(16, 104, 'Word: ', { 
      fontSize: '32px', 
      fill: '#fff',
      fontFamily: 'Arial'
    });
    this.wordText.setScrollFactor(0); // Fix to camera
    this.wordText.setDepth(30);
  }
  
  updateTimerText() {
    this.timerText.setText(`Time: ${Math.ceil(this.timeLeft)}`);
  }
  
  updateScoreText() {
    this.scoreText.setText(`Score: ${this.score}`);
  }
  
  endGame() {
    // Stop handling input
    this.input.keyboard.removeAllListeners();
    
    // Display game over message
    const gameOverText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Game Over!', {
      fontFamily: 'Arial',
      fontSize: '48px',
      fill: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    
    const finalScoreText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 60, `Final Score: ${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '32px',
      fill: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    
    // Emit game over event
    this.events.emit('gameOver', { score: this.score, wordsCompleted: this.completedWords });
  }

  update(time, delta) {
    // Update the timer
    if (this.gameStarted && this.timeLeft > 0) {
      this.timeLeft -= delta / 1000;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.endGame();
      }
      this.updateTimerText();
    }
    
    // Continuously update camera position to follow player
    this.updateCameraPosition();
    
    // Check if player has fallen
    this.checkPlayerFall();
  }
  
  updateCameraPosition() {
    // Calculate how far the player is from the center of the camera view
    const cameraX = this.cameras.main.scrollX + (this.cameras.main.width / 2);
    const distanceFromCenter = this.player.x - cameraX;
    
    // If player is too far from center, pan the camera to follow
    if (Math.abs(distanceFromCenter) > 200) {
      this.cameras.main.pan(
        this.player.x,
        this.player.y,
        200,
        'Power1'
      );
    }
  }
  
  checkPlayerFall() {
    // Check if player has fallen off the blocks
    if (this.player.y > 500) {
      // Find the current or previous block to reset to
      let targetBlock;
      
      if (this.currentLetterIndex < this.currentWordBlocks.length) {
        // Use the current block if available
        targetBlock = this.currentWordBlocks[this.currentLetterIndex];
      } else if (this.currentLetterIndex > 0 && this.currentWordBlocks.length > 0) {
        // Otherwise use the last block
        targetBlock = this.currentWordBlocks[this.currentWordBlocks.length - 1];
      } else if (this.currentWordBlocks.length > 0) {
        // Fallback to the first block
        targetBlock = this.currentWordBlocks[0];
      }
      
      if (targetBlock) {
        // Reset player position and stop movement
        this.player.x = targetBlock.block.x;
        this.player.y = targetBlock.block.y - 40; // Position player on top of block
        this.player.setVelocity(0, 0);
        
        // Kill any existing tweens
        this.tweens.killTweensOf(this.player);
      }
    }
  }

  setNewWord() {
    console.log('Setting new word');
    
    // Stop any ongoing tweens for the player
    this.tweens.killTweensOf(this.player);
    
    // Clear previous blocks
    this.clearCurrentBlocks();
    
    // Reset current word blocks and letter index
    this.currentWordBlocks = [];
    this.currentLetterIndex = 0;
    
    // Get a random word
    this.currentWord = this.getRandomWord();
    console.log(`New word: ${this.currentWord}`);
    
    // Update the word display
    this.wordText.setText(`Word: ${this.currentWord}`);
    
    // Calculate starting position for the new word
    let startX = this.player ? this.player.x + 100 : 100;
    let startY = 300; // Always use the same Y position for consistency
    
    // Ensure the word fits within the world bounds
    const wordWidth = (this.currentWord.length + 1) * 80; // +1 for the starting block
    const worldWidth = this.physics.world.bounds.width;
    
    if (startX + wordWidth > worldWidth - 500) {
      // Extend the world if needed
      const newWorldWidth = startX + wordWidth + 1000;
      this.physics.world.setBounds(0, 0, newWorldWidth, 600);
      this.cameras.main.setBounds(0, 0, newWorldWidth, 600);
      
      // Create a new background extension
      this.extendBackground(worldWidth, newWorldWidth);
    }
    
    // Create blocks for each letter of the word
    this.createWordBlocks(startX, startY, this.currentWord, 0);
    
    // Position player at the first block without tweening
    if (this.player) {
      const firstBlock = this.currentWordBlocks[0];
      this.player.x = firstBlock.block.x;
      this.player.y = firstBlock.block.y - 40; // Position player on top of the block
      this.player.setVelocity(0, 0); // Ensure player doesn't fall
    }
    
    // Center camera on player
    this.cameras.main.pan(
      this.player.x,
      this.player.y,
      200,
      'Power1'
    );
  }
  
  // Add a dedicated method to extend the background
  extendBackground(startX, endX) {
    // Create a new background extension
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0000ff, 0x0000ff, 0x000066, 0x000066, 1);
    bg.fillRect(startX, 0, endX - startX, 600);
    bg.setDepth(0); // Ensure background is at the bottom
    
    // Add some decorative elements to the new area
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(startX, endX);
      const y = Phaser.Math.Between(0, 600);
      const size = Phaser.Math.Between(1, 3);
      const star = this.add.circle(x, y, size, 0xffffff);
      star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
      star.setDepth(1); // Stars just above the background
    }
  }
  
  // Add a method to clear current blocks
  clearCurrentBlocks() {
    // Remove all existing blocks and letters
    for (let i = 0; i < this.currentWordBlocks.length; i++) {
      const block = this.currentWordBlocks[i];
      if (block.block) {
        block.block.destroy();
      }
      if (block.text) {
        block.text.destroy();
      }
    }
    
    // Remove any space message
    if (this.spaceMessage) {
      this.spaceMessage.destroy();
      this.spaceMessage = null;
    }
  }
  
  createWordBlocks(startX, startY, word, wordIndex) {
    // Create blocks for each letter
    const blockWidth = 60;
    const blockSpacing = 20;
    
    // Store the index of the first block of this word
    const firstBlockIndex = this.currentWordBlocks.length;
    
    // Add an empty starting block before the word (for the player to start on)
    const emptyBlockX = startX - (blockWidth + blockSpacing);
    const emptyBlock = this.blockGroup.create(emptyBlockX, startY, 'platform');
    emptyBlock.setScale(0.5, 0.2).refreshBody();
    emptyBlock.setDepth(5); // Lower depth for blocks
    
    // Add a visual indicator for the starting block
    const startIndicator = this.add.text(emptyBlockX, startY - 20, '▶', { 
      fontSize: '32px', 
      fill: '#fff',
      backgroundColor: '#4CAF50',
      padding: { x: 5, y: 5 }
    });
    startIndicator.setOrigin(0.5);
    startIndicator.setDepth(10); // Higher depth for letters
    
    // Add the empty block to the blocks array
    this.currentWordBlocks.push({ 
      block: emptyBlock, 
      letter: startIndicator, 
      character: 'start',
      wordIndex: wordIndex,
      isStartBlock: true,
      letterIndex: -1 // Special index for start block
    });
    
    // Create blocks for each letter of the word
    for (let i = 0; i < word.length; i++) {
      const x = startX + i * (blockWidth + blockSpacing);
      const block = this.blockGroup.create(x, startY, 'platform');
      block.setScale(0.5, 0.2).refreshBody();
      block.setDepth(5); // Lower depth for blocks
      
      // Add letter on top of the block
      const letter = this.add.text(x, startY - 20, word[i], { 
        fontSize: '32px', 
        fill: '#fff',
        backgroundColor: '#000',
        padding: { x: 5, y: 5 }
      });
      letter.setOrigin(0.5);
      letter.setDepth(10); // Higher depth for letters
      
      this.currentWordBlocks.push({ 
        block, 
        letter, 
        character: word[i],
        wordIndex: wordIndex, // Track which word this block belongs to
        letterIndex: i // Track the position in the word
      });
    }
    
    // If this is not the first word, add a space block between words
    if (wordIndex > 0) {
      // Add a visual indicator for the space between words
      const spaceX = emptyBlockX - 80;
      const spaceIndicator = this.add.text(spaceX, startY - 60, '⎵', { 
        fontSize: '32px', 
        fill: '#fff',
        backgroundColor: '#4CAF50',
        padding: { x: 10, y: 5 }
      });
      spaceIndicator.setOrigin(0.5);
      spaceIndicator.setDepth(10); // Higher depth for indicators
      
      // Store the space indicator so we can reference it later
      this.currentWordBlocks[firstBlockIndex - 1].spaceIndicator = spaceIndicator;
    }
    
    // Increment the completed words counter (will be used for the next word)
    this.completedWords++;
  }
  
  positionPlayerAtFirstBlock() {
    if (this.currentWordBlocks.length > 0) {
      // Find the first block (which should be the empty starting block)
      const firstBlock = this.currentWordBlocks[0];
      
      // Immediately set player position without tweening
      this.player.x = firstBlock.block.x;
      this.player.y = firstBlock.block.y - 40; // Position player on top of block
      this.player.setVelocity(0, 0); // Reset velocity to prevent falling
      
      // Update current world position
      this.currentWorldPosition = firstBlock.block.x;
      
      // For the first word, center camera immediately
      if (this.completedWords <= 1) { // Changed from 0 to 1 since we incremented completedWords already
        this.cameras.main.centerOn(this.player.x, 300);
      } else {
        // For subsequent words, let the camera follow naturally
        // This prevents jarring camera movements when setting a new word
        const cameraX = this.cameras.main.scrollX + (this.cameras.main.width / 2);
        const distanceFromCenter = Math.abs(this.player.x - cameraX);
        
        // Only center camera if player is very far from view
        if (distanceFromCenter > 400) {
          // Move camera partially toward player, not fully centering
          const targetX = this.player.x - 200; // Position player in left portion of screen
          const newX = Phaser.Math.Linear(this.cameras.main.scrollX, targetX - (this.cameras.main.width / 2), 0.5);
          this.cameras.main.setScroll(newX, this.cameras.main.scrollY);
        }
      }
    }
  }

  handleKeyDown(event) {
    // Prevent handling if game is over or in transition
    if (this.timeLeft <= 0 || this.isTransitioning) return;
    
    const key = event.key.toLowerCase();
    
    // Regular letter handling
    if (this.currentLetterIndex < this.currentWordBlocks.length) {
      // Check if we're at the starting block
      if (this.currentLetterIndex === 0 && this.currentWordBlocks[0].isStartBlock) {
        // Get the first actual letter block
        const firstLetterBlock = this.currentWordBlocks[1];
        
        // If the key matches the first letter, skip the starting block and process the first letter
        if (firstLetterBlock && key === firstLetterBlock.character) {
          // Skip the starting block
          this.currentLetterIndex++;
          
          // Process the first letter
          this.currentLetterIndex++;
          this.highlightCompletedLetter(firstLetterBlock);
          this.movePlayerToNextBlock();
          this.checkWordCompletion();
          return;
        }
      }
      
      const currentBlock = this.currentWordBlocks[this.currentLetterIndex];
      
      // Skip the starting block (it's just a placeholder)
      if (currentBlock.isStartBlock) {
        this.currentLetterIndex++;
        this.movePlayerToNextBlock();
        return;
      }
      
      // For regular letter blocks, check if the key matches
      if (key === currentBlock.character) {
        // Move to the next letter
        this.currentLetterIndex++;
        
        // Highlight the completed letter
        this.highlightCompletedLetter(currentBlock);
        
        // Move player to the next block
        this.movePlayerToNextBlock();
        
        // Check if word is completed
        this.checkWordCompletion();
      }
    }
  }
  
  // Improve the movePlayerToNextBlock method to ensure camera follows properly
  movePlayerToNextBlock() {
    // If we're at the end of the blocks, don't try to move
    if (this.currentLetterIndex >= this.currentWordBlocks.length) {
      console.log('At the end of blocks, not moving player');
      return;
    }
    
    // Get the next block to move to
    const nextBlock = this.currentWordBlocks[this.currentLetterIndex];
    
    // Kill any existing tweens to prevent conflicts
    this.tweens.killTweensOf(this.player);
    
    // Animate the player moving to the next block - simpler animation
    this.tweens.add({
      targets: this.player,
      x: nextBlock.block.x,
      y: nextBlock.block.y - 40, // Position player on top of the block
      duration: 150,
      ease: 'Power1',
      onComplete: () => {
        // Make sure player stays on the block
        this.player.setVelocityY(0);
        
        // Ensure camera follows player
        this.updateCameraPosition();
      }
    });
  }
  
  // Simplify the checkWordCompletion method to make it more reliable
  checkWordCompletion() {
    // Simple check: if we've typed all letters in the word (plus the starting block)
    if (this.currentLetterIndex === this.currentWordBlocks.length) {
      // Word is completed
      
      // Update score
      this.score += this.currentWord.length;
      this.updateScoreText();
      
      // Generate a new word
      this.setNewWord();
    }
  }
  
  // Add a method to highlight completed letters
  highlightCompletedLetter(block) {
    // Change the letter's appearance to indicate it's been typed
    if (block.letter) {
      block.letter.setStyle({
        fontSize: '32px',
        fill: '#fff',
        backgroundColor: '#4CAF50', // Change to green
        padding: { x: 5, y: 5 }
      });
      
      // Ensure the depth is maintained
      block.letter.setDepth(10);
    }
  }

  // Add a method to get a random word
  getRandomWord() {
    if (!this.words || this.words.length === 0) {
      console.error('No words available');
      return 'error';
    }
    
    const randomIndex = Math.floor(Math.random() * this.words.length);
    return this.words[randomIndex];
  }

  // Add the init method to ensure the game is properly initialized
  init() {
    // Initialize game properties
    this.worldWidth = 2000;
    this.score = 0;
    this.timeLeft = 60;
    this.currentWord = '';
    this.currentWordBlocks = [];
    this.currentLetterIndex = 0;
    this.isTransitioning = false;
    this.gameOverElements = [];
    
    // Load high score
    try {
      this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
      console.log(`Loaded high score: ${this.highScore}`);
    } catch (error) {
      console.error('Error loading high score:', error);
      this.highScore = 0;
    }
  }

  restartGame() {
    // Reset game state
    this.score = 0;
    this.completedWords = 0;
    this.timeLeft = 60;
    this.gameStarted = true;
    
    // Clear any existing word blocks
    this.clearWordBlocks();
    
    // Reset player position
    this.positionPlayerAtFirstBlock();
    
    // Update UI
    this.updateScoreText();
    this.updateTimerText();
    
    // Set a new word
    this.setNewWord();
    
    // Re-enable keyboard input if it was disabled
    this.input.keyboard.removeAllListeners();
    this.input.keyboard.on('keydown', this.handleKeyDown, this);
    
    // Remove any game over text
    this.children.each(child => {
      if (child.type === 'Text' && 
          (child.text.includes('Game Over') || child.text.includes('Final Score'))) {
        child.destroy();
      }
    });
  }
  
  clearWordBlocks() {
    // Destroy all existing word blocks and letters
    if (this.currentWordBlocks && this.currentWordBlocks.length > 0) {
      this.currentWordBlocks.forEach(block => {
        if (block.letter) block.letter.destroy();
        if (block.block) block.block.destroy();
        if (block.spaceIndicator) block.spaceIndicator.destroy();
      });
    }
    this.currentWordBlocks = [];
    this.currentLetterIndex = 0;
  }
}

export default GameScene 