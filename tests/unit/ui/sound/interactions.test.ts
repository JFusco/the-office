import { expect, test, vi } from 'vitest';
import type { ThreeEvent } from '@react-three/fiber';
import { sceneHover } from '../../../../src/office/sound/interactions';
import { officeSound } from '../../../../src/office/sound/player';

test('scene ray hits play once per foreground group and ignore drags and touch', () => {
    const play = vi.spyOn(officeSound, 'play');
    try {
        const group = {}, event = { eventObject: group, nativeEvent: { pointerType: 'mouse', buttons: 0 }, intersections: [{ eventObject: group }] };
        const move = () => sceneHover.onPointerMove(event as ThreeEvent<PointerEvent>);
        move(); move();
        sceneHover.onPointerLeave(event as ThreeEvent<PointerEvent>);
        event.nativeEvent.buttons = 1; move();
        event.nativeEvent.buttons = 0; event.nativeEvent.pointerType = 'touch'; move();
        event.nativeEvent.pointerType = 'mouse'; move();
        expect(play.mock.calls).toEqual([['hover'], ['hover']]);
    } finally { play.mockRestore(); }
});
