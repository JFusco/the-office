/** Office drawer motion, shared by the inspector and full-workspace knowledge panel. */
export function panelMotion(reduced: boolean) {
    return {
        initial: { x: reduced ? 0 : 'calc(100% + 80px)' },
        animate: { x: 0 },
        exit: { x: reduced ? 0 : 'calc(100% + 80px)', transition: { duration: reduced ? 0 : .26, ease: [.4, 0, .6, 1] as const } },
        transition: { duration: reduced ? 0 : .34, ease: [.22, 1, .36, 1] as const },
    };
}
export const knowledgeCameraDuration = 850;
