import { redactEvidence } from './redact-evidence';

const LIMIT = 200;
/** A status code says which failure it was; every other number says which occurrence. */
/** Digits to keep are parked in the private-use area while the others are replaced. */
const KEPT = 0xE000;
const STATUS = /\b((?:http|status|code|returned|responded with)\s+)([1-5]\d{2})\b/gi;

/**
 * Reduces a harness message to what it says, without what it says it about: the first line, with
 * links, paths, ticket keys, identifiers, times and numbers replaced by placeholders. Two stops
 * with the same cause on different tickets, or at different times, normalize to the same text.
 */
export function normalizeCause(text: unknown): string {
    if (typeof text !== 'string') return '';
    const line = redactEvidence(text).trim().split('\n')[0].replace(/^(?:(?:\w*Error|CommandFailure):\s*)+/, '');
    return line
        .replace(/https?:\/\/\S+/gi, '<url>')
        .replace(/\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?/g, '<time>')
        .replace(/(?:~|\.{1,2})?\/[\w@.+-]+(?:\/[\w@.+-]+)+\/?/g, '<path>')
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<id>')
        .replace(/\b[A-Z][A-Z0-9]{1,9}-\d+\b/g, '<key>')
        .replace(STATUS, (_, word: string, code: string) => word + [...code].map(digit => String.fromCharCode(KEPT + Number(digit))).join(''))
        // A run of three or more colon-separated groups (a GitHub request ID, an address) names an occurrence.
        .replace(/\b[0-9a-f]{2,}(?::[0-9a-f]{2,}){2,}\b/gi, '<id>')
        .replace(/\b(?=[0-9a-f]*\d)(?=[0-9a-f]*[a-f])[0-9a-f]{7,64}\b/gi, '<id>')
        .replace(/#?\b\d+(?:[.:]\d+)*(?=[a-z]{0,3}\b)/gi, '<n>')
        .replace(/[\uE000-\uE009]/g, kept => String(kept.charCodeAt(0) - KEPT))
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, LIMIT);
}
