import type { EffectIntent, TimeEntry, TimePublication } from '../../src/shared';
import type { TimeLedgerState } from '../../src/contracts/timing';
import type { Store } from '../store/store';

/**
 * What one Jira publication covering a day means for that day, read only from local records:
 * - `settled`: the ledger says verified (including an old build's verification beside an uncertain Effect).
 * - `projectable`: its Effect verified but the ledger was not finished; finish locally, no Jira call.
 * - `attempted`: a write may have reached Jira (ledger dispatch evidence or a claimed Effect); read back only.
 * - `never-sent`: prepared, with no Effect or a prepared/rejected one; nothing reached Jira.
 */
export type JiraAttemptState = 'settled' | 'projectable' | 'attempted' | 'never-sent';
export interface JiraAttempt {
    publication: TimePublication;
    /** The publication's Effect, only when it was frozen for this ticket and day. */
    effect?: EffectIntent;
    state: JiraAttemptState;
    /** A later verified publication covers the same day; existing later-verified semantics apply. */
    superseded: boolean;
}

const attempted = (status: string) => status === 'dispatching' || status === 'uncertain';
const covers = (publication: TimePublication, entry: Pick<TimeEntry, 'id'>) => publication.provider === 'jira' && publication.covered.some(covered => covered.id === entry.id);

/** An Effect speaks for a publication only when it was frozen for that ticket and day. */
function bound(effect: EffectIntent, publication: TimePublication): boolean {
    const covered = (effect.expectedState as { covered?: TimePublication['covered'] } | null)?.covered;
    return effect.target === publication.key && Array.isArray(covered) && covered.some(item => publication.covered.some(own => own.id === item.id && own.revision === item.revision));
}

/** `foreign`: a record under this publication's Effect id that was not frozen for it; held, never trusted. */
export function attemptState(publication: TimePublication, effect: EffectIntent | undefined, foreign = false): JiraAttemptState {
    if (publication.status === 'verified')
        return 'settled';
    if (foreign)
        return 'attempted';
    if (effect?.status === 'verified')
        return 'projectable';
    if (attempted(publication.status) || effect && attempted(effect.status))
        return 'attempted';
    return 'never-sent';
}

/** Every Jira publication that covers this day, in history order, across revisions. */
export function jiraAttempts(store: Store, ledger: TimeLedgerState, entry: Pick<TimeEntry, 'id'>): JiraAttempt[] {
    const publications = ledger.publications || [];
    return publications.flatMap((publication, index) => {
        if (!covers(publication, entry))
            return [];
        const saved = publication.effectId ? store.getEffect(publication.effectId) : undefined;
        const effect = saved && bound(saved, publication) ? saved : undefined;
        const superseded = publications.some((later, after) => after > index && later.status === 'verified' && covers(later, entry));
        return [{ publication, effect, state: attemptState(publication, effect, !!saved && !effect), superseded }];
    });
}

const open = (attempt: JiraAttempt) => attempt.state === 'attempted' || attempt.state === 'projectable';

/** Attempts that still need read-back or projection before this day may be written again. */
export function unresolvedAttempts(store: Store, ledger: TimeLedgerState, entry: Pick<TimeEntry, 'id'>): JiraAttempt[] {
    return jiraAttempts(store, ledger, entry).filter(attempt => open(attempt) && !attempt.superseded);
}

/**
 * Nothing for this day can have reached Jira: no known worklog and no attempted or verified-unfinished
 * publication/Effect at any revision. Superseded history still counts here, as it always has.
 */
export function provenNeverSent(store: Store, ledger: TimeLedgerState, entry: TimeEntry): boolean {
    return !entry.worklogId && !jiraAttempts(store, ledger, entry).some(open);
}
