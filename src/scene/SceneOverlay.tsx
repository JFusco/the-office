import { createContext, useContext, useEffect, useRef, useState, type ComponentProps } from 'react';
import { Html } from '@react-three/drei';
import { cx } from '../ui';

const entranceDelayClasses = ['delay-0', 'delay-35', 'delay-70', 'delay-105', 'delay-140', 'delay-175', 'delay-210', 'delay-245', 'delay-280'];

export const FloorVisibility = createContext({ active: true, revealed: true, travelling: false, reduced: false });

/** Stagger by the visible screen position, including after the camera has been rotated. */
export function overlayEntranceDelays(tops: number[]): number[] {
    const ordered = tops.map((top, index) => ({ top, index })).sort((a, b) => a.top - b.top || a.index - b.index);
    const delays = tops.map(() => 0);
    ordered.forEach(({ index }, rank) => { delays[index] = Math.min(rank * 35, 280); });
    return delays;
}

/** Translate only the inner overlay; Drei keeps control of the world-position anchor. */
export function SceneOverlay({ children, ...props }: ComponentProps<typeof Html>) {
    const { active, revealed, travelling, reduced } = useContext(FloorVisibility);
    const ref = useRef<HTMLDivElement>(null), [ready, setReady] = useState(false), [delay, setDelay] = useState(0);
    useEffect(() => {
        setReady(false);
        if (!active || !revealed || reduced) return;
        let frame = requestAnimationFrame(() => {
            // Wait for Drei to project the newly selected floor before ordering the labels.
            frame = requestAnimationFrame(() => {
                const overlays = [...document.querySelectorAll<HTMLElement>('[data-scene-overlay][data-floor-active="true"]')];
                const index = overlays.indexOf(ref.current!);
                setDelay(overlayEntranceDelays(overlays.map(element => element.getBoundingClientRect().top))[index] || 0);
                setReady(true);
            });
        });
        return () => cancelAnimationFrame(frame);
    }, [active, revealed, reduced]);
    const shown = active && revealed && (reduced || ready);
    return <Html {...props}><div ref={ref} data-scene-overlay data-floor-active={active} data-entrance-delay={reduced ? 0 : delay}
        inert={!shown || travelling}
        className={cx(shown && !reduced ? entranceDelayClasses[delay / 35] : 'delay-0', !active && 'hidden', shown ? 'visible opacity-100 translate-y-0 duration-420' : 'invisible opacity-0 -translate-y-1.5 duration-140', travelling && 'pointer-events-none', reduced ? 'transition-none translate-y-0' : 'transition-[opacity,translate,visibility] ease-scene-enter')}>{children}</div></Html>;
}
