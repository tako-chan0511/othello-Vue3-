<!-- src/components/Board.vue -->
<template>
  <div class="board-container">
    <h2 class="title">Othello</h2>

    <div class="board">
      <div v-for="(row, y) in board" :key="y" class="board-row">
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="cell"
          @click="onClick(x, y)"
          :class="{ valid: isValid(x, y) }"
        >
          <div v-if="cell" :class="['disc', cell]" />
        </div>
      </div>
    </div>

    <div class="status">
      <span>手番: {{ turn }}</span>
    </div>

    <div class="controls">
      <button @click="undo" class="btn">一手戻る</button>
      <button @click="reset" class="btn">リセット</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useOthello } from "@/composables/useOthello";

const {
  board,
  turn,
  validMoves,
  play,
  cpuMove,
  isGameOver,
  score,
  init,
  undo,
} = useOthello();

// 合法手かどうか
function isValid(x: number, y: number) {
  return validMoves.value.some((m) => m.x === x && m.y === y);
}

// クリック処理：黒(プレイヤー)→CPU
async function onClick(x: number, y: number) {
  if (isGameOver.value) return;
  if (turn.value === "black" && play(x, y)) {
    // CPUの手
    setTimeout(() => cpuMove(), 300);
  }
}

// リセット
function reset() {
  init();
}
</script>

<style scoped>
.board-container {
  text-align: center;
  margin: 0 auto;
}
.title {
  margin-bottom: 12px;
}
.board {
  display: inline-block;
  border: 2px solid #333;
}
.board-row {
  display: flex;
}
.cell {
  width: 40px;
  height: 40px;
  background: #0a5;
  border: 1px solid #030;
  position: relative;
  cursor: pointer;
}
.cell.valid:hover {
  background: #0d7;
}
.disc {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  position: absolute;
  top: 4px;
  left: 4px;
}
.disc.black {
  background: #000;
}
.disc.white {
  background: #fff;
}

.status {
  margin: 12px 0;
  font-weight: bold;
}
.game-over {
  color: #c33;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 8px;
}
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: var(--primary-color);
  color: var(--bg-color);
  cursor: pointer;
}
.btn:hover {
  opacity: 0.8;
}
</style>
