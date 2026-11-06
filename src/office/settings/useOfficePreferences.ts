import { useCallback, useEffect, useRef, useState } from 'react';
import type { OfficePreferencesPatch, OfficePreferencesResponse, OfficeSnapshot } from '../../shared';
import { UNKNOWN_PREFERENCES, acceptPreferences } from './preference-order';

export type PreferenceField = keyof OfficePreferencesPatch;
export interface PreferenceFeedback { field: PreferenceField; message: string; error: boolean }

/** POST one preference patch to the office-wide route and validate the response identity. */
export async function requestPreferences(fetchImpl: typeof fetch, patch: OfficePreferencesPatch): Promise<OfficePreferencesResponse> {
    const response = await fetchImpl('/api/preferences', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
    let data: Partial<OfficePreferencesResponse> & { error?: string } = {};
    try { data = await response.json(); }
    catch { throw new Error(response.ok ? 'The Office returned an unreadable preference response' : `The Office returned ${response.status}`); }
    if (!response.ok) throw new Error(data.error || `The Office returned ${response.status}`);
    if (typeof data.serviceInstanceId !== 'string' || !data.serviceInstanceId || !Number.isSafeInteger(data.revision)) throw new Error('The Office returned an incomplete preference response');
    return data as OfficePreferencesResponse;
}

/** Office-wide preferences from accepted live snapshots, plus serialized saves. Mounted once in App. */
export function useOfficePreferences(live: OfficeSnapshot | null, connected: boolean, refresh: () => Promise<void>) {
    const [state, setState] = useState(UNKNOWN_PREFERENCES);
    const [pending, setPending] = useState<PreferenceField | ''>(''), [requested, setRequested] = useState<OfficePreferencesPatch | null>(null);
    const [feedback, setFeedback] = useState<PreferenceFeedback | null>(null);
    const busy = useRef(false), held = useRef(state);
    held.current = state;
    const instance = live?.serviceInstanceId, preferences = live?.preferences;
    useEffect(() => {
        if (!instance || !preferences) return;
        setState(current => acceptPreferences(current, { source: 'snapshot', instance, preferences }));
    }, [instance, preferences]);
    const writable = connected && !!state.preferences;
    const save = useCallback(async (patch: OfficePreferencesPatch) => {
        const field = Object.keys(patch)[0] as PreferenceField | undefined;
        if (!field || busy.current || !writable) return;
        busy.current = true; setPending(field); setRequested(patch); setFeedback(null);
        try {
            const response = await requestPreferences(fetch, patch);
            if (response.serviceInstanceId !== held.current.instance) {
                // A different service answered; read the accepted live state rather than replaying the patch.
                void refresh();
                return;
            }
            setState(current => acceptPreferences(current, { source: 'response', response }));
            setFeedback({ field, message: 'Saved for this Office.', error: false });
        }
        catch (error) { setFeedback({ field, message: String(error), error: true }); }
        finally { busy.current = false; setPending(''); setRequested(null); }
    }, [writable, refresh]);
    // The form shows a pending request's value; everything else uses only accepted preferences,
    // and a failed or superseded request falls back to them when it settles.
    const displayed = state.preferences && requested ? { ...state.preferences, ...requested } : state.preferences;
    return { preferences: state.preferences, displayed, pending, feedback, writable, save };
}
export type OfficePreferencesController = ReturnType<typeof useOfficePreferences>;
