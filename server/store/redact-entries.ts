import { sanitizeObject } from '../office/security';

/** One entry of an object as last redacted: its serialised text and the redacted text stored for it. */
export interface RedactedEntry { raw: string; redacted: string }
export interface RedactedEntries { redacted: string; entries: Map<string, RedactedEntry>; chars: number }

/** A serialised key shorter than this is redacted whole: splitting it costs more than it saves. */
export const LARGE_KEY_CHARS = 100_000;

const plain = (value: unknown): value is Record<string, unknown> => {
    if (typeof value !== 'object' || value === null) return false;
    const prototype: unknown = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
};

/**
 * The redacted text of a plain object, redacting only the entries whose serialised text differs from `before`
 * and reusing the remembered redacted text of the rest. Redaction changes each string value on its own
 * (`security.ts`), so the entries joined are exactly what redacting the whole object gives.
 *
 * `raw` is the text already serialised for `value`. Returns undefined, for the caller to redact `raw` whole,
 * when `value` is not a plain object, has a `toJSON` of its own (which would also run for the one-entry wrapper
 * used here), or its entries serialised one at a time are not exactly `raw` (a value that changes between two
 * reads). `chars` counts the text actually redacted.
 */
export function redactEntries(value: unknown, raw: string, before?: ReadonlyMap<string, RedactedEntry>): RedactedEntries | undefined {
    if (!plain(value) || typeof value.toJSON === 'function') return undefined;
    const found: { head: string; raw: string }[] = [];
    let length = 1;
    for (const name of Object.keys(value)) {
        const text = JSON.stringify({ [name]: value[name] });
        if (text === '{}') continue;
        const head = JSON.stringify(name) + ':';
        found.push({ head, raw: text.slice(head.length + 1, -1) });
        length += text.length - 1;
    }
    if (Math.max(length, 2) !== raw.length || `{${found.map(entry => entry.head + entry.raw).join(',')}}` !== raw) return undefined;
    const entries = new Map<string, RedactedEntry>();
    let chars = 0;
    const redacted = found.map(entry => {
        const last = before?.get(entry.head);
        let text = last?.redacted;
        if (text === undefined || last?.raw !== entry.raw) {
            text = JSON.stringify(sanitizeObject(JSON.parse(entry.raw)));
            chars += text.length;
        }
        entries.set(entry.head, { raw: entry.raw, redacted: text });
        return entry.head + text;
    });
    return { redacted: `{${redacted.join(',')}}`, entries, chars };
}
