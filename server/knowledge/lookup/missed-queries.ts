import { sanitize } from '../../office/security';
import { readOwnedSessionArtifact } from '../../store/owned-artifact';
import type { KnowledgeLookupSummary } from '../../../src/contracts/knowledge-lookups';
import { decodeLookupJournal } from './receipts';

export const MISSED_QUERY_LIMIT = 200;
/** `brain` separates a real gap (`available`: Brain was searched and held nothing) from a Brain outage. */
export interface MissedQuery { query: string; brain: 'available' | 'unavailable' }

const clip = (text: string) => text.length <= MISSED_QUERY_LIMIT ? text : `${text.slice(0, MISSED_QUERY_LIMIT - 1)}…`;

/**
 * What one assignment asked the knowledge lookup and got nothing back for. The text comes from the
 * assignment's private log, which must still match the digest recorded in the store; a missing,
 * oversize or altered log yields no queries instead of unverified text.
 */
export function missedQueries(dataRoot: string, summary: KnowledgeLookupSummary): MissedQuery[] {
    if (!summary.records.some(record => record.outcome === 'unavailable')) return [];
    const log = readOwnedSessionArtifact(dataRoot, summary.id, 'lookups.jsonl', 655360);
    if (!('text' in log)) return [];
    try {
        return decodeLookupJournal(log.text, summary)
            .filter(row => row.response.assignment === summary.id && row.response.outcome === 'unavailable')
            .map(row => ({ query: clip(sanitize(row.query).replace(/\s+/g, ' ').trim()), brain: row.response.technicalStatus }));
    }
    catch { return []; }
}
