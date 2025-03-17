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

// Function to restart the game
function restartGame() {
  if (game.value && game.value.scene.scenes[0]) {
    gameOver.value = false;
    game.value.scene.scenes[0].restartGame();
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
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      scene: [GameScene]
    };
    
    game.value = new Phaser.Game(config);
    
    // Listen for game over event
    game.value.scene.scenes[0].events.on('gameOver', (data) => {
      score.value = data.score;
      gameOver.value = true;
      createKeydownHandler();
    });
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
  position: relative;
  width: 800px;
  height: 600px;
  margin: 0 auto;
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