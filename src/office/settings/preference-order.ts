import type { OfficePreferences, OfficePreferencesResponse } from '../../shared';

export interface PreferenceState { instance: string; preferences: OfficePreferences | null }
export const UNKNOWN_PREFERENCES: PreferenceState = { instance: '', preferences: null };
export type PreferenceCandidate =
    | { source: 'snapshot'; instance: string; preferences: OfficePreferences }
    | { source: 'response'; response: OfficePreferencesResponse };

const strip = ({ serviceInstanceId: _instance, ...preferences }: OfficePreferencesResponse): OfficePreferences => preferences;

/** Orders preference values by revision within one service instance.
 *  Only a live snapshot already accepted by useOffice may establish or switch the instance;
 *  a new instance (restart or restore) replaces held values even at a lower revision.
 *  A POST response updates values only for the instance already accepted. */
export function acceptPreferences(state: PreferenceState, candidate: PreferenceCandidate): PreferenceState {
    if (candidate.source === 'snapshot') {
        const { instance, preferences } = candidate;
        if (!instance) return state;
        if (instance !== state.instance) return { instance, preferences };
        if (state.preferences && preferences.revision <= state.preferences.revision) return state;
        return { instance, preferences };
    }
    const { response } = candidate;
    if (!state.instance || response.serviceInstanceId !== state.instance) return state;
    if (state.preferences && response.revision <= state.preferences.revision) return state;
    return { instance: state.instance, preferences: strip(response) };
}
