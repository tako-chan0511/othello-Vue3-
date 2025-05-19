<template>
  <div class="app">
    <h1>Vue3 オセロ（CPU戦モード）</h1>
    <!-- リアルタイム情報表示 -->
    <div class="info">
      <span>手番: {{ turn }}</span>
      <span>黒: {{ score.black }} 白: {{ score.white }}</span>
      <button class="restart" @click="init">リセット</button>
    </div>

    <Board />

    <!-- ゲーム終了時のみ表示 -->
    <div v-if="isGameOver" class="gameover">
      <p>ゲーム終了！ 最終スコア → 黒: {{ score.black }} / 白: {{ score.white }}</p>
      <p class="winner">
        {{ score.black > score.white
            ? '黒の勝ち！'
            : score.white > score.black
              ? '白の勝ち！'
              : '引き分け！' }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import Board from '@/components/Board.vue'
import { useOthello } from '@/composables/useOthello'

const { turn, score, isGameOver, init } = useOthello()
</script>

<style>
.app {
  text-align: center;
  padding: 20px;
}
.info {
  margin-bottom: 12px;
  display: flex;
  justify-content: center;
  gap: 16px;
  align-items: center;
}
.info span {
  font-weight: bold;
}
.restart {
  padding: 4px 12px;
  background: var(--primary-color);
  color: var(--bg-color);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.gameover {
  margin-top: 16px;
  font-weight: bold;
}
.winner {
  margin-top: 8px;
  color: #c33;
}
</style>
