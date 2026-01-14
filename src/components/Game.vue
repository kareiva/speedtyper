<template>
  <div class="game-container">
    <div ref="gameContainer" class="phaser-container"></div>
    
    <div v-if="gameOver" class="game-over-overlay">
      <div class="game-over-content">
        <h2>Game Over!</h2>
        <p>Your score: {{ score }}</p>
        <button @click="restartGame" class="restart-button">Play Again</button>
        <p class="restart-hint">Press 'R' to restart</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import GameScene from '../game/GameScene';
import Phaser from 'phaser';

const gameContainer = ref(null);
const game = ref(null);
const score = ref(0);
const gameOver = ref(false);
let keydownHandler = null;

// Function to create a keydown handler
function createKeydownHandler() {
  // Remove any existing handler first
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
  }
  
  // Create a new handler
  keydownHandler = (event) => {
    if (event.key.toLowerCase() === 'r' && gameOver.value) {
      restartGame();
    }
  };
  
  // Add the new handler
  window.addEventListener('keydown', keydownHandler);
}

// Function to safely get the game scene
function getGameScene() {
  if (!game.value) return null;
  
  try {
    // Make sure the scene manager and scenes array exist
    if (game.value.scene && Array.isArray(game.value.scene.scenes) && game.value.scene.scenes.length > 0) {
      return game.value.scene.scenes[0];
    }
  } catch (error) {
    console.error('Error accessing game scene:', error);
  }
  
  return null;
}

// Function to restart the game
function restartGame() {
  const gameScene = getGameScene();
  if (gameScene) {
    gameOver.value = false;
    gameScene.restartGame();
  } else {
    console.warn('Game scene not ready for restart');
  }
}

onMounted(() => {
  // Initialize the game
  if (gameContainer.value) {
    console.log('Initializing Phaser game');
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainer.value,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      scene: [GameScene]
    };
    
    try {
      game.value = new Phaser.Game(config);
      
      // Wait for the scene to be created and ready
      const setupGameEvents = () => {
        const gameScene = getGameScene();
        if (gameScene) {
          // Listen for game over event
          gameScene.events.on('gameOver', (data) => {
            score.value = data.score;
            gameOver.value = true;
            createKeydownHandler();
          });
          
          // Set up the keydown handler after the game is initialized
          createKeydownHandler();
        } else {
          // If scene isn't ready yet, try again in a short while
          setTimeout(setupGameEvents, 100);
        }
      };
      
      // Start the setup process
      setupGameEvents();
    } catch (error) {
      console.error('Error initializing Phaser game:', error);
    }
  } else {
    console.error('Game container not found');
  }
});

onUnmounted(() => {
  // Clean up event listeners
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
  }
  
  // Destroy the game instance
  if (game.value) {
    game.value.destroy(true);
    game.value = null;
  }
});
</script>

<style scoped>
.game-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000;
}

.phaser-container {
  width: 100%;
  height: 100%;
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.game-over-content {
  background-color: #2c3e50;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  color: white;
}

.restart-button {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.restart-button:hover {
  background-color: #45a049;
}

.restart-hint {
  margin-top: 1rem;
  font-size: 14px;
  color: #ccc;
}
</style> 