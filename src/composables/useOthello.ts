import { ref, computed } from 'vue';

export type Color = 'black' | 'white' | null;
export type Board = Color[][];

export function useOthello(initialSize = 8) {
  const sizeRef = ref(initialSize);
  const boardRef = ref<Board>([]);
  const turnRef = ref<Color>('black');
  const passCount = ref(0);
  const historyRef = ref<Board[]>([]);
  const turnHist = ref<Color[]>([]);

  const DIRS: [number, number][] = [
    [-1,-1],[-1,0],[-1,1],
    [ 0,-1],       [ 0,1],
    [ 1,-1],[ 1,0],[ 1,1],
  ];

  function makeBoard(n: number): Board {
    return Array.from({ length: n }, () => Array.from({ length: n }, () => null));
  }

  function pushHistory() {
    historyRef.value.push(boardRef.value.map(r => [...r]));
    turnHist.value.push(turnRef.value!);
  }

  function init(newSize = sizeRef.value) {
    sizeRef.value = newSize;
    boardRef.value = makeBoard(newSize);
    const m = newSize / 2;
    boardRef.value[m-1][m-1] = 'white';
    boardRef.value[m][m]     = 'white';
    boardRef.value[m-1][m]   = 'black';
    boardRef.value[m][m-1]   = 'black';
    turnRef.value = 'black';
    passCount.value = 0;
    historyRef.value = [];
    turnHist.value = [];
    pushHistory();
  }

  function inBounds(x: number, y: number) {
    return x >= 0 && x < sizeRef.value && y >= 0 && y < sizeRef.value;
  }

  function flips(x: number, y: number, col: Color): [number, number][] {
    if (boardRef.value[y][x] !== null) return [];
    const opp = col === 'black' ? 'white' : 'black';
    const res: [number, number][] = [];
    for (const [dx, dy] of DIRS) {
      let cx = x + dx, cy = y + dy;
      const buf: [number, number][] = [];
      while (inBounds(cx, cy) && boardRef.value[cy][cx] === opp) {
        buf.push([cx, cy]);
        cx += dx; cy += dy;
      }
      if (buf.length && inBounds(cx, cy) && boardRef.value[cy][cx] === col) {
        res.push(...buf);
      }
    }
    return res;
  }

  function play(x: number, y: number) {
    const f = flips(x, y, turnRef.value);
    if (!f.length) return false;
    boardRef.value[y][x] = turnRef.value;
    f.forEach(([fx, fy]) => boardRef.value[fy][fx] = turnRef.value);
    turnRef.value = turnRef.value === 'black' ? 'white' : 'black';
    passCount.value = 0;
    pushHistory();
    return true;
  }

  function pass() {
    passCount.value++;
    turnRef.value = turnRef.value === 'black' ? 'white' : 'black';
    pushHistory();
  }

  function undo() {
    if (historyRef.value.length <= 1) return;
    historyRef.value.pop();
    turnHist.value.pop();
    boardRef.value = historyRef.value[historyRef.value.length - 1].map(r => [...r]);
    turnRef.value = turnHist.value[turnHist.value.length - 1];
  }

  function cpuMove() {
    const mvs = boardRef.value.flatMap((row, y) =>
      row.map((_, x) => ({ x, y })).filter(p => flips(p.x, p.y, turnRef.value).length > 0)
    );
    if (!mvs.length) { pass(); return; }
    const mv = mvs[Math.floor(Math.random() * mvs.length)];
    play(mv.x, mv.y);
  }

  const validMoves = computed(() =>
    boardRef.value.flatMap((row, y) => row.map((_, x) => ({ x, y }))).filter(p => flips(p.x, p.y, turnRef.value).length > 0)
  );

  const isGameOver = computed(() =>
    passCount.value >= 2 || boardRef.value.flat().every(c => c !== null)
  );

  const score = computed(() => {
    let b = 0, w = 0;
    boardRef.value.forEach(r => r.forEach(c => { if (c === 'black') b++; else if (c === 'white') w++; }));
    return { black: b, white: w };
  });

  init(initialSize);

  return {
    size: computed(() => sizeRef.value),
    board: computed(() => boardRef.value),
    turn: computed(() => turnRef.value),
    history: computed(() => historyRef.value),
    validMoves,
    score,
    isGameOver,
    init,
    play,
    pass,
    undo,
    cpuMove,
  };
}