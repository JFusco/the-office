/**
 * Where a source offset sits among the JSON strings of a text, built once per redaction in one forward pass.
 *
 * A string at depth 1 is a double-quoted string in the source itself, of a whole JSON document or one pasted
 * into prose. A string at depth d + 1 is a double-quoted string inside the decoded content of a depth-d string.
 * A string is established only once its closing quote is found. A cut string value leaves the rest of its
 * parent's content unresolved: what is inside it is known only at the parent's depth.
 */
export interface LayerString {
    depth: number;
    /** Source offset of the first content character, and of the closing delimiter. */
    start: number;
    end: number;
    /** The content decoded `depth` times, and the source offset where each decoded character begins (one more entry: `end`). */
    decoded: string;
    starts: number[];
    parent: LayerString | null;
    /** Decoded index of the opening quote of an unclosed string inside this one, or -1. */
    unresolved: number;
}

const SIMPLE: Readonly<Record<string, string>> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
const HEX4 = /^[\dA-Fa-f]{4}$/;

/** Decodes `src[from, to)` as JSON string content. An escape JSON does not define keeps its backslash as text. */
function decode(src: string, from: number, to: number, at: (i: number) => number): { decoded: string; starts: number[] } {
    const out: string[] = [], starts: number[] = [];
    for (let i = from; i < to;) {
        starts.push(at(i));
        if (src[i] === '\\' && i + 1 < to) {
            const simple = SIMPLE[src[i + 1]];
            if (simple !== undefined) { out.push(simple); i += 2; continue; }
            if (src[i + 1] === 'u' && i + 6 <= to && HEX4.test(src.slice(i + 2, i + 6))) { out.push(String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16))); i += 6; continue; }
        }
        out.push(src[i]);
        i++;
    }
    starts.push(at(to));
    return { decoded: out.join(''), starts };
}

const evenRunBefore = (src: string, i: number, from: number) => {
    let run = 0;
    while (i - run - 1 >= from && src[i - run - 1] === '\\') run++;
    return run % 2 === 0;
};

/** The strings of `src[from, to)`: pairs of an opening quote and its closing quote, and the first quote left open, or -1. */
function strings(src: string, from: number, to: number): { pairs: Array<[number, number]>; unresolved: number } {
    const pairs: Array<[number, number]> = [];
    for (let i = from; i < to; i++) {
        if (src[i] !== '"' || !evenRunBefore(src, i, from)) continue;
        let j = i + 1;
        while (j < to && src[j] !== '"') j += src[j] === '\\' ? 2 : 1;
        if (j >= to) return { pairs, unresolved: i };
        pairs.push([i, j]);
        i = j;
    }
    return { pairs, unresolved: -1 };
}

/**
 * Whether an unmatched quote opens a value after `:`, `[` or `,`, or starts a decoded parent with optional whitespace.
 * A stray inch mark or an unbalanced quote in prose opens nothing, so it never decides where later evidence ends.
 */
function opensValue(src: string, at: number, inParent: boolean): boolean {
    if (at < 0) return false;
    let i = at - 1;
    while (i >= 0 && /\s/.test(src[i])) i--;
    return i < 0 ? inParent : ':[,'.includes(src[i]);
}

export class JsonLayers {
    /** Every established string, ordered by where its content starts. */
    private readonly all: LayerString[] = [];
    private rootUnresolved = -1;

    constructor(readonly text: string) {
        const pending: Array<{ src: string; from: number; to: number; at: (i: number) => number; parent: LayerString | null }> = [
            { src: text, from: 0, to: text.length, at: i => i, parent: null },
        ];
        for (let next = pending.pop(); next; next = pending.pop()) {
            const { src, from, to, at, parent } = next;
            const found = strings(src, from, to);
            const unresolved = opensValue(src, found.unresolved, parent !== null) ? found.unresolved : -1;
            if (parent) parent.unresolved = unresolved;
            else this.rootUnresolved = unresolved;
            for (const [open, close] of found.pairs) {
                const { decoded, starts } = decode(src, open + 1, close, at);
                const string: LayerString = { depth: (parent?.depth ?? 0) + 1, start: at(open + 1), end: at(close), decoded, starts, parent, unresolved: -1 };
                this.all.push(string);
                pending.push({ src: decoded, from: 0, to: decoded.length, at: i => starts[i], parent: string });
            }
        }
        this.all.sort((a, b) => a.start - b.start);
    }

    /** The innermost established string whose content holds `offset`, or null outside every string. */
    at(offset: number): LayerString | null {
        let low = 0, high = this.all.length - 1, found = -1;
        while (low <= high) {
            const mid = (low + high) >> 1;
            if (this.all[mid].start <= offset) { found = mid; low = mid + 1; } else high = mid - 1;
        }
        for (let string: LayerString | null = found < 0 ? null : this.all[found]; string; string = string.parent) {
            if (offset >= string.start && offset < string.end) return string;
        }
        return null;
    }

    /** The depth of the string holding `offset`: 0 outside every string. */
    depth(offset: number): number {
        return this.at(offset)?.depth ?? 0;
    }

    /** Whether this offset lies after a source-level quote that opens a JSON string value and is never closed. */
    rootUnresolvedAt(offset: number): boolean {
        return this.rootUnresolved >= 0 && this.rootUnresolved < offset;
    }
}

/** The decoded index of the character of `string` that `offset` falls in. */
export function decodedIndex(string: LayerString, offset: number): number {
    let low = 0, high = string.starts.length - 1, found = 0;
    while (low <= high) {
        const mid = (low + high) >> 1;
        if (string.starts[mid] <= offset) { found = mid; low = mid + 1; } else high = mid - 1;
    }
    return Math.min(found, string.decoded.length);
}

/** Whether `offset` lies after a quote that opens a string the text never closes, inside `string`. */
export const unresolvedAt = (string: LayerString, offset: number) => string.unresolved >= 0 && offset >= string.starts[string.unresolved];

/** How a double quote is written at `depth`: the delimiter of a string one level down from text at that depth. */
export const quoteAt = (depth: number) => '\\'.repeat(2 ** depth - 1) + '"';
