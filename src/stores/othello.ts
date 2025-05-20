import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

type Color = 'black' | 'white' | null;
type Board = Color[][];

const DIRS: [number, number][] = [
  [-1,-1],[-1,0],[-1,1],
  [ 0,-1],       [ 0,1],
  [ 1,-1],[ 1,0],[ 1,1],
];

export const useOthelloStore = defineStore('othello', () => {
  const size = ref(8);
  const board = ref<Board>([]);
  const turn = ref<Color>('black');
  const history = ref<Board[]>([]);
  const passCount = ref(0);

  function makeBoard(n: number) {
    return Array.from({ length: n }, () => Array.from({ length: n }, () => null));
  }

  function pushHistory() {
    history.value.push(board.value.map(r => [...r]));
  }

  function init(n = size.value) {
    size.value = n;
    board.value = makeBoard(n);
    const m = n / 2;
    board.value[m-1][m-1] = 'white';
    board.value[m][m]     = 'white';
    board.value[m-1][m]   = 'black';
    board.value[m][m-1]   = 'black';
    turn.value = 'black';
    passCount.value = 0;
    history.value = [];
    pushHistory();
  }

  function inBounds(x: number, y: number) {
    return x >= 0 && x < size.value && y >= 0 && y < size.value;
  }
  function flips(x: number, y: number, c: Color) {
    if (board.value[y][x] !== null) return [];
    const opp = c === 'black' ? 'white' : 'black';
    let res: [number,number][] = [];
    for (const [dx,dy] of DIRS) {
      let cx = x+dx, cy = y+dy;
      const buf: [number,number][] = [];
      while (inBounds(cx,cy) && board.value[cy][cx] === opp) {
        buf.push([cx,cy]); cx+=dx; cy+=dy;
      }
      if (buf.length && inBounds(cx,cy) && board.value[cy][cx]===c) res.push(...buf);
    }
    return res;
  }

  function play(x: number, y: number) {
    const f = flips(x,y, turn.value);
    if (!f.length) return false;
    board.value[y][x] = turn.value;
    f.forEach(([fx,fy]) => board.value[fy][fx] = turn.value);
    turn.value = turn.value === 'black' ? 'white' : 'black';
    passCount.value = 0;
    pushHistory();
    return true;
  }

  function undo() {
    if (history.value.length <= 1) return;
    history.value.pop();
    board.value = history.value[history.value.length-1].map(r => [...r]);
    // turn も履歴管理したい場合は turnHistory を追加してください
  }

  const validMoves = computed(() =>
    board.value.flatMap((row,y) => row.map((_,x)=>({x,y}))).filter(p => flips(p.x,p.y,turn.value).length>0)
  );
  const score = computed(() => {
    let b=0,w=0;
    board.value.forEach(r=>r.forEach(c=>c==='black'?b++:c==='white'?w++:0));
    return { black:b, white:w };
  });
  const isGameOver = computed(() => passCount.value>=2 || validMoves.value.length===0);

  // 初期化
  init();

  return {
    size,
    board,
    turn,
    history,
    validMoves,
    score,
    isGameOver,
    init,
    play,
    undo,
  };
});