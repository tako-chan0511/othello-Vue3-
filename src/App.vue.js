import { ref, watch, computed } from "vue";
// --- state ---
const sizes = [4, 6, 8, 10, 12, 24];
const boardSize = ref(8);
const board = ref([]);
const history = ref([]);
const turn = ref("black");
const passCount = ref(0);
// ユーザー色／CPU色
const userColor = ref("black");
const compColor = computed(() => userColor.value === "black" ? "white" : "black");
// 候補手表示フラグ
const showHints = ref(true);
// 履歴表示トグル
const showHistory = ref(false);
const matches = ref([]);
const storageKey = "othelloMatches";
// 永続化ロード
const saved = localStorage.getItem(storageKey);
if (saved) {
    try {
        matches.value = JSON.parse(saved);
    }
    catch { }
}
// 通算成績
const wins = computed(() => matches.value.filter(m => m.result === "win").length);
const losses = computed(() => matches.value.filter(m => m.result === "loss").length);
const draws = computed(() => matches.value.filter(m => m.result === "draw").length);
// --- helpers ---
const DIRS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1],
];
// 盤面を初期配置で生成
function makeBoard(n) {
    // b を Color[][] と明示的に注釈することで
    // `"black" | "white" | null` を要素に持てるようにします。
    const b = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
    const m = n / 2;
    b[m - 1][m - 1] = "white";
    b[m][m] = "white";
    b[m - 1][m] = "black";
    b[m][m - 1] = "black";
    return b;
}
function inBounds(x, y) {
    return x >= 0 && y >= 0 && x < board.value.length && y < board.value.length;
}
function flips(x, y, col) {
    if (board.value[y][x] != null)
        return [];
    const opp = col === "black" ? "white" : "black";
    const res = [];
    for (let [dx, dy] of DIRS) {
        let cx = x + dx, cy = y + dy, buf = [];
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
function play(x, y) {
    const f = flips(x, y, turn.value);
    if (!f.length)
        return false;
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
function undo() {
    if (history.value.length <= 2)
        return;
    history.value.pop();
    history.value.pop();
    board.value = history.value[history.value.length - 1].map(r => [...r]);
    turn.value = userColor.value;
}
function reset() {
    init(boardSize.value);
}
function cpuMoveOnceFor(col) {
    const moves = board.value
        .flatMap((row, y) => row.map((_, x) => ({ x, y })))
        .filter(p => flips(p.x, p.y, col).length > 0);
    if (!moves.length) {
        pass();
        return false;
    }
    const mv = moves[Math.floor(Math.random() * moves.length)];
    play(mv.x, mv.y);
    return true;
}
function onClick(x, y) {
    if (gameOver.value || turn.value !== userColor.value)
        return;
    play(x, y);
}
function isValid(x, y) {
    return flips(x, y, turn.value).length > 0;
}
function hasMovesFor(col) {
    return board.value.some((row, y) => row.some((_, x) => flips(x, y, col).length > 0));
}
const gameOver = computed(() => !hasMovesFor("black") && !hasMovesFor("white"));
const score = computed(() => {
    let b = 0, w = 0;
    board.value.forEach(r => r.forEach(c => {
        if (c === "black")
            b++;
        else if (c === "white")
            w++;
    }));
    return { black: b, white: w };
});
const resultMessage = computed(() => {
    const { black, white } = score.value;
    if (black > white)
        return "黒の勝ち！";
    if (black < white)
        return "白の勝ち！";
    return "引き分け！";
});
// --- watch(gameOver) で履歴追加＆永続化 ---
watch(gameOver, (ended, was) => {
    if (ended && !was) {
        const res = score.value.black === score.value.white ? "draw" :
            score.value.black > score.value.white
                ? userColor.value === "black" ? "win" : "loss"
                : userColor.value === "white" ? "win" : "loss";
        const sym = res === "win" ? "○" : res === "loss" ? "●" : "□";
        matches.value.unshift({
            date: new Date().toLocaleString(),
            size: boardSize.value,
            player: userColor.value,
            result: res,
            resultSymbol: sym,
            score: { ...score.value }
        });
        localStorage.setItem(storageKey, JSON.stringify(matches.value));
    }
});
// --- watch(turn) で CPU を同期ループ実行 ---
watch(turn, () => {
    if (turn.value !== compColor.value || gameOver.value)
        return;
    // 自分の手番が続く限り即座に打つ or パスをループ
    while (turn.value === compColor.value && !gameOver.value) {
        if (hasMovesFor(compColor.value)) {
            cpuMoveOnceFor(compColor.value);
        }
        else {
            pass();
            break;
        }
    }
}, { immediate: true });
// --- init & watchers ---
function init(size = boardSize.value) {
    board.value = makeBoard(size);
    history.value = [board.value.map(r => [...r])];
    turn.value = "black";
    passCount.value = 0;
    // 後手選択時は最初に必ず黒CPUの一手を同期的に打つ
    if (userColor.value === "white") {
        cpuMoveOnceFor("black");
    }
}
watch(boardSize, sz => init(sz), { immediate: true });
watch(userColor, () => init(boardSize.value), { immediate: true });
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['cell']} */ ;
/** @type {__VLS_StyleScopedClasses['disc']} */ ;
/** @type {__VLS_StyleScopedClasses['disc']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "app" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "controls" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "radio",
    value: "black",
});
(__VLS_ctx.userColor);
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    type: "radio",
    value: "white",
});
(__VLS_ctx.userColor);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showHints = !__VLS_ctx.showHints;
        } },
    ...{ class: "toggle" },
});
(__VLS_ctx.showHints ? "候補を隠す" : "候補を表示");
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "size-select" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
    value: (__VLS_ctx.boardSize),
});
for (const [n] of __VLS_getVForSourceType((__VLS_ctx.sizes))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        key: (n),
        value: (n),
    });
    (n);
    (n);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "info" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.turn);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.score.black);
(__VLS_ctx.score.white);
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.undo) },
    disabled: (__VLS_ctx.history.length <= 2),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.reset) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board" },
});
for (const [row, y] of __VLS_getVForSourceType((__VLS_ctx.board))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (y),
        ...{ class: "row" },
    });
    for (const [_, x] of __VLS_getVForSourceType((row))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.onClick(x, y);
                } },
            key: (x),
            ...{ class: "cell" },
            ...{ class: ({ valid: __VLS_ctx.showHints && __VLS_ctx.isValid(x, y) }) },
        });
        if (__VLS_ctx.board[y][x] === 'black') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "disc black" },
            });
        }
        else if (__VLS_ctx.board[y][x] === 'white') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "disc white" },
            });
        }
    }
}
if (__VLS_ctx.gameOver) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "gameover" },
    });
    (__VLS_ctx.resultMessage);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "history-toggle" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showHistory = !__VLS_ctx.showHistory;
        } },
});
(__VLS_ctx.showHistory ? '履歴を隠す' : '履歴を表示');
if (__VLS_ctx.showHistory) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "history" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    (__VLS_ctx.wins);
    (__VLS_ctx.losses);
    (__VLS_ctx.draws);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.table, __VLS_intrinsicElements.table)({
        ...{ class: "history-table" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.thead, __VLS_intrinsicElements.thead)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.th, __VLS_intrinsicElements.th)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    for (const [m, i] of __VLS_getVForSourceType((__VLS_ctx.matches))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({
            key: (i),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (m.size);
        (m.size);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (m.player === 'black' ? '黒' : '白');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (m.resultSymbol);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (m.score.black);
        (m.score.white);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
        (m.date);
    }
}
/** @type {__VLS_StyleScopedClasses['app']} */ ;
/** @type {__VLS_StyleScopedClasses['controls']} */ ;
/** @type {__VLS_StyleScopedClasses['toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['size-select']} */ ;
/** @type {__VLS_StyleScopedClasses['info']} */ ;
/** @type {__VLS_StyleScopedClasses['board']} */ ;
/** @type {__VLS_StyleScopedClasses['row']} */ ;
/** @type {__VLS_StyleScopedClasses['cell']} */ ;
/** @type {__VLS_StyleScopedClasses['valid']} */ ;
/** @type {__VLS_StyleScopedClasses['disc']} */ ;
/** @type {__VLS_StyleScopedClasses['black']} */ ;
/** @type {__VLS_StyleScopedClasses['disc']} */ ;
/** @type {__VLS_StyleScopedClasses['white']} */ ;
/** @type {__VLS_StyleScopedClasses['gameover']} */ ;
/** @type {__VLS_StyleScopedClasses['history-toggle']} */ ;
/** @type {__VLS_StyleScopedClasses['history']} */ ;
/** @type {__VLS_StyleScopedClasses['history-table']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            sizes: sizes,
            boardSize: boardSize,
            board: board,
            history: history,
            turn: turn,
            userColor: userColor,
            showHints: showHints,
            showHistory: showHistory,
            matches: matches,
            wins: wins,
            losses: losses,
            draws: draws,
            undo: undo,
            reset: reset,
            onClick: onClick,
            isValid: isValid,
            gameOver: gameOver,
            score: score,
            resultMessage: resultMessage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=App.vue.js.map