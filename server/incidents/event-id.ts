import { createHash } from 'node:crypto';

/**
 * A stable event ID: the same observation of the same ledger state always names the same event.
 * An event about a subject is named by the revision it produces, so no later observation reuses it.
 */
export function eventId(incident: string, kind: string, ...parts: string[]): string {
    return `${incident}:${kind}${parts.length ? `:${createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 16)}` : ''}`;
}
