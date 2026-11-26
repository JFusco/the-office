import { decodedIndex, type JsonLayers } from './json-layers';

/** One character of the text at the depth that holds it: decoded inside a JSON string, an escape pair in plain text. */
interface Unit { start: number; end: number; char: string; escaped: boolean }

const SIMPLE: Readonly<Record<string, string>> = { '"': '"', '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' };
const HEX4 = /^[\dA-Fa-f]{4}$/;
/** ECMAScript whitespace, or a control character. */
export const isSeparator = (char: string) => /\s/.test(char) || /[\u0000-\u001f\u007f]/.test(char);
const ENDS = new Set(['&', ',', ';', '}', '"', "'"]);

/** The escape that starts at `at` in plain text, if any: what it stands for and how long it is. */
function plainEscape(text: string, at: number): { char: string; length: number } | null {
    if (text[at] !== '\\' || at + 1 >= text.length) return null;
    const simple = SIMPLE[text[at + 1]];
    if (simple !== undefined) return { char: simple, length: 2 };
    if (text[at + 1] === 'u' && HEX4.test(text.slice(at + 2, at + 6))) return { char: String.fromCharCode(parseInt(text.slice(at + 2, at + 6), 16)), length: 6 };
    return null;
}

/** The units from `from` up to `limit`, at the depth of the string holding `from`. */
function* unitsFrom(text: string, layers: JsonLayers, from: number, limit: number): Generator<Unit> {
    const string = layers.at(from);
    if (string) {
        for (let i = decodedIndex(string, from); i < string.decoded.length && string.starts[i] < limit; i++) {
            yield { start: string.starts[i], end: string.starts[i + 1], char: string.decoded[i], escaped: text[string.starts[i]] === '\\' };
        }
        return;
    }
    for (let i = from; i < limit;) {
        const escape = plainEscape(text, i);
        // A backslash before anything else is text, and the character after it is read on its own.
        const unit = escape ? { start: i, end: i + escape.length, char: escape.char, escaped: true } : { start: i, end: i + 1, char: text[i], escaped: false };
        yield unit;
        i = unit.end;
    }
}

/** How long the separator escape at `at` is, at the depth of the text holding it, or 0: a written space, tab, newline or control character. */
export function separatorEscapeAt(text: string, layers: JsonLayers, at: number): number {
    if (text[at] !== '\\') return 0;
    const string = layers.at(at);
    if (!string) {
        const escape = plainEscape(text, at);
        return escape && isSeparator(escape.char) ? escape.length : 0;
    }
    const index = decodedIndex(string, at);
    return string.starts[index] === at && isSeparator(string.decoded[index]) ? string.starts[index + 1] - at : 0;
}

export interface BareValue {
    /** Source offset after the value's last character. */
    end: number;
    /** Whether the value ends at a separator written as an escape at its depth. */
    endsAtEscape: boolean;
}

/**
 * The bare value that starts at `start`. Separator escapes and the indentation after them at its start are part of
 * it; after its first character, a separator (raw or written at its depth) or one of `& , ; } " '` ends it, and a
 * printable escape or a literal backslash stays in it. Null when nothing is left for a value.
 */
export function bareValue(text: string, layers: JsonLayers, start: number, limit: number): BareValue | null {
    const units = unitsFrom(text, layers, start, limit);
    let unit = units.next().value;
    while (unit && unit.escaped && isSeparator(unit.char)) {
        unit = units.next().value;
        while (unit && !unit.escaped && (unit.char === ' ' || unit.char === '\t')) unit = units.next().value;
    }
    let end = -1;
    for (; unit && !isSeparator(unit.char); unit = units.next().value) {
        if (ENDS.has(unit.char) && (!unit.escaped || unit.char === '"')) break;
        end = unit.end;
    }
    if (end < 0) return null;
    return { end, endsAtEscape: !!unit && unit.escaped && isSeparator(unit.char) };
}

/**
 * The value of a query parameter the shared sanitizer would also read. It includes leading serialized separators
 * and indentation, then escape pairs as data up to a separator escape at its depth, a raw `&`, whitespace or a quote.
 */
export function queryValue(text: string, layers: JsonLayers, start: number, limit: number): BareValue | null {
    let i = start;
    for (let gap = separatorEscapeAt(text, layers, i); gap && i + gap <= limit; gap = separatorEscapeAt(text, layers, i)) {
        i += gap;
        while (i < limit && (text[i] === ' ' || text[i] === '\t')) i++;
    }
    let end = -1;
    for (; i < limit;) {
        if (text[i] === '\\') {
            if (separatorEscapeAt(text, layers, i)) return end < 0 ? null : { end, endsAtEscape: true };
            end = Math.min(i + 2, limit);
            i += 2;
            continue;
        }
        if (text[i] === '&' || text[i] === '"' || text[i] === "'" || /\s/.test(text[i])) break;
        end = ++i;
    }
    return end < 0 ? null : { end, endsAtEscape: false };
}

/**
 * Where the value would end if the escape at its start belonged one depth further in, for an assignment inside a
 * string the text opens but never closes: a written separator and its indentation, then the value read as usual.
 */
export function deeperValueEnd(text: string, layers: JsonLayers, start: number, limit: number, isLabel: (at: number) => boolean): number {
    const string = layers.at(start);
    if (!string) return -1;
    let i = decodedIndex(string, start), deeper = false;
    for (;;) {
        const escape = plainEscape(string.decoded, i);
        if (!escape || !isSeparator(escape.char)) break;
        i += escape.length;
        deeper = true;
        while (string.decoded[i] === ' ' || string.decoded[i] === '\t') i++;
    }
    if (!deeper || i >= string.decoded.length) return -1;
    const at = string.starts[i];
    if (isLabel(at)) return -1;
    return bareValue(text, layers, at, limit)?.end ?? -1;
}
