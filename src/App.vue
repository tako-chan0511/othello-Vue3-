<template>
  <div class="app">
    <h1>Vue3 オセロ</h1>

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
          :class="{ valid: isValid(x, y) }"
        >
          <span v-if="board[y][x] === 'black'" class="disc black"></span>
          <span v-else-if="board[y][x] === 'white'" class="disc white"></span>
        </div>
      </div>
    </div>

    <!-- 結果表示 -->
    <div v-if="gameOver" class="gameover">
      結果 → {{ resultMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';

type Color = 'black' | 'white' | null;

// --- state ---
const sizes = [4, 6, 8, 10, 12];
const boardSize = ref(8);
const board = ref<Color[][]>([]);
const history = ref<Color[][][]>([]);
const turn = ref<Color>('black');
const passCount = ref(0);

// --- helpers ---
const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function makeBoard(n: number): Color[][] {
  const b: Color[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => null)
  );
  const m = n / 2;
  b[m - 1][m - 1] = 'white';
  b[m][m]         = 'white';
  b[m - 1][m]     = 'black';
  b[m][m - 1]     = 'black';
  return b;
}

// --- game actions ---
function init(size = boardSize.value) {
  board.value = makeBoard(size);
  history.value = [ board.value.map(r => [...r]) ];
  turn.value = 'black';
  passCount.value = 0;
}

function inBounds(x: number, y: number) {
  return x >= 0 && x < board.value.length && y >= 0 && y < board.value.length;
}

function flips(x: number, y: number, col: Color): [number, number][] {
  if (board.value[y][x] !== null) return [];
  const opp = col === 'black' ? 'white' : 'black';
  const res: [number, number][] = [];
  for (const [dx, dy] of DIRS) {
    let cx = x + dx, cy = y + dy;
    const buf: [number, number][] = [];
    while (inBounds(cx, cy) && board.value[cy][cx] === opp) {
      buf.push([cx, cy]);
      cx += dx; cy += dy;
    }
    if (buf.length && inBounds(cx, cy) && board.value[cy][cx] === col) {
      res.push(...buf);
    }
  }
  return res;
}

function play(x: number, y: number): boolean {
  const f = flips(x, y, turn.value);
  if (!f.length) return false;
  board.value[y][x] = turn.value;
  f.forEach(([fx, fy]) => board.value[fy][fx] = turn.value);
  turn.value = turn.value === 'black' ? 'white' : 'black';
  passCount.value = 0;
  history.value.push(board.value.map(r => [...r]));
  return true;
}
// --- 一手だけ動かす ---
function cpuMoveOnce(): boolean {
  // 白の合法手リスト
  const moves = board.value.flatMap((row,y) =>
    row.map((_,x) => ({ x,y }))
  ).filter(p => flips(p.x,p.y,'white').length>0);

  if (!moves.length) {
    // 合法手なければ白パス
    pass();
    return false;
  }
  // 合法手ランダム配置
  const mv = moves[Math.floor(Math.random()*moves.length)];
  play(mv.x,mv.y);
  return true;
}
// --- 自動進行ループ ---
function autoAdvance() {
  // ゲーム終了なら何もしない
  if (gameOver.value) return;

  if (turn.value === 'white') {
    // 白番なら一手 CPU
    cpuMoveOnce();
    // 次の手番が何かに続ける
    autoAdvance();
  } else {
    // 黒番だが合法手がなければ自動パスして続行
    const blackMovesExist = board.value.flatMap((row,y) =>
      row.map((_,x) => ({x,y}))
    ).some(p => flips(p.x,p.y,'black').length>0);

    if (!blackMovesExist) {
      pass();
      autoAdvance();
    }
    // 合法手あればここで止まり、人間の操作待ちへ
  }
}

function cpuMove() {
  // turn が white の間だけ繰り返す
  const step = () => {
    if (turn.value !== 'white' || gameOver.value) return;
    if (cpuMoveOnce()) {
      // 一手打ったら次も白番か確認
      setTimeout(step, 300);
    }
    // パスの場合は turn が black に戻るので終了
  };
  step();
}

function pass() {
  passCount.value++;
  turn.value = turn.value === 'black' ? 'white' : 'black';
  history.value.push(board.value.map(r => [...r]));
}

function undo() {
  if (history.value.length <= 1) return;
  history.value.pop();
  board.value = history.value[history.value.length - 1].map(r => [...r]);
}

function reset() {
  init(boardSize.value);
}

// --- クリック処理 ---
// 黒(プレイヤー)の一手後に autoAdvance を一度だけ呼び出す
function onClick(x: number, y: number) {
  if (gameOver.value) return;
  if (turn.value === 'black' && play(x, y)) {
    setTimeout(autoAdvance, 300);
  }
}


function isValid(x: number, y: number) {
  return flips(x, y, turn.value).length > 0;
}

// --- new method 2 for game over: no moves for either color ---
function hasMovesFor(col: Color) {
  return board.value.some((row, y) =>
    row.some((_, x) => flips(x, y, col).length > 0)
  );
}

const gameOver = computed(() =>
  // neither black nor white has any legal moves
  !hasMovesFor('black') && !hasMovesFor('white')
);

const score = computed(() => {
  let b = 0, w = 0;
  board.value.forEach(r => r.forEach(c => { if (c === 'black') b++; else if (c === 'white') w++; }));
  return { black: b, white: w };
});

const resultMessage = computed(() => {
  const { black, white } = score.value;
  if (black > white) return '黒の勝ち！';
  if (black < white) return '白の勝ち！';
  return '引き分け！';
});

// --- reactive lifecycle ---
watch(boardSize, sz => init(sz), { immediate: true });

</script>

<style scoped>
.app { text-align: center; padding: 16px; }
.size-select { margin-bottom: 12px; }
.info { margin-bottom: 12px; }
.board { display: grid; grid-template-rows: repeat(auto-fill, 1fr); justify-content: center; }
.row { display: flex; }
.cell { background: #0a5; position: relative; width: 24px; height: 24px; border: 1px solid #333; cursor: pointer; }
.cell.valid { background: #afa; }
.disc { position: absolute; width: 20px; height: 20px; border-radius: 50%; top: 2px; left: 2px; }
.disc.black { background: #000; }
.disc.white { background: #fff; border: 1px solid #000; }
.gameover { margin-top: 16px; font-weight: bold; }
</style>
