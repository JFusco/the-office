/**
 * What a release writes to a project store by starting under the deployment fence, before it can admit
 * anything: its start time (`Store`), and the `office-opened` event with the revision, clock and
 * recent-event list every event carries (`server/index.ts`). The rollback comparison leaves exactly
 * these out, so a start alone does not count as a change; everything else must still match.
 */

/**
 * The state keys a start rewrites, each with the shape the previous release reads it in. They are
 * saved twice: in the whole `state` row and one row each in `state_parts` (`server/store/state-parts.ts`).
 */
const START_STATE_KEYS: Record<string, (value: unknown) => boolean> = {
    startedAt: value => typeof value === 'string',
    serverTime: value => typeof value === 'string',
    revision: value => Number.isSafeInteger(value) && (value as number) >= 0,
    events: value => Array.isArray(value),
};

/** The events a start records. */
const START_EVENT_KINDS = ['office-opened'];

/** The table a start appends to. Rows a comparison's baseline already held must still be there, unchanged. */
export const APPENDED_TABLE = 'events';

/**
 * A `state` body with the value of each key a start rewrites set aside. The key stays, so one that
 * was removed is a difference, and so is a value that no longer has its shape. A body that is not a
 * JSON object is compared whole.
 */
function withoutStartValues(body: unknown): unknown {
    if (typeof body !== 'string') return body;
    let state: unknown;
    try { state = JSON.parse(body); } catch { return body; }
    if (!state || typeof state !== 'object' || Array.isArray(state)) return body;
    const saved = state as Record<string, unknown>;
    for (const [key, shaped] of Object.entries(START_STATE_KEYS))
        if (Object.hasOwn(saved, key)) saved[key] = shaped(saved[key]) ? [] : [saved[key]];
    return JSON.stringify(saved);
}

/**
 * A `state_parts` row with the value of a key a start rewrites set aside: no body, which a saved row
 * never has. The row stays, so a removed part is a difference, and a value without its shape is compared whole.
 */
function withoutStartValue(row: Record<string, unknown>): Record<string, unknown> {
    if (typeof row.key !== 'string' || !Object.hasOwn(START_STATE_KEYS, row.key) || typeof row.body !== 'string') return row;
    try { return START_STATE_KEYS[row.key](JSON.parse(row.body)) ? { ...row, body: null } : row; } catch { return row; }
}

/**
 * A project store's row as the rollback comparison reads it; null when a start alone accounts for the
 * row. `lastEvent` is the highest row of `APPENDED_TABLE` the store holds now.
 */
export function comparableRow(table: string, row: Record<string, unknown>, lastEvent?: bigint): Record<string, unknown> | null {
    // The counter of the appended table moves with every event. It is left out only while it names the last
    // event, as it does in a store that never deletes one; the events themselves are compared.
    if (table === 'sqlite_sequence' && row.name === APPENDED_TABLE)
        return lastEvent !== undefined && (typeof row.seq === 'bigint' || Number.isSafeInteger(row.seq)) && BigInt(row.seq as bigint) === lastEvent ? null : row;
    if (table === 'state') return { ...row, body: withoutStartValues(row.body) };
    if (table === 'state_parts') return withoutStartValue(row);
    return row;
}

/**
 * The order to read a project store's table in, as SQL after the table name. A start replaces its
 * `state_parts` rows, which moves them within the table; a reader sees them by key, never by where they sit.
 */
export function comparableOrder(table: string): string {
    return table === 'state_parts' ? ' ORDER BY key' : '';
}

/** Whether a row appended to `APPENDED_TABLE` after the baseline is an event a start records. Any other row is a change. */
export function startEvent(row: Record<string, unknown>): boolean {
    if (typeof row.body !== 'string') return false;
    try {
        const event: unknown = JSON.parse(row.body);
        return !!event && typeof event === 'object' && START_EVENT_KINDS.includes((event as { kind?: unknown }).kind as string);
    } catch { return false; }
}
