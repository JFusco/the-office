import { motionValue, styleEffect } from 'motion';
import type { FocusOverlayPosition } from './focus-overlay-position';

/** Motion owns the projected CSS-variable bindings and their complete disposal. */
export function focusOverlayMotion(element?: HTMLElement) {
    const values = { '--map-focus-x': motionValue('0px'), '--map-focus-y': motionValue('0px'), '--map-focus-label-width': motionValue('0px'), '--map-focus-label-shift': motionValue('var(--spacing-card-padding)') };
    const detach = element ? styleEffect(element,values) : undefined;
    return {
        render(position?: FocusOverlayPosition) {
            if (!element) return;
            if(!position){element.hidden=true;return;}
            values['--map-focus-x'].set(`${position.x}px`);values['--map-focus-y'].set(`${position.y}px`);
            if(position.labelWidth!==undefined)values['--map-focus-label-width'].set(`${position.labelWidth}px`);
            values['--map-focus-label-shift'].set(position.labelLeft?'calc(-100% - var(--spacing-card-padding))':'var(--spacing-card-padding)');
            // Flush through Motion's public effect API before revealing the same camera pose.
            styleEffect.flush(element);element.hidden=false;
        },
        dispose() { detach?.();Object.values(values).forEach(value=>value.destroy());if(element)element.hidden=true; },
    };
}
