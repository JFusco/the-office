import { bareValue, deeperValueEnd, queryValue, separatorEscapeAt } from './bare-value';
import { AFTER_LABEL, BARE_LABEL, CREDENTIAL_NAME, KEY, NEXT_LABEL, PROPERTY, QUOTED_LABEL } from './credential-patterns';
import { decodedIndex, type JsonLayers, type LayerString, quoteAt, unresolvedAt } from './json-layers';
import { nonStringValueEnd } from './json-value';

/** Text to replace before the shared sanitizer runs: `[start, end)` of the original text, and what stands there instead. */
export interface Span { start: number; end: number; replacement: string }

// A quote escaped n times (n = 0, 1, 3, 7… in JSON inside JSON) is closed by the same quote after
// n + k·2(n + 1) backslashes, which for an unescaped quote is any even run. A run that is not n modulo n + 1
// belongs to an enclosing string, so the value ends before it. A saved fragment may end mid-value or mid-escape.
const OPEN = String.raw`(?<open>(?<run>(?:\\(?:\\\\)*)?)(?<quote>["']))`;
const quotedCredential = (json: boolean) => {
    // A quote right after another credential label opens that label's value, so it does not end this one.
    // In JSON text an unescaped quote is certain, so only an escaped one is checked.
    const notLabel = json ? String.raw`(?:(?!\\)|(?!${AFTER_LABEL}))` : String.raw`(?!${AFTER_LABEL})`;
    const close = String.raw`(?<!\\)${notLabel}(?:\k<run>\k<run>\\\\)*\k<run>\k<quote>`;
    // In JSON text an unescaped double quote also ends a single-quoted value: it closes the string that holds it.
    const enclosing = String.raw`(?<!\\)${notLabel}(?:\k<run>\\)*(?!\k<run>)\\*\k<quote>${json ? String.raw`|(?<!\\)(?:\\\\)*"` : ''}`;
    return new RegExp(String.raw`(?<prefix>${PROPERTY}|${QUOTED_LABEL})${OPEN}(?:[^\\"']+|(?!${close}|${enclosing})[\s\S])*(?:${close}|(?=${enclosing})|$)`, 'gi');
};
const QUOTED_CREDENTIAL = quotedCredential(false);
const QUOTED_CREDENTIAL_IN_JSON = quotedCredential(true);
const NON_STRING_KEY = new RegExp(KEY, 'gi');
const BARE = new RegExp(BARE_LABEL, 'gi');
const NAME = new RegExp(`(?:${CREDENTIAL_NAME})`, 'iy');
const NEXT = new RegExp(NEXT_LABEL, 'iy');
const LABEL_BEFORE = new RegExp(AFTER_LABEL, 'iy');
/** Whole Authorization and Cookie fields are the shared sanitizer's: no edit here may split one. */
const RESERVED = /(?:authorization|cookie)(?:\s|\\+[tnr])*[=:]\s*$/i;
/** Labels whose bare value the shared sanitizer already takes whole, up to a newline, comma, brace or quote. */
const SHARED = /(?:password|api[_-]?key|secret|authorization|cookie|connection[_-]?string)\s*[=:]\s*$/i;
/** Query parameters the shared sanitizer takes whole, up to a raw `&`, whitespace or quote. */
const QUERY = /^(?:token|sig|key|secret|code|access_token|client_secret|password)=$/i;

/**
 * Whether every backslash in `[from, to)` writes a tab, CR or LF at the depth of the text holding it: a gap that the
 * pattern found, which only the text's layers can tell from literal backslashes.
 */
function genuineGap(text: string, layers: JsonLayers, from: number, to: number): boolean {
    for (let i = from; i < to; i++) {
        if (text[i] !== '\\') continue;
        let run = 0;
        while (text[i + run] === '\\') run++;
        const string = layers.at(i);
        if (string) {
            const index = decodedIndex(string, i);
            if (string.starts[index] !== i || string.starts[index + 1] !== i + run + 1 || !/[\t\n\r]/.test(string.decoded[index])) return false;
        } else if (run !== 1) return false;
        i += run;
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

/**
 * Where a single-quoted value inside a JSON string ends, at that string's own depth: on an apostrophe after an even run
 * of decoded backslashes (a written `\` counting as one) that does not follow another label. Inside a string the
 * text opens but never closes, no apostrophe can be trusted, so the value runs to the end of the string that holds it.
 */
function apostropheEnd(text: string, string: LayerString, from: number): { end: number; closed: boolean } {
    if (unresolvedAt(string, from)) return { end: string.end, closed: false };
    let run = 0;
    for (let i = decodedIndex(string, from); i < string.decoded.length; i++) {
        const char = string.decoded[i];
        if (char === '\\') { run++; continue; }
        if (char === "'" && run % 2 === 0) {
            LABEL_BEFORE.lastIndex = string.starts[i];
            if (!LABEL_BEFORE.test(text)) return { end: string.starts[i + 1], closed: true };
        }
        run = 0;
    }
    return { end: string.end, closed: false };
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

/** The spans sorted by start, keeping the earlier of two that overlap and dropping one inside another. */
function ordered(spans: Span[]): Span[] {
    const kept: Span[] = [];
    for (const span of spans.sort((a, b) => a.start - b.start || b.end - a.end)) {
        if (kept.length && span.start < kept[kept.length - 1].end) continue;
        kept.push(span);
    }
    return kept;
}

function quotedSpans(text: string, layers: JsonLayers, json: boolean, taken: Span[]): Span[] {
    const spans: Span[] = [];
    const pattern = json ? QUOTED_CREDENTIAL_IN_JSON : QUOTED_CREDENTIAL;
    pattern.lastIndex = 0;
    let t = 0;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
        const { prefix, open, quote, nameRun } = match.groups as { prefix: string; open: string; quote: string; nameRun?: string };
        while (t < taken.length && taken[t].end <= match.index) t++;
        if (t < taken.length && taken[t].start <= match.index) { pattern.lastIndex = taken[t].end; continue; }
        if (!genuineGap(text, layers, nameEnd(text, match.index, nameRun !== undefined), match.index + prefix.length)) { pattern.lastIndex = match.index + 1; continue; }
        // In JSON text a bare label lies inside a string, so a plain double quote right after it closes that string.
        // Only the label is hidden, so the shared sanitizer leaves it alone too.
        if (nameRun === undefined && open === '"' && json) {
            spans.push({ start: match.index, end: match.index + prefix.length, replacement: prefix });
            continue;
        }
        const valueStart = match.index + prefix.length + open.length;
        const string = quote === "'" ? layers.at(valueStart - 1) : null;
        const end = string ? apostropheEnd(text, string, valueStart).end : match.index + match[0].length;
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
 * separator, gap or escape decides where it starts or ends. Every other bare value is left to the rule after the
 * shared sanitizer, as before. Whole Authorization and Cookie fields are never touched here.
 */
function bareSpans(text: string, layers: JsonLayers, taken: Span[]): Span[] {
    const spans: Span[] = [];
    BARE.lastIndex = 0;
    let t = 0;
    for (let match = BARE.exec(text); match; match = BARE.exec(text)) {
        const label = match[0], start = match.index, valueStart = start + label.length;
        while (t < taken.length && taken[t].end <= start) t++;
        if (t < taken.length && taken[t].start <= start) { BARE.lastIndex = taken[t].end; continue; }
        if (!genuineGap(text, layers, nameEnd(text, start, false), valueStart)) { BARE.lastIndex = start + 1; continue; }
        const reserved = RESERVED.test(label);
        if (!reserved && nextAssignmentAt(text, layers, valueStart, /\s$/.test(label))) {
            spans.push({ start, end: valueStart, replacement: label });
            continue;
        }
        if (reserved) continue;
        const limit = Math.min(t < taken.length ? taken[t].start : text.length, layers.at(valueStart)?.end ?? text.length);
        const query = '?&'.includes(text[start - 1] ?? '') && start > 0 && QUERY.test(label);
        const value = query ? queryValue(text, layers, valueStart, limit) : bareValue(text, layers, valueStart, limit);
        if (!value) continue;
        const string = layers.at(valueStart);
        const deeper = string && unresolvedAt(string, valueStart)
            ? deeperValueEnd(text, layers, valueStart, limit, at => nextAssignmentAt(text, layers, at, true)) : -1;
        const end = Math.max(value.end, deeper);
        const layered = text.slice(start, end).includes('\\') || value.endsAtEscape;
        if (query || SHARED.test(label) ? !value.endsAtEscape : !layered) continue;
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
