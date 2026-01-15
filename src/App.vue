<template>
  <Game />
</template>

<script setup>
import Game from './components/Game.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #000;
  position: fixed;
  touch-action: none;
}

#app {
  width: 100%;
  height: 100%;
}
</style> 