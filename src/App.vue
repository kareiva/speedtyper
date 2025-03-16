<template>
  <div class="app">
    <h1>Speed Typing Game</h1>
    <Game />
  </div>
</template>

<script>
import Game from './components/Game.vue'

export default {
  name: 'App',
  components: {
    Game
  }
}
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}
.app {
  text-align: center;
  padding: 20px;
}
</style> 