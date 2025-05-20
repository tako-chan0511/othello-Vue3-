import { ref, watch, computed } from "vue";
// --- state ---
const sizes = [4, 6, 8, 10, 12];
const boardSize = ref(8);
const board = ref([]);
const history = ref([]);
const turn = ref("black");
const passCount = ref(0);
// ユーザーが先手か後手か
const userColor = ref("black");
// コンピュータは反対色
const compColor = computed(() => userColor.value === "black" ? "white" : "black");
// 候補表示フラグ
const showHints = ref(true);
// --- helpers ---
const DIRS = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
];
function makeBoard(n) {
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
    if (board.value[y][x] !== null)
        return [];
    const opp = col === "black" ? "white" : "black";
    const res = [];
    for (const [dx, dy] of DIRS) {
        let cx = x + dx, cy = y + dy;
        const buf = [];
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
    if (history.value.length <= 2)
        return;
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
function cpuMoveOnceFor(col) {
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
function onClick(x, y) {
    if (gameOver.value || turn.value !== userColor.value)
        return;
    if (play(x, y)) {
        // turn now equals compColor, watch(turn) will trigger CPU move
    }
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
    board.value.forEach((r) => r.forEach((c) => {
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
// --- observe turn change for CPU ---
watch(turn, (t) => {
    if (t === compColor.value && !gameOver.value) {
        setTimeout(() => {
            cpuMoveOnceFor(compColor.value);
        }, 300);
    }
}, { immediate: true });
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
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
    disabled: (__VLS_ctx.history.length <= 1),
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