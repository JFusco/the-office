import { BEARER_CREDENTIAL, HEADER_OPERAND, HEADER_PREFIX, POSTGRES_URL, QUERY_PREFIX } from '../office/security';
import { bareValue, deeperValueEnd, queryValue, separatorEscapeAt } from './bare-value';
import { AFTER_LABEL, BARE_LABEL, CREDENTIAL_NAME, GAP, GAP_ESCAPE, KEY, NAME_START, NEXT_LABEL, PROPERTY, QUOTED_LABEL, URL_USERINFO } from './credential-patterns';
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
const RESERVED_PREFIX = String.raw`(?:authorization|cookie)${GAP}[=:]\s*`;
const RESERVED = new RegExp(RESERVED_PREFIX + '$', 'i');
const HEADER_VALUE = new RegExp(HEADER_OPERAND, 'y');
/** Labels whose bare value the shared sanitizer already takes whole, up to a newline, comma, brace or quote. */
const SHARED = new RegExp(HEADER_PREFIX + '$', 'i');
const SHARED_HEADER = new RegExp(`${HEADER_PREFIX}|${NAME_START}${RESERVED_PREFIX}`, 'gi');
/** Query parameters the shared sanitizer takes whole, up to a raw `&`, whitespace or quote. */
const SHARED_QUERY = new RegExp(QUERY_PREFIX, 'gi');
const QUERY = new RegExp(QUERY_PREFIX, 'iy');

function isQueryLabel(text: string, start: number, valueStart: number): boolean {
    if (start === 0 || (text[start - 1] !== '?' && text[start - 1] !== '&')) return false;
    QUERY.lastIndex = start - 1;
    return QUERY.test(text) && QUERY.lastIndex === valueStart;
}

/** Measure the shared header operand with already selected spans treated as opaque values. */
function headerValueEnd(text: string, start: number, limit: number, taken: Span[], index: number): number {
    let end = start;
    while (end < limit) {
        HEADER_VALUE.lastIndex = end;
        if (HEADER_VALUE.test(text)) end = Math.min(HEADER_VALUE.lastIndex, limit);
        while (index < taken.length && taken[index].end <= end) index++;
        if (index === taken.length || taken[index].start > end) break;
        end = Math.min(taken[index++].end, limit);
    }
    return end;
}

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
    const matchCursor = (pattern: RegExp) => {
        const matches = text.matchAll(pattern);
        return { pattern, matches, next: matches.next() };
    };
    const url = matchCursor(URL_USERINFO);
    const sharedOperands = [matchCursor(SHARED_QUERY), url, matchCursor(BEARER_CREDENTIAL),
        matchCursor(POSTGRES_URL), matchCursor(SHARED_HEADER)];
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
            const end = headerValueEnd(text, valueStart, layers.at(start)?.end ?? text.length, taken, t);
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
        const query = isQueryLabel(text, start, valueStart);
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

        while (!url.next.done && url.next.value.index + url.next.value[0].length <= start) url.next = url.matches.next();
        if (!url.next.done) {
            const userinfoStart = url.next.value.index + url.next.value[1].length;
            const at = url.next.value.index + url.next.value[0].length - 1;
            if (userinfoStart <= start && start < at && at < end) {
                spans.push({ start: userinfoStart, end: at, replacement: '[redacted]' });
                BARE.lastIndex = at + 1;
                continue;
            }
        }
        // Cover the rest of any shared operand whose introducer this edit would hide.
        let overlapLimit = query && (value.endsAtEscape || text[end] === '&') ? end : string?.end ?? text.length;
        let previousEnd: number;
        do {
            previousEnd = end;
            for (const cursor of sharedOperands) {
                while (!cursor.next.done && cursor.next.value.index < end) {
                    const match = cursor.next.value;
                    const operandStart = match.index + match[0].length;
                    // Keep the active URL available for later assignments within its userinfo.
                    if (cursor === url && match.index < valueStart && operandStart > end) break;
                    cursor.next = cursor.matches.next();
                    if (match.index < valueStart) continue;
                    let operandEnd = operandStart;
                    if (cursor.pattern === SHARED_QUERY) {
                        const operand = queryValue(text, layers, operandStart, limit);
                        if (!operand) continue;
                        operandEnd = operand.end;
                        if (operandEnd >= end && (operand.endsAtEscape || text[operandEnd] === '&')) {
                            overlapLimit = Math.min(overlapLimit, operandEnd);
                        }
                    } else if (cursor.pattern === SHARED_HEADER) {
                        if (isQueryLabel(text, match.index, operandStart)) continue;
                        if (!genuineGap(text, layers, match.index, operandStart)) continue;
                        operandEnd = headerValueEnd(text, operandStart, overlapLimit, taken, t);
                        if (operandEnd === operandStart) continue;
                    } else if (cursor.pattern === URL_USERINFO) {
                        // The bare assignment contains the URL. Resume its operand after the userinfo.
                        operandEnd = bareValue(text, layers, operandStart, limit)?.end ?? operandStart;
                    }
                    const coveredEnd = Math.min(operandEnd, overlapLimit);
                    end = Math.max(end, coveredEnd);
                    if (cursor.pattern === SHARED_QUERY || cursor.pattern === SHARED_HEADER) {
                        // A label inside this operand is data. Do not measure the same suffix again.
                        while (!cursor.next.done && cursor.next.value.index < coveredEnd) cursor.next = cursor.matches.next();
                    }
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
