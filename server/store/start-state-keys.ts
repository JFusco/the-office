/**
 * The state keys a service start rewrites: its start time, and the revision, clock and recent-event list that
 * every event carries. A start alone changes nothing else in a project's saved state.
 *
 * Two readers depend on the same list. The store keeps the whole `state` row a previous release wrote in step
 * while only these keys change, so a start writes what it always wrote (`state-parts.ts`). The release rollback
 * comparison sets exactly these values aside, so a start alone does not count as a change
 * (`server/release/fenced-start-writes.ts`).
 */
export const START_STATE_KEYS = ['startedAt', 'serverTime', 'revision', 'events'] as const;
export type StartStateKey = typeof START_STATE_KEYS[number];

export function startStateKey(key: string): key is StartStateKey {
    return (START_STATE_KEYS as readonly string[]).includes(key);
}
