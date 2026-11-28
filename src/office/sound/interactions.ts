import type { FormEvent } from 'react';
import { officeSound } from './player';

function navigationRow(target: EventTarget | null) {
    return target instanceof Element ? target.closest('[data-drawer-row]') : null;
}

export function bindSoundInteractions(doc: Document) {
    const events = new AbortController();
    const options = { capture: true, signal: events.signal };
    for (const name of ['pointerdown', 'pointerup', 'keydown', 'click']) doc.addEventListener(name, () => officeSound.unlock(), options);
    doc.addEventListener('pointerover', event => {
        if (event.pointerType === 'touch' || event.buttons) return;
        const row = navigationRow(event.target);
        if (!row || row === navigationRow(event.relatedTarget) || row.closest(':disabled, [aria-disabled=true], [inert]')) return;
        officeSound.play('hover');
    }, options);
    return () => events.abort();
}

export function settingsSwitch(event: FormEvent) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'checkbox' || input.disabled) return;
    // Turning the switch-sound preference itself on or off auditions its new position.
    officeSound.play(input.checked ? 'on' : 'off', input.hasAttribute('data-switch-sound'));
}
