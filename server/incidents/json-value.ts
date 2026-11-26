import { decodedIndex, type JsonLayers } from './json-layers';

const SCALAR = /[-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?(?![\w.])|(?:true|false|null)(?![\w$])/y;

/**
 * Where a non-string JSON value that starts at `start` ends, as a source offset: a complete number, `true`, `false` or
 * `null`, or an object or array through its matching bracket. A cut container ends where the string holding it does, or
 * at the end of the text. A quoted, missing or other start is null: it is not this value's to replace.
 *
 * The value is read at the depth of the text holding it, decoded there: either quote character opens a string, only its
 * matching unescaped quote closes it, and brackets inside a string are data.
 */
export function nonStringValueEnd(text: string, layers: JsonLayers, start: number): number | null {
    const string = layers.at(start);
    const content = string ? string.decoded : text;
    const from = string ? decodedIndex(string, start) : start;
    if (string && string.starts[from] !== start) return null;
    const source = (index: number) => string ? (index >= string.decoded.length ? string.end : string.starts[index]) : index;
    SCALAR.lastIndex = from;
    const scalar = SCALAR.exec(content);
    if (scalar) return source(from + scalar[0].length);
    if (content[from] !== '{' && content[from] !== '[') return null;
    let depth = 0, quote = '';
    for (let i = from; i < content.length; i++) {
        const char = content[i];
        if (quote) {
            if (char === '\\') i++;
            else if (char === quote) quote = '';
        } else if (char === '"' || char === "'") quote = char;
        else if (char === '{' || char === '[') depth++;
        else if ((char === '}' || char === ']') && --depth === 0) return source(i + 1);
    }
    return source(content.length);
}
