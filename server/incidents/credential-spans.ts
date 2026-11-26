import { BEARER_CREDENTIAL, HEADER_OPERAND, POSTGRES_URL } from '../office/security';
import { bareValue, deeperValueEnd, queryValue, separatorEscapeAt } from './bare-value';
import { AFTER_LABEL, BARE_LABEL, CREDENTIAL_NAME, GAP, GAP_ESCAPE, KEY, NEXT_LABEL, PROPERTY, QUOTED_LABEL, URL_USERINFO } from './credential-patterns';
import { decodedIndex, type JsonLayers, type LayerString, quoteAt, unresolvedAt } from './json-layers';
import { nonStringValueEnd } from './json-value';

/** Text to replace before the shared sanitizer runs: `[start, end)` of the original text, and what stands there instead. */
export interface Span { start: number; end: number; replacement: string }

const OPEN = String.raw`(?<open>(?<run>(?:\\(?:\\\\)*)?)(?<quote>["']))`;
const QUOTED_CREDENTIAL = new RegExp(String.raw`(?<prefix>${PROPERTY}|${QUOTED_LABEL})${OPEN}`, 'gi');
const QUOTE = /(?<!\\)\\*["']/g;
const NON_STRING_KEY = new RegExp(KEY, 'gi');
const BARE = new RegExp(BARE_LABEL, 'gi');
const NAME = new RegExp(`(?:${CREDENTIAL_NAME})`, 'iy');
const NEXT = new RegExp(NEXT_LABEL, 'iy');
const LABEL_BEFORE = new RegExp(AFTER_LABEL, 'iy');
const WRITTEN_GAP = new RegExp(GAP_ESCAPE, 'y');
/** Whole Authorization and Cookie fields are the shared sanitizer's: no edit here may split one. */
const RESERVED = new RegExp(String.raw`(?:authorization|cookie)${GAP}[=:]\s*$`, 'i');
const HEADER_VALUE = new RegExp(HEADER_OPERAND, 'y');
/** Labels whose bare value the shared sanitizer already takes whole, up to a newline, comma, brace or quote. */
const SHARED = /(?:password|api[_-]?key|secret|authorization|cookie|connection[_-]?string)\s*[=:]\s*$/i;
/** Query parameters the shared sanitizer takes whole, up to a raw `&`, whitespace or quote. */
const QUERY = /^(?:token|sig|key|secret|code|access_token|client_secret|password)=$/i;

/**
 * Whether every backslash in `[from, to)` writes a tab, CR or LF at the depth of the text holding it: a gap that the
 * pattern found, which only the text's layers can tell from literal backslashes.
 */
function genuineGap(text: string, layers: JsonLayers, from: number, to: number, containing?: LayerString | null): boolean {
    for (let i = from; i < to; i++) {
        if (text[i] !== '\\') continue;
        WRITTEN_GAP.lastIndex = i;
        if (!WRITTEN_GAP.test(text) || WRITTEN_GAP.lastIndex > to) return false;
        const escapeEnd = WRITTEN_GAP.lastIndex;
        const string = containing === undefined ? layers.at(i) : containing;
        if (string) {
            const index = decodedIndex(string, i);
            if (string.starts[index] !== i || string.starts[index + 1] !== escapeEnd || !/[\t\n\r]/.test(string.decoded[index])) return false;
        } else if (text[i + 1] === '\\') return false;
        i = escapeEnd - 1;
    }
    return true;
}

/** Where the label's name ends, so its gap can be checked: after the name, and after a property name's closing quote. */
function nameEnd(text: string, at: number, property: boolean): number {
    NAME.lastIndex = at;
    let end = at + (NAME.exec(text)?.[0].length ?? 0);
    if (property) {
        while (text[end] === '\\') end++;
        end++;
    }
    return end;
}

function labelBefore(text: string, layers: JsonLayers, at: number, containing: LayerString | null): boolean {
    LABEL_BEFORE.lastIndex = at;
    const match = LABEL_BEFORE.exec(text);
    return match !== null && genuineGap(text, layers, at - match[1].length, at, containing);
}

/**
 * Close on an apostrophe after an even run of decoded backslashes unless it opens another assignment.
 * For an unresolved string, use the established enclosing delimiter.
 */
function apostropheEnd(text: string, layers: JsonLayers, string: LayerString, from: number): number {
    if (unresolvedAt(string, from)) return string.end;
    let run = 0;
    for (let i = decodedIndex(string, from); i < string.decoded.length; i++) {
        const char = string.decoded[i];
        if (char === '\\') { run++; continue; }
        if (char === "'" && run % 2 === 0 && !labelBefore(text, layers, string.starts[i], string)) return string.starts[i + 1];
        run = 0;
    }
    return string.end;
}

/** A quote opened with n backslashes closes after n + k·2(n + 1) backslashes. */
function quotedEnd(text: string, layers: JsonLayers, json: boolean, from: number, quote: string, n: number, containing: LayerString | null): number {
    QUOTE.lastIndex = from;
    for (let match = QUOTE.exec(text); match; match = QUOTE.exec(text)) {
        const run = match[0].length - 1, at = match.index, char = text[at + run];
        if (char === quote && ((json && run === 0) || !labelBefore(text, layers, at, containing))) {
            if (run % (2 * (n + 1)) === n) return QUOTE.lastIndex;
            if (run % (n + 1) !== n) return at;
        }
        if (json && char === '"' && run % 2 === 0) return at;
    }
    return text.length;
}

/** Whether another credential assignment follows `at`, after real separation and any escapes and indentation at its depth. */
function nextAssignmentAt(text: string, layers: JsonLayers, at: number, separated: boolean): boolean {
    let i = at;
    for (;;) {
        const escape = separatorEscapeAt(text, layers, i);
        if (escape) { i += escape; separated = true; continue; }
        if (separated && (text[i] === ' ' || text[i] === '\t')) { i++; continue; }
        break;
    }
    if (!separated) return false;
    NEXT.lastIndex = i;
    const next = NEXT.exec(text);
    return !!next && genuineGap(text, layers, i, i + next[0].length);
}

/** Sort by start and cover the union of overlapping spans with the first replacement. */
function ordered(spans: Span[]): Span[] {
    const kept: Span[] = [];
    for (const span of spans.sort((a, b) => a.start - b.start || b.end - a.end)) {
        const last = kept[kept.length - 1];
        if (last && span.start < last.end) last.end = Math.max(last.end, span.end);
        else kept.push(span);
    }
    return kept;
}

function quotedSpans(text: string, layers: JsonLayers, json: boolean, taken: Span[]): Span[] {
    const spans: Span[] = [];
    const pattern = QUOTED_CREDENTIAL;
    pattern.lastIndex = 0;
    let t = 0;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
        const { prefix, open, run, quote, nameRun } = match.groups as { prefix: string; open: string; run: string; quote: string; nameRun?: string };
        while (t < taken.length && taken[t].end <= match.index) t++;
        if (t < taken.length && taken[t].start <= match.index) { pattern.lastIndex = taken[t].end; continue; }
        const openStart = match.index + prefix.length;
        if (!genuineGap(text, layers, nameEnd(text, match.index, nameRun !== undefined), openStart)) { pattern.lastIndex = match.index + 1; continue; }
        // A bare label may end at its containing string's closing delimiter.
        if (nameRun === undefined && layers.at(match.index)?.end === openStart) {
            spans.push({ start: match.index, end: openStart, replacement: prefix });
            pattern.lastIndex = openStart;
            continue;
        }
        const valueStart = openStart + open.length;
        const string = layers.at(openStart);
        let end: number;
        if (quote === "'" && string) end = apostropheEnd(text, layers, string, valueStart);
        else if (quote === "'" && layers.rootUnresolvedAt(openStart)) end = text.length;
        else end = quotedEnd(text, layers, json, valueStart, quote, run.length, string);
        spans.push({ start: match.index, end, replacement: `${prefix}${open}[redacted]${open}` });
        pattern.lastIndex = Math.max(end, match.index + 1);
    }
    return spans;
}

function nonStringSpans(text: string, layers: JsonLayers): Span[] {
    const spans: Span[] = [];
    NON_STRING_KEY.lastIndex = 0;
    for (let match = NON_STRING_KEY.exec(text); match; match = NON_STRING_KEY.exec(text)) {
        const start = match.index + match[0].length;
        if (!genuineGap(text, layers, nameEnd(text, match.index, true), start)) { NON_STRING_KEY.lastIndex = match.index + 1; continue; }
        const end = nonStringValueEnd(text, layers, start);
        if (end === null) continue;
        const quote = quoteAt(layers.depth(start));
        spans.push({ start, end, replacement: `${quote}[redacted]${quote}` });
        NON_STRING_KEY.lastIndex = end;
    }
    return spans;
}

/**
 * Bare assignments whose edit depends on the text's layers: a label with nothing after it but the next assignment,
 * hidden so the shared sanitizer cannot take that label as a value; and a value read at its depth, where a written
 * separator, gap or escape decides where it starts or ends. Use the shared operand boundaries when an edit would
 * hide a shared rule's match or when a whole header has a serialized gap the shared rule cannot match.
 */
function bareSpans(text: string, layers: JsonLayers, taken: Span[]): Span[] {
    const spans: Span[] = [];
    const urls = text.matchAll(URL_USERINFO);
    const sharedOperands = [BEARER_CREDENTIAL, POSTGRES_URL].map(pattern => {
        const matches = text.matchAll(pattern);
        return { matches, next: matches.next() };
    });
    let url = urls.next();
    let unescaped: { end: number; limit: number; string: LayerString | null } | undefined;
    BARE.lastIndex = 0;
    let t = 0;
    for (let match = BARE.exec(text); match; match = BARE.exec(text)) {
        const label = match[0], start = match.index, valueStart = start + label.length;
        while (t < taken.length && taken[t].end <= start) t++;
        if (t < taken.length && taken[t].start <= start) { BARE.lastIndex = taken[t].end; continue; }
        if (!genuineGap(text, layers, nameEnd(text, start, false), valueStart)) { BARE.lastIndex = start + 1; continue; }
        if (RESERVED.test(label)) {
            if (!label.includes('\\')) continue;
            HEADER_VALUE.lastIndex = valueStart;
            if (!HEADER_VALUE.test(text)) continue;
            const end = Math.min(HEADER_VALUE.lastIndex, layers.at(start)?.end ?? text.length);
            if (end > valueStart) {
                spans.push({ start, end, replacement: `${label}[redacted]` });
                BARE.lastIndex = end;
            }
            continue;
        }
        if (nextAssignmentAt(text, layers, valueStart, /\s$/.test(label))) {
            spans.push({ start, end: valueStart, replacement: label });
            continue;
        }
        const string = layers.at(valueStart);
        const limit = Math.min(t < taken.length ? taken[t].start : text.length, string?.end ?? text.length);
        const query = '?&'.includes(text[start - 1] ?? '') && start > 0 && QUERY.test(label);
        // A later label inside an ordinary unescaped operand reaches the same boundary. Query operands still need
        // their own measurement, and the quoted-span limit and containing layer have to agree.
        if (!query && unescaped && valueStart < unescaped.end && limit === unescaped.limit && string === unescaped.string) continue;
        const value = query ? queryValue(text, layers, valueStart, limit) : bareValue(text, layers, valueStart, limit);
        if (!value) continue;
        const deeper = string && unresolvedAt(string, valueStart)
            ? deeperValueEnd(text, layers, valueStart, limit, at => nextAssignmentAt(text, layers, at, true)) : -1;
        let end = Math.max(value.end, deeper);
        const layered = text.slice(start, end).includes('\\') || value.endsAtEscape;
        if (!query && !layered) unescaped = { end, limit, string };
        const needsSpan = query ? value.endsAtEscape || !!separatorEscapeAt(text, layers, valueStart)
            : SHARED.test(label) ? value.endsAtEscape : layered;
        if (!needsSpan) continue;

        while (!url.done && url.value.index + url.value[0].length <= start) url = urls.next();
        if (!url.done) {
            const userinfoStart = url.value.index + url.value[1].length;
            const at = url.value.index + url.value[0].length - 1;
            if (userinfoStart <= start && start < at && at < end) {
                spans.push({ start: userinfoStart, end: at, replacement: '[redacted]' });
                BARE.lastIndex = at + 1;
                continue;
            }
        }
        // A placeholder covering the start of either scheme makes the shared rule miss the remaining operand.
        // An extension can bring the start of another shared operand into the span.
        let previousEnd: number;
        do {
            previousEnd = end;
            for (const cursor of sharedOperands) {
                while (!cursor.next.done && cursor.next.value.index < end) {
                    const match = cursor.next.value;
                    if (match.index >= valueStart) end = Math.max(end, Math.min(match.index + match[0].length, string?.end ?? text.length));
                    cursor.next = cursor.matches.next();
                }
            }
        } while (end > previousEnd);
        spans.push({ start, end, replacement: `${label}[redacted]` });
        BARE.lastIndex = end;
    }
    return spans;
}

/**
 * Every edit chosen on the original text before the shared sanitizer runs, in one forward sweep of it: complete
 * non-string values of credential properties, quoted credential values, and the bare assignments whose edit depends on
 * the text's layers. Spans never overlap; an enclosing value keeps what is inside it.
 */
export function credentialSpans(text: string, layers: JsonLayers, json: boolean): Span[] {
    const values = ordered(nonStringSpans(text, layers));
    const quoted = ordered([...values, ...quotedSpans(text, layers, json, values)]);
    return ordered([...quoted, ...bareSpans(text, layers, quoted)]);
}
