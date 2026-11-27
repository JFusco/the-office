import { useEffect, useRef, useState } from 'react';
import { Button, CheckField, Section, SectionTitle, fieldLabel, mutedCopy } from '../../ui';
import { LoadingState } from '../../ui/LoadingState';
import { SaveFeedback } from '../SaveFeedback';
import { officeSound, type Sound } from '../sound/player';
import { settingsSwitch } from '../sound/interactions';
import type { OfficePreferencesController } from './useOfficePreferences';

const effects = [
    { field: 'hoverSound', label: 'Hover', previews: [['hover', 'Play hover']] },
    { field: 'settingSounds', label: 'Setting changes', previews: [['on', 'Play on'], ['off', 'Play off']] },
    { field: 'floorSound', label: 'Floor arrivals', previews: [['doors', 'Play doors']] },
] as const;

export function SoundSettings({ controller }: { controller: OfficePreferencesController }) {
    const { displayed, writable, pending, feedback, save } = controller;
    const [draft, setDraft] = useState<number>();
    const editing = useRef<number | undefined>(undefined);
    const adjusting = useRef(false);
    useEffect(() => () => officeSound.setDraftVolume(), []);
    if (!displayed) return <LoadingState>Loading sound preferences…</LoadingState>;
    const disabled = !writable || !!pending;
    function finish() {
        adjusting.current = false;
        const value = editing.current;
        if (value === undefined) return;
        editing.current = undefined;
        setDraft(undefined);
        if (!disabled && value !== displayed?.soundVolume) void save({ soundVolume: value });
        officeSound.setDraftVolume();
    }
    const volume = draft ?? displayed.soundVolume;
    const preview = (sound: Sound, label: string) => <Button key={sound} data-sound-preview onClick={() => officeSound.play(sound, true)}>{label}</Button>;
    return <Section data-settings-block="sound" onChangeCapture={settingsSwitch}>
        <SectionTitle>Sound</SectionTitle>
        <div className="grid gap-4">
            <p className={mutedCopy}>Shared across Office projects and browsers.</p>
            <label className={fieldLabel}>Sound effects volume <span aria-hidden="true">{volume}%</span>
                <input className="block w-full" type="range" min="0" max="100" value={volume} aria-valuetext={volume + '%'} disabled={!writable || (!!pending && pending !== 'soundVolume')} aria-disabled={disabled}
                    onPointerDown={event => {
                        adjusting.current = true;
                        event.currentTarget.setPointerCapture(event.pointerId);
                    }} onKeyDown={() => { adjusting.current = true; }}
                    onChange={event => {
                        if (disabled) return;
                        const value = event.target.valueAsNumber;
                        editing.current = value;
                        setDraft(value);
                        officeSound.setDraftVolume(value);
                        if (!adjusting.current) finish();
                    }} onPointerUp={finish} onKeyUp={finish} onBlur={finish} onPointerCancel={finish} />
            </label>
            {effects.map(({ field, label, previews }) => <div key={field} className="flex flex-wrap items-center justify-between gap-2">
                <CheckField checked={displayed[field]} disabled={disabled} data-switch-sound={field === 'settingSounds' || undefined}
                    onChange={event => void save({ [field]: event.target.checked })}>{label}</CheckField>
                <div className="flex gap-2">{previews.map(([sound, text]) => preview(sound, text))}</div>
            </div>)}
            {pending ? <SaveFeedback pending message=""/> : feedback && ['soundVolume', ...effects.map(effect => effect.field)].includes(feedback.field)
                ? <SaveFeedback message={feedback.message} error={feedback.error}/> : null}
        </div>
    </Section>;
}
