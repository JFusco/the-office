import type { ThreeEvent } from '@react-three/fiber';
import type { FormEvent } from 'react';
import { officeSound } from './player';

const controls = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=switch], [role=tab], [role=checkbox], [role=link], label';
function control(target: EventTarget | null) {
    if (!target || !(target instanceof Element) || target.closest('[inert], [aria-disabled=true], [data-sound-preview]')) return null;
    const match = target.closest(controls);
    const element = match instanceof HTMLLabelElement ? match.control : match;
    return element && !element.matches(':disabled, [aria-disabled=true]') ? element : null;
}
function hoverable(event: PointerEvent) {
    return event.pointerType !== 'touch' && !event.buttons;
}
export function bindSoundInteractions(doc: Document) {
    const events = new AbortController();
    const options = { capture: true, signal: events.signal };
    for (const name of ['pointerdown', 'pointerup', 'keydown', 'click']) doc.addEventListener(name, () => officeSound.unlock(), options);
    doc.addEventListener('pointerover', event => {
        const next = control(event.target);
        if (hoverable(event) && next && next !== control(event.relatedTarget)) officeSound.play('hover');
    }, options);
    return () => events.abort();
}

// Ray intersections can contain several meshes in the same interactive group.
let lastGroup: object | undefined;
export const sceneHover = {
    onPointerMove(event: ThreeEvent<PointerEvent>) {
        if (control(event.nativeEvent.target)) return;
        if (!hoverable(event.nativeEvent) || event.intersections[0]?.eventObject !== event.eventObject) return;
        if (lastGroup !== event.eventObject) officeSound.play('hover');
        lastGroup = event.eventObject;
    },
    onPointerLeave(event: ThreeEvent<PointerEvent>) {
        if (lastGroup === event.eventObject) lastGroup = undefined;
    },
};

export function settingsSwitch(event: FormEvent) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox' || input.disabled) return;
    // Turning the switch-sound preference itself on or off auditions its new position.
    officeSound.play(input.checked ? 'on' : 'off', input.hasAttribute('data-switch-sound'));
}
