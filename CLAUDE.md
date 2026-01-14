# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start Vite dev server (port 5173)
npm run build    # Production build to dist/
npm run serve    # Preview production build
npm start        # Dev server on port 8080
```

No linting or testing tools are configured.

## Architecture

This is a keyboard speed typing game built with **Vue 3** (Composition API) and **Phaser 3** (2D game engine).

### Core Structure

- `src/main.js` → Vue app entry point
- `src/App.vue` → Root component, renders title and Game component
- `src/components/Game.vue` → Phaser game container, handles game lifecycle and overlay UI
- `src/game/GameScene.js` → Core Phaser scene with all game logic (~750 lines)
- `src/game/typing-game.js` → Wrapper class for Phaser game instance management
- `src/game/GameLoader.js` → Asset and word list loading utility
- `src/game/BackgroundManager.js` → Procedural parallax background generation
- `public/assets/` → Sprites and word list text files

### Data Flow

1. **Game.vue** creates Phaser game instance with GameScene
2. **GameScene** loads assets, initializes state, handles keyboard input
3. Game emits `'gameOver'` event with score data
4. **Game.vue** listens for gameOver, shows overlay, handles restart via 'R' key

### Game Mechanics

- Player sprite jumps between letter platforms
- 60-second time limit
- Type correct letters to progress through words
- Score: 1 point per letter, 5 bonus per completed word
- Dynamic world expansion as player progresses
- Camera follows player with parallax scrolling

### Letter Block Structure

```javascript
{
  x: number,
  y: number,
  platform: Phaser.Physics.Sprite,
  letterText: Phaser.GameObjects.Text,
  letter: string  // character to match
}
```

### Language Support

Bilingual via URL parameter: `?lang=english` or `?lang=lithuanian`. Word lists loaded from `assets/english.txt` and `assets/lithuanian.txt`.

## Conventions

- Vue Composition API with `<script setup>` syntax
- Scoped CSS in Vue components
- PascalCase for classes, camelCase for functions
- Phaser static groups for physics platforms (`this.platforms`)
