import { redactEvidence } from './redact-evidence';

/** Text kept beside an incident as evidence: sanitized, one line, bounded. */
export function boundedEvidence(text: unknown, limit = 300): string {
    if (typeof text !== 'string') return '';
    const line = redactEvidence(text).trim().split('\n')[0];
    return line.length > limit ? `${line.slice(0, limit)}…` : line;
}
