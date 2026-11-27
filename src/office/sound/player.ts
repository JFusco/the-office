import { OFFICE_PREFERENCE_DEFAULTS, type OfficePreferences } from '../../shared';
import hover from './recordings/hover.wav?url';
import on from './recordings/on.wav?url';
import off from './recordings/off.wav?url';
import doors from './recordings/doors.wav?url';

const recordings = { hover, on, off, doors };
export type Sound = keyof typeof recordings;
const switches = { hover: 'hoverSound', on: 'settingSounds', off: 'settingSounds', doors: 'floorSound' } as const;

export class SoundPlayer {
    private context?: AudioContext;
    private gain?: GainNode;
    private buffers = new Map<Sound, AudioBuffer>();
    private preferences = OFFICE_PREFERENCE_DEFAULTS;
    private draftVolume?: number;

    async preload(create = () => new AudioContext({ latencyHint: 'interactive' }), load = fetch) {
        if (this.context) return;
        const context = this.context = create();
        this.gain = context.createGain();
        this.gain.connect(context.destination);
        this.updateGain();
        await Promise.all(Object.entries(recordings).map(async ([name, url]) => {
            const response = await load(url);
            if (response.ok) this.buffers.set(name as Sound, await context.decodeAudioData(await response.arrayBuffer()));
        }));
    }

    unlock() {
        if (this.context?.state === 'suspended') void this.context.resume().catch(() => {});
    }

    configure(preferences: OfficePreferences | null) {
        this.preferences = preferences ?? OFFICE_PREFERENCE_DEFAULTS;
        this.updateGain();
    }

    setDraftVolume(value?: number) {
        this.draftVolume = value;
        this.updateGain();
    }

    private updateGain() {
        if (this.gain) this.gain.gain.value = (this.draftVolume ?? this.preferences.soundVolume ?? OFFICE_PREFERENCE_DEFAULTS.soundVolume) / 100;
    }

    play(sound: Sound, preview = false) {
        const buffer = this.buffers.get(sound);
        if ((!preview && !this.preferences[switches[sound]]) || !buffer || !this.gain?.gain.value || this.context?.state !== 'running') return;
        const voice = this.context.createBufferSource();
        voice.buffer = buffer;
        voice.connect(this.gain);
        voice.onended = () => voice.disconnect();
        voice.start();
    }
}

export const officeSound = new SoundPlayer();
