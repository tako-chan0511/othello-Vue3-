import { defineProps } from 'vue';
const props = defineProps();
const game = props.game;
function isValid(x, y) {
    return game.validMoves.some(m => m.x === x && m.y === y);
}
function onClick(x, y) {
    if (game.isGameOver)
        return;
    if (game.turn === 'black' && game.play(x, y)) {
        setTimeout(() => game.cpuMove(), 300);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['cell']} */ ;
/** @type {__VLS_StyleScopedClasses['disc']} */ ;
/** @type {__VLS_StyleScopedClasses['disc']} */ ;
// CSS variable injection 
// CSS variable injection end 
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "board" },
});
for (const [row, y] of __VLS_getVForSourceType((__VLS_ctx.game.board))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (y),
        ...{ class: "board-row" },
    });
    for (const [cell, x] of __VLS_getVForSourceType((row))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.onClick(x, y);
                } },
            key: (x),
            ...{ class: "cell" },
            ...{ class: ({ valid: __VLS_ctx.isValid(x, y) }) },
        });
        if (cell) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['disc', cell]) },
            });
        }
    }
}
/** @type {__VLS_StyleScopedClasses['board-container']} */ ;
/** @type {__VLS_StyleScopedClasses['board']} */ ;
/** @type {__VLS_StyleScopedClasses['board-row']} */ ;
/** @type {__VLS_StyleScopedClasses['cell']} */ ;
/** @type {__VLS_StyleScopedClasses['valid']} */ ;
/** @type {__VLS_StyleScopedClasses['disc']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            game: game,
            isValid: isValid,
            onClick: onClick,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Board.vue.js.map