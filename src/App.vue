<template>
  <div class="app">
    <h1>Vue3 オセロ</h1>

    <!-- ===== ゲーム設定セクション ===== -->
    <div class="controls">
      <label><input type="radio" value="black" v-model="userColor" /> 先手（黒）</label>
      <label><input type="radio" value="white" v-model="userColor" /> 後手（白）</label>
      <!-- CPU 難易度選択 -->
      <label style="margin-left:1em;">
        難易度:
        <select v-model="difficulty">
          <option value="easy">簡単</option>
          <option value="normal">普通</option>
          <option value="hard">難しい</option>
        </select>
      </label>
      <button @click="showHints = !showHints" class="toggle">
        {{ showHints ? '候補を隠す' : '候補を表示' }}
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
      <button @click="undo" :disabled="history.length <= 2">一手戻る</button>
      <!-- 催促ボタン：PC番でないときは何もしない -->
      <button @click="doCpuTurn">パス</button>
      <button @click="reset">リセット</button>
    </div>

    <!-- ===== 盤面表示 ===== -->
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

    <!-- ===== 結果表示 ===== -->
    <div v-if="gameOver" class="gameover">結果 → {{ resultMessage }}</div>

    <!-- ===== 履歴表示トグル ===== -->
    <div class="history-toggle">
      <button @click="showHistory = !showHistory">
        {{ showHistory ? '履歴を隠す' : '履歴を表示' }}
      </button>
    </div>

    <!-- ===== 対戦履歴 ===== -->
    <section v-if="showHistory" class="history">
      <h2>対戦履歴</h2>
      <p>通算: 勝ち {{ wins }} 負け {{ losses }} 引き分け {{ draws }}</p>
      <table class="history-table">
        <thead>
          <tr>
            <th>盤サイズ</th>
            <th>手番</th>
            <th>難易度</th>
            <th>勝敗</th>
            <th>スコア</th>
            <th>日時</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in matches" :key="i">
            <td>{{ m.size }}×{{ m.size }}</td>
            <td>{{ m.player === 'black' ? '黒' : '白' }}</td>
            <td>{{ m.difficulty === 'easy' ? '簡単' : m.difficulty === 'normal' ? '普通' : '難しい' }}</td>
            <td>{{ m.resultSymbol }}</td>
            <td>黒:{{ m.score.black }} 白:{{ m.score.white }}</td>
            <td>{{ m.date }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";

type Color = "black" | "white" | null;

// --- state ---
const sizes = [4, 6, 8, 10, 12, 24];
const boardSize = ref(8);
const board = ref<Color[][]>([]);
const history = ref<Color[][][]>([]);
const turn = ref<Color>("black");
const passCount = ref(0);

// ユーザー色／CPU色
const userColor = ref<Color>("black");
const compColor = computed<Color>(() =>
  userColor.value === "black" ? "white" : "black"
);

// 難易度
const difficulty = ref<"easy" | "normal" | "hard">("normal");

// 候補手表示フラグ
const showHints = ref(true);
// 履歴表示トグル
const showHistory = ref(false);

// 対戦履歴管理
interface Match {
  date: string;
  size: number;
  player: Color;
  difficulty: "easy" | "normal" | "hard";
  result: "win" | "loss" | "draw";
  resultSymbol: "○" | "●" | "□";
  score: { black: number; white: number };
}
const matches = ref<Match[]>([]);
const storageKey = "othelloMatches";
// 永続化ロード
const saved = localStorage.getItem(storageKey);
if (saved) {
  try { matches.value = JSON.parse(saved); } catch {}
}

// 通算成績
const wins   = computed(() => matches.value.filter(m => m.result === "win").length);
const losses = computed(() => matches.value.filter(m => m.result === "loss").length);
const draws  = computed(() => matches.value.filter(m => m.result === "draw").length);

// --- helpers ---
const DIRS: [number, number][] = [
  [-1,-1],[-1,0],[-1,1],
  [ 0,-1],        [0,1],
  [ 1,-1],[1,0], [1,1],
];

function makeBoard(n: number): Color[][] {
  const b: Color[][] = Array.from({ length: n }, () =>
    Array.from({ length: n }, () => null)
  );
  const m = n / 2;
  b[m-1][m-1] = "white";
  b[m][m]     = "white";
  b[m-1][m]   = "black";
  b[m][m-1]   = "black";
  return b;
}

function inBounds(x: number, y: number) {
  return x >= 0 && y >= 0 && x < board.value.length && y < board.value.length;
}

function flips(x: number, y: number, col: Color): [number, number][] {
  if (board.value[y][x] != null) return [];
  const opp = col === "black" ? "white" : "black";
  const res: [number, number][] = [];
  for (const [dx, dy] of DIRS) {
    let cx = x + dx, cy = y + dy, buf: [number, number][] = [];
    while (inBounds(cx, cy) && board.value[cy][cx] === opp) {
      buf.push([cx, cy]); cx += dx; cy += dy;
    }
    if (buf.length && inBounds(cx, cy) && board.value[cy][cx] === col) {
      res.push(...buf);
    }
  }
  return res;
}

// --- CPU の手選択ロジック ---
function selectCpuMove(col: Color) {
  const cands = board.value
    .flatMap((r, y) => r.map((_, x) => ({ x, y })))
    .filter(p => flips(p.x, p.y, col).length > 0);
  if (!cands.length) return null;
  if (difficulty.value === "easy") {
    return cands[Math.floor(Math.random() * cands.length)];
  }
  // normal: 最大返転数
  let best = cands[0], bestCnt = -1;
  for (const p of cands) {
    const cnt = flips(p.x, p.y, col).length;
    if (cnt > bestCnt) { bestCnt = cnt; best = p; }
  }
  if (difficulty.value === "normal") return best;
  // hard: 1手先ミニマックス
  let top = best, topScore = -Infinity;
  for (const p of cands) {
    const snap = board.value.map(r => [...r]);
    board.value[p.y][p.x] = col;
    flips(p.x, p.y, col).forEach(([fx, fy]) => board.value[fy][fx] = col);
    const opp = col === "black" ? "white" : "black";
    const oppScores = board.value
      .flatMap((r2, y2) => r2.map((_, x2) => ({ x: x2, y: y2 })))
      .filter(q => flips(q.x, q.y, opp).length > 0)
      .map(q => flips(q.x, q.y, opp).length);
    const worst = oppScores.length ? Math.max(...oppScores) : 0;
    const score = flips(p.x, p.y, col).length - worst;
    board.value = snap;
    if (score > topScore) { topScore = score; top = p; }
  }
  return top;
}

// --- CPU の手選択ロジック ---
// col が何色であっても強制的にその色で play() を呼び出すようにします
function cpuMoveOnceFor(col: Color): boolean {
  const moves = board.value
    .flatMap((row, y) => row.map((_, x) => ({ x, y })))
    .filter(p => flips(p.x, p.y, col).length > 0);
  if (!moves.length) {
    pass();
    return false;
  }
  const mv = moves[Math.floor(Math.random() * moves.length)];
  // turn を一時的に上書きして play() を使う
  turn.value = col;
  play(mv.x, mv.y);
  // play() の中で turn が裏返るので、ここでは戻さなくて OK
  return true;
}

// ─── CPU／ユーザー ターン移行を同期的に処理する関数 ───
// PC番で呼ばれたら、まず１手だけ打つ、合法手がなければパスする
// ─── 催促ボタンでも必ずPCに“一手だけ”打たせる ───
function doCpuTurn() {
  if (gameOver.value) return;

  // 合法手があれば一手打つ、なければパス
  if (hasMovesFor(compColor.value)) {
    cpuMoveOnceFor(compColor.value);
  } else {
    pass();
  }
}

// --- actions ---
function play(x: number, y: number): boolean {
  const f = flips(x, y, turn.value);
  if (!f.length) return false;
  board.value[y][x] = turn.value;
  f.forEach(([fx, fy]) => board.value[fy][fx] = turn.value);
  turn.value = turn.value === "black" ? "white" : "black";
  passCount.value = 0;
  history.value.push(board.value.map(r => [...r]));
  return true;
}

function pass() {
  passCount.value++;
  turn.value = turn.value === "black" ? "white" : "black";
  history.value.push(board.value.map(r => [...r]));
}

function onClick(x: number, y: number) {
  if (gameOver.value || turn.value !== userColor.value) return;
  if (!play(x, y)) return;
  // play 内で doCpuTurn を呼ぶので、ここでは不要ですが
  // 万一のタイミング逃しに備え再呼び出し
  doCpuTurn();
}

function undo() {
  if (history.value.length <= 2) return;
  history.value.pop(); history.value.pop();
  board.value = history.value[history.value.length - 1].map(r => [...r]);
  turn.value = userColor.value;
}

function reset() {
  init(boardSize.value);
}

function isValid(x: number, y: number) {
  return flips(x, y, turn.value).length > 0;
}

function hasMovesFor(col: Color) {
  return board.value.some((row, y) =>
    row.some((_, x) => flips(x, y, col).length > 0)
  );
}

const gameOver     = computed(() => !hasMovesFor("black") && !hasMovesFor("white"));
const score        = computed(() => {
  let b = 0, w = 0;
  board.value.forEach(r => r.forEach(c => {
    if (c === "black") b++; else if (c === "white") w++;
  }));
  return { black: b, white: w };
});
const resultMessage= computed(() => {
  const { black, white } = score.value;
  if (black > white) return "黒の勝ち！";
  if (black < white) return "白の勝ち！";
  return "引き分け！";
});

// --- 履歴追加＆永続化 ---
watch(gameOver, (ended, was) => {
  if (ended && !was) {
    const res: "win"|"loss"|"draw" =
      score.value.black === score.value.white ? "draw" :
      score.value.black > score.value.white
        ? userColor.value==="black" ? "win":"loss"
        : userColor.value==="white" ? "win":"loss";
    const sym = res==="win"?"○":res==="loss"?"●":"□";
    matches.value.unshift({
      date: new Date().toLocaleString(),
      size: boardSize.value,
      player: userColor.value,
      difficulty: difficulty.value,
      result: res,
      resultSymbol: sym,
      score: {...score.value}
    });
    localStorage.setItem(storageKey, JSON.stringify(matches.value));
  }
});

// --- 初期化 & ウォッチャー ---
function init(size = boardSize.value) {
  console.log("init: userColor=", userColor.value);
  board.value = makeBoard(size);
  history.value = [board.value.map(r => [...r])];
  turn.value = "black";
  passCount.value = 0;
  if (userColor.value === "white") {
    console.log("init calls doCpuTurn()");
    doCpuTurn();
  }
}
watch(boardSize, sz => init(sz),           { immediate: true });
watch(userColor, () => init(boardSize.value), { immediate: true });
</script>

<style scoped>
.history-toggle { margin:16px 0; text-align:center }
.history { margin-bottom:16px; text-align:left }
.history-table { width:100%; border-collapse:collapse }
.history-table th,
.history-table td { border:1px solid #ccc; padding:4px; text-align:center }
.history-table th { background:#f5f5f5 }

/* 既存スタイル */
.app { text-align:center; padding:16px }
.controls { margin-bottom:12px }
.controls label { margin-right:8px }
.toggle { margin-left:16px }
.size-select { margin-bottom:12px }
.info { margin-bottom:12px }
.board { display:grid; grid-template-rows:repeat(auto-fill,1fr); justify-content:center }
.row { display:flex }
.cell { background:#0a5; position:relative; width:24px; height:24px; border:1px solid #333; cursor:pointer }
.cell.valid { background:#afa }
.disc { position:absolute; width:20px; height:20px; border-radius:50%; top:2px; left:2px }
.disc.black { background:#000 }
.disc.white { background:#fff; border:1px solid #000 }
.gameover { margin-top:16px; font-weight:bold }
</style>
