<template>
  <div class="board-container">
    <div class="board">
      <div v-for="(row, y) in game.board" :key="y" class="board-row">
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="cell"
          @click="onClick(x, y)"
          :class="{ valid: isValid(x, y) }"
        >
          <span v-if="cell" :class="['disc', cell]"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Othello } from '@/composables/useOthello';
import { defineProps } from 'vue';

const props = defineProps<{ game: ReturnType<typeof useOthello> }>();
const game = props.game;

function isValid(x: number, y: number) {
  return game.validMoves.some(m => m.x === x && m.y === y);
}

function onClick(x: number, y: number) {
  if (game.isGameOver) return;
  if (game.turn === 'black' && game.play(x, y)) {
    setTimeout(() => game.cpuMove(), 300);
  }
}
</script>

<style scoped>
.board-container { text-align: center; }
.board { display: inline-block; border: 2px solid #333; }
.board-row { display: flex; }
.cell {
  width: 40px; height: 40px;
  background: #0a5;
  border: 1px solid #030;
  position: relative;
  cursor: pointer;
}
.cell.valid:hover { background: #0d7; }
.disc {
  width: 32px; height: 32px;
  border-radius: 50%;
  position: absolute; top: 4px; left: 4px;
}
.disc.black { background: #000; }
.disc.white { background: #fff; }
</style>