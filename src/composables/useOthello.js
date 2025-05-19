// src/composables/useOthello.ts
import { ref, computed } from 'vue';
const DIRS = [
    [-1, -1], [-1, 0], [-1, +1],
    [0, -1], [0, +1],
    [+1, -1], [+1, 0], [+1, +1],
];
let singleton = null;
function createOthello(size = 8) {
    const board = ref([]);
    const turn = ref('black');
    const passCount = ref(0);
    // 履歴スタック: 各スナップショットに board, turn, passCount を保持
    const history = [];
    function snapshot() {
        // 深いコピー
        const copy = board.value.map(row => [...row]);
        history.push({ board: copy, turn: turn.value, passCount: passCount.value });
    }
    function restore() {
        if (history.length < 2)
            return;
        // 現在の状態を捨て、ひとつ前に
        history.pop();
        const prev = history[history.length - 1];
        board.value = prev.board.map(row => [...row]);
        turn.value = prev.turn;
        passCount.value = prev.passCount;
    }
    function init() {
        // 初期盤面
        board.value = Array.from({ length: size }, () => Array.from({ length: size }, () => null));
        const m = size / 2;
        board.value[m - 1][m - 1] = 'white';
        board.value[m][m] = 'white';
        board.value[m - 1][m] = 'black';
        board.value[m][m - 1] = 'black';
        turn.value = 'black';
        passCount.value = 0;
        // 履歴初期化
        history.length = 0;
        snapshot();
    }
    function inBounds(x, y) {
        return x >= 0 && y >= 0 && x < size && y < size;
    }
    function flips(x, y, col) {
        if (board.value[y][x] !== null)
            return [];
        const opp = col === 'black' ? 'white' : 'black';
        const toFlip = [];
        for (let [dx, dy] of DIRS) {
            const buf = [];
            let cx = x + dx, cy = y + dy;
            while (inBounds(cx, cy) && board.value[cy][cx] === opp) {
                buf.push([cx, cy]);
                cx += dx;
                cy += dy;
            }
            if (buf.length > 0 && inBounds(cx, cy) && board.value[cy][cx] === col) {
                toFlip.push(...buf);
            }
        }
        return toFlip;
    }
    const validMoves = computed(() => board.value.flatMap((row, y) => row.map((_, x) => ({ x, y }))
        .filter(({ x, y }) => flips(x, y, turn.value).length > 0)));
    function play(x, y) {
        const f = flips(x, y, turn.value);
        if (!f.length)
            return false;
        snapshot();
        board.value[y][x] = turn.value;
        for (let [fx, fy] of f)
            board.value[fy][fx] = turn.value;
        turn.value = turn.value === 'black' ? 'white' : 'black';
        passCount.value = 0;
        return true;
    }
    function pass() {
        snapshot();
        passCount.value++;
        turn.value = turn.value === 'black' ? 'white' : 'black';
    }
    const isGameOver = computed(() => passCount.value >= 2 || validMoves.value.length === 0);
    function cpuMove() {
        const moves = validMoves.value;
        if (!moves.length) {
            pass();
            return;
        }
        const { x, y } = moves[Math.floor(Math.random() * moves.length)];
        play(x, y);
    }
    const score = computed(() => {
        let black = 0, white = 0;
        board.value.forEach(row => row.forEach(c => {
            if (c === 'black')
                black++;
            if (c === 'white')
                white++;
        }));
        return { black, white };
    });
    init();
    return { board, turn, validMoves, play, pass, undo: restore, isGameOver, cpuMove, score, init };
}
export function useOthello(size = 8) {
    if (!singleton) {
        singleton = createOthello(size);
    }
    return singleton;
}
//# sourceMappingURL=useOthello.js.map