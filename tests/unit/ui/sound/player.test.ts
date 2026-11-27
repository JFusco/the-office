import { expect, test, vi } from 'vitest';
import { SoundPlayer } from '../../../../src/office/sound/player';
import { OFFICE_PREFERENCE_DEFAULTS } from '../../../../src/shared';

test('drops cold or locked cues and starts warm voices synchronously from cached audio', async () => {
    const start = vi.fn(), gain = { gain: { value: 1 }, connect: vi.fn() };
    const context = { state: 'suspended', createGain: () => gain, createBufferSource: () => ({ connect: vi.fn(), start }),
        decodeAudioData: async () => ({}), resume: async () => { context.state = 'running'; } };
    const load = vi.fn(async () => new Response(new Uint8Array(2)));
    const player = new SoundPlayer();
    player.configure({ ...OFFICE_PREFERENCE_DEFAULTS, hoverSound: true });
    player.play('hover');
    await player.preload(() => context as unknown as AudioContext, load);
    player.play('hover');
    player.unlock();
    expect(start).not.toHaveBeenCalled();
    player.play('hover');
    expect(start).toHaveBeenCalledTimes(1);
    player.play('doors');
    player.play('doors', true);
    expect(start).toHaveBeenCalledTimes(2);
    player.setDraftVolume(0);
    player.play('on', true);
    expect(start).toHaveBeenCalledTimes(2);
    player.setDraftVolume();
    expect(gain.gain.value).toBe(.25);
    expect(load).toHaveBeenCalledTimes(4);
});
