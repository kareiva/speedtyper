<template>
  <div class="game-container">
    <div id="game-canvas"></div>
    <div v-if="loading" class="loading">Loading game assets...</div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import TypingGame from '../game/typing-game.js'

export default {
  name: 'Game',
  setup() {
    let game = null
    const loading = ref(true)

    onMounted(() => {
      // Short delay to ensure DOM is ready
      setTimeout(() => {
        game = new TypingGame('game-canvas')
        loading.value = false
      }, 500)
    })

    onUnmounted(() => {
      if (game) {
        game.destroy()
      }
    })

    return {
      loading
    }
  }
}
</script>

<style scoped>
.game-container {
  width: 800px;
  height: 600px;
  margin: 0 auto;
  border: 1px solid #ccc;
  position: relative;
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: #333;
}
</style> 