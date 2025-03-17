<template>
  <div class="app">
    <h1>Speed Typing Game</h1>
    <p class="instructions">Type the words as they appear. Press 'R' to restart after game over.</p>
    <Game />
  </div>
</template>

<script setup>
import Game from './components/Game.vue'
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #1e1e2e;
  color: white;
}

.app {
  text-align: center;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

h1 {
  color: #4CAF50;
  margin-bottom: 10px;
}

.instructions {
  margin-bottom: 20px;
  color: #ccc;
}
</style> 