const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
/** `investigation:brain:worker:<uuid>:surviving-subprocesses`, `job:<uuid>`. A sentence's closing period is not part of it. */
const COMPOSITE = new RegExp(`\\b(?:[a-z][\\w-]*:)+[\\w-]*${UUID}(?::[\\w-]+(?:\\.[\\w-]+)*)*`, 'gi');
/** `learning:<sha>`, `brain:<sha>:knowledge/note.md`. The tail is taken only when it is a path. */
const PREFIXED_HASH = /\b[a-z][\w-]*:(?=[a-f0-9]*[a-f])(?=[a-f0-9]*\d)[a-f0-9]{12,64}\b(?::[\w-]+(?:[/.][\w-]+)+)?/gi;
const BARE_UUID = new RegExp(`\\b${UUID}\\b`, 'gi');
/** Seven or more hex characters with both a digit and a letter, standing alone: commit heads, digests, fingerprints.
 *  Not part of a path, branch or file name (`feature/abc123def`, `index-4db12f5.js`). */
const HASH = /(?<![\w/.#-])(?=[a-f0-9]*\d)(?=[a-f0-9]*[a-f])[a-f0-9]{7,64}(?![\w/-]|\.\w)/gi;
const FULL_COMMIT = /(?<![\w/.#-])[a-f0-9]{40}(?![\w/-]|\.\w)/gi;
const URL = /https?:\/\/[^\s)>\]]+/gi;
const GONE = '\u0000';

function strip(text: string): string {
    const marked = text.replace(COMPOSITE, GONE).replace(PREFIXED_HASH, GONE).replace(BARE_UUID, GONE).replace(FULL_COMMIT, 'the reviewed commit').replace(HASH, GONE);
    if (!marked.includes(GONE)) return marked;
    // Tidy only around what was removed; all other punctuation and spacing is the author's.
    return marked.replace(/[([][ \t]*\u0000[ \t]*[)\]]/g, GONE)
        .replace(/^([ \t]*)\u0000[ \t]*[·:;,-][ \t]*/gm, '$1')
        .replace(/[ \t]*[·:;,-][ \t]*\u0000(?=[ \t]*(?:\n|$|[·:;,]))/g, '')
        .replace(/[ \t]*\u0000/g, '');
}

/** Removes machine identifiers from text written for a person. Ticket keys, PR numbers, dates, paths and links stay. */
export function withoutIdentifiers(text: string = ''): string {
    let out = '', last = 0;
    for (const match of text.matchAll(URL)) { out += strip(text.slice(last, match.index)) + match[0]; last = match.index + match[0].length; }
    return (out + strip(text.slice(last))).trim();
}

const SUBJECT: Record<string, string> = { job: 'Delivery', delivery: 'Delivery', ticket: 'Ticket run', maintenance: 'Maintenance run', feature: 'Feature', investigation: 'IT investigation', recovery: 'Recovery', orchestration: 'Orchestration', message: 'Office message' };
/** A ticket key when the record has one; otherwise what kind of work it is. Never an internal id. */
export function subjectLabel(key: string | undefined, kind?: string): string {
    const readable = withoutIdentifiers(key);
    return readable && readable === (key || '').trim() ? readable : SUBJECT[kind || ''] || 'Office work';
}
