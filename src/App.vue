<template>
  <div class="app">
    <h1>Vue3 オセロ</h1>

    <!-- 先手／後手選択 ＋ 候補表示トグル -->
    <div class="controls">
      <label>
        <input type="radio" value="black" v-model="userColor" /> 先手（黒）
      </label>
      <label>
        <input type="radio" value="white" v-model="userColor" /> 後手（白）
      </label>
      <button @click="showHints = !showHints" class="toggle">
        {{ showHints ? "候補を隠す" : "候補を表示" }}
      </button>
    </div>

    <!-- サイズ選択 -->
    <div class="size-select">
      <label>盤面サイズ:</label>
      <select v-model.number="boardSize">
        <option v-for="n in sizes" :key="n" :value="n">{{ n }}×{{ n }}</option>
      </select>
    </div>

    <!-- 情報＋操作 -->
    <div class="info">
      <span>手番: {{ turn }}</span>
      <span>黒: {{ score.black }} 白: {{ score.white }}</span>
      <button @click="undo" :disabled="history.length <= 1">一手戻る</button>
      <button @click="reset">リセット</button>
    </div>

    <!-- 盤面 -->
    <div class="board">
      <div v-for="(row, y) in board" :key="y" class="row">
        <div
          v-for="(_, x) in row"
          :key="x"
          class="cell"
          @click="onClick(x, y)"
          :class="{ valid: showHints && isValid(x, y) }"
        >
          <span v-if="board[y][x] === 'black'" class="disc black"></span>
          <span v-else-if="board[y][x] === 'white'" class="disc white"></span>
        </div>
      </div>
    </div>

    <!-- 結果表示 -->
    <div v-if="gameOver" class="gameover">結果 → {{ resultMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

type Color = "black" | "white" | null;

// --- state ---
const sizes = [4, 6, 8, 10, 12];
const boardSize = ref(8);
const board = ref<Color[][]>([]);
const history = ref<Color[][][]>([]);
const turn = ref<Color>("black");
const passCount = ref(0);

// ユーザーが先手か後手か
const userColor = ref<Color>("black");
// コンピュータは反対色
const compColor = computed<Color>(() =>
  userColor.value === "black" ? "white" : "black"
);
// 候補表示フラグ
const showHints = ref(true);

// --- helpers ---
const DIRS: [number, number][] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

function makeBoard(n: number): Color[][] {
  const b: Color[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => null)
  );
  const m = n / 2;
  b[m - 1][m - 1] = "white";
  b[m][m] = "white";
  b[m - 1][m] = "black";
  b[m][m - 1] = "black";
  return b;
}

function inBounds(x: number, y: number) {
  return x >= 0 && y >= 0 && x < board.value.length && y < board.value.length;
}

function flips(x: number, y: number, col: Color): [number, number][] {
  if (board.value[y][x] !== null) return [];
  const opp = col === "black" ? "white" : "black";
  const res: [number, number][] = [];
  for (const [dx, dy] of DIRS) {
    let cx = x + dx,
      cy = y + dy;
    const buf: [number, number][] = [];
    while (inBounds(cx, cy) && board.value[cy][cx] === opp) {
      buf.push([cx, cy]);
      cx += dx;
      cy += dy;
    }
    if (buf.length && inBounds(cx, cy) && board.value[cy][cx] === col) {
      res.push(...buf);
    }
  }
  return res;
}

// --- actions ---
function play(x: number, y: number): boolean {
  const f = flips(x, y, turn.value);
  if (!f.length) return false;
  board.value[y][x] = turn.value;
  f.forEach(([fx, fy]) => (board.value[fy][fx] = turn.value));
  turn.value = turn.value === "black" ? "white" : "black";
  passCount.value = 0;
  history.value.push(board.value.map((r) => [...r]));
  return true;
}

function pass() {
  passCount.value++;
  turn.value = turn.value === "black" ? "white" : "black";
  history.value.push(board.value.map((r) => [...r]));
}

function undo() {
  // 履歴が 2 手以上ある場合にのみ二手戻す
  if (history.value.length <= 2) return;
  // 2 手分 pop
  history.value.pop();
  history.value.pop();
  // ボードを直前状態に戻す
  board.value = history.value[history.value.length - 1].map((r) => [...r]);
  // ターンをプレイヤー（userColor）に戻す
  turn.value = userColor.value;
}

function reset() {
  init(boardSize.value);
}

// --- CPU move once for any color ---
function cpuMoveOnceFor(col: Color): boolean {
  const moves = board.value
    .flatMap((row, y) => row.map((_, x) => ({ x, y })))
    .filter((p) => flips(p.x, p.y, col).length > 0);

  if (!moves.length) {
    pass();
    return false;
  }
  const mv = moves[Math.floor(Math.random() * moves.length)];
  play(mv.x, mv.y);
  return true;
}

// --- user click ---
function onClick(x: number, y: number) {
  if (gameOver.value || turn.value !== userColor.value) return;
  if (play(x, y)) {
    // turn now equals compColor, watch(turn) will trigger CPU move
  }
}

function isValid(x: number, y: number) {
  return flips(x, y, turn.value).length > 0;
}

function hasMovesFor(col: Color) {
  return board.value.some((row, y) =>
    row.some((_, x) => flips(x, y, col).length > 0)
  );
}

const gameOver = computed(() => !hasMovesFor("black") && !hasMovesFor("white"));

const score = computed(() => {
  let b = 0,
    w = 0;
  board.value.forEach((r) =>
    r.forEach((c) => {
      if (c === "black") b++;
      else if (c === "white") w++;
    })
  );
  return { black: b, white: w };
});

const resultMessage = computed(() => {
  const { black, white } = score.value;
  if (black > white) return "黒の勝ち！";
  if (black < white) return "白の勝ち！";
  return "引き分け！";
});

// --- observe turn change for CPU ---
watch(
  turn,
  (t) => {
    if (t === compColor.value && !gameOver.value) {
      setTimeout(() => {
        cpuMoveOnceFor(compColor.value);
      }, 300);
    }
  },
  { immediate: true }
);

// --- initialization & watchers ---
function init(size = boardSize.value) {
  board.value = makeBoard(size);
  history.value = [board.value.map((r) => [...r])];
  turn.value = "black";
  passCount.value = 0;
  // userColor が後手(white)なら、ここで黒(PC)を打たせる
  if (userColor.value === "white") {
    setTimeout(() => {
      cpuMoveOnceFor("black");
    }, 300);
  }
}

watch(boardSize, (sz) => init(sz), { immediate: true });
watch(userColor, () => init(boardSize.value), { immediate: true });
</script>

<style scoped>
.app {
  text-align: center;
  padding: 16px;
}
.controls {
  margin-bottom: 12px;
}
.controls label {
  margin-right: 8px;
}
.toggle {
  margin-left: 16px;
}
.size-select {
  margin-bottom: 12px;
}
.info {
  margin-bottom: 12px;
}
.board {
  display: grid;
  grid-template-rows: repeat(auto-fill, 1fr);
  justify-content: center;
}
.row {
  display: flex;
}
.cell {
  background: #0a5;
  position: relative;
  width: 24px;
  height: 24px;
  border: 1px solid #333;
  cursor: pointer;
}
.cell.valid {
  background: #afa;
}
.disc {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  top: 2px;
  left: 2px;
}
.disc.black {
  background: #000;
}
.disc.white {
  background: #fff;
  border: 1px solid #000;
}
.gameover {
  margin-top: 16px;
  font-weight: bold;
}
</style>
