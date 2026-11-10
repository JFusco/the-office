import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { motion, useIsPresent } from 'motion/react';
import { panelMotion } from '../tokens/motion';
import { cx } from '../ui';

/** The Office drawer lifecycle, with room restoration owned by its presence boundary. */
export function BrainDrawer({ children, reduced, opener, busy = false }: { children: ReactNode; reduced: boolean; opener: RefObject<HTMLElement | null>; busy?: boolean }) {
    const panel = useRef<HTMLElement>(null);
    const present = useIsPresent();
    useEffect(() => {
        if (present) {
            if (!panel.current?.contains(document.activeElement)) panel.current?.focus({ preventScroll: true });
        } else if (!document.activeElement || document.activeElement === document.body || panel.current?.contains(document.activeElement)) {
            opener.current?.focus({ preventScroll: true });
        }
    }, [present, opener]);
    return <motion.main ref={panel} tabIndex={-1} aria-label="Office Brain" data-brain-drawer
        {...panelMotion(reduced)} inert={!present || busy} aria-hidden={!present} aria-busy={busy || undefined}
        className={cx(present ? 'pointer-events-auto' : 'pointer-events-none', 'fixed top-topbar right-0 bottom-dock flex w-brain-drawer flex-col overflow-hidden border-l border-secondary-line bg-drawer text-ink shadow-drawer backdrop-blur-drawer will-change-transform max-tablet:w-full max-compact:top-topbar-compact max-compact:bottom-dock-compact')}>
        {children}
    </motion.main>;
}
