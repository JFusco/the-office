import { expect, test } from 'vitest';
import { sanitizeObject } from '../../../server/office/security';
import { redactEntries, type RedactedEntry } from '../../../server/store/redact-entries';

const SECRET = 'see postgres://user:pw@db.internal/app for details';
/** What redacting the whole value stores, worked out without the code under test. */
const whole = (value: unknown) => JSON.stringify(sanitizeObject(JSON.parse(JSON.stringify(value))));
const run = (value: unknown, before?: ReadonlyMap<string, RedactedEntry>) => redactEntries(value, JSON.stringify(value), before);

/** A small seeded generator, so a failure names a state that can be built again. */
function generator(seed: number) {
    let state = seed;
    const next = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 2 ** 32; };
    const pick = <T>(items: T[]) => items[Math.floor(next() * items.length)];
    const text = () => pick(['', 'plain', SECRET, 'Bearer abc.def', 'password: hunter2, next', 'a "quoted" \\ line\n', 'ghp_abcdef123', '?token=xyz&ok=1', ' é', '__proto__']);
    const key = () => pick(['a', 'b', 'jobs', '1', '10', '2', 'password', 'api_key', 'with "quote"', '__proto__', 'toJSON2', '']);
    const value = (depth: number): unknown => {
        const kind = depth > 2 ? Math.floor(next() * 5) : Math.floor(next() * 9);
        if (kind === 0) return text();
        if (kind === 1) return Math.floor(next() * 1000) - 500;
        if (kind === 2) return pick([true, false, null]);
        if (kind === 3) return undefined;
        if (kind === 4) return next() < 0.5 ? new Date(86400000 * Math.floor(next() * 20000)) : -0;
        if (kind < 7) return Array.from({ length: Math.floor(next() * 4) }, () => value(depth + 1));
        return object(depth + 1);
    };
    const object = (depth: number) => { const made: Record<string, unknown> = {}; for (let n = Math.floor(next() * 6); n > 0; n--) Object.defineProperty(made, key(), { value: value(depth), enumerable: true, writable: true, configurable: true }); return made; };
    return { object: () => object(0), next, pick };
}

test('an object redacted one entry at a time is exactly the object redacted whole, with and without remembered entries', () => {
    for (let seed = 1; seed <= 400; seed++) {
        const made = generator(seed), first = made.object();
        const fresh = run(first);
        expect(fresh?.redacted, `seed ${seed}`).toBe(whole(first));
        // Change, add and remove some entries, then redact again with what was remembered.
        const second: Record<string, unknown> = { ...first };
        for (const name of Object.keys(second)) if (made.next() < 0.3) delete second[name]; else if (made.next() < 0.3) second[name] = made.object();
        if (made.next() < 0.5) second.added = SECRET;
        expect(run(second, fresh?.entries)?.redacted, `seed ${seed}, second`).toBe(whole(second));
    }
});

test('only an entry whose text changed is redacted again; the rest reuse what was remembered', () => {
    const value = { jobs: [{ note: SECRET }], time: { a: 1 }, lastTickAt: 'one' };
    const first = run(value)!;
    expect(first.chars).toBe(first.redacted.length - '{"jobs":,"time":,"lastTickAt":}'.length);
    const second = run({ ...value, lastTickAt: 'two' }, first.entries)!;
    expect(second.chars).toBe('"two"'.length);
    expect(second.redacted).toBe(whole({ ...value, lastTickAt: 'two' }));
    // Remembered text is used as it stands, which is what shows it was not worked out again.
    const marked = new Map(first.entries);
    marked.set('"jobs":', { raw: marked.get('"jobs":')!.raw, redacted: '"REUSED"' });
    expect(run({ ...value, lastTickAt: 'two' }, marked)!.redacted).toBe('{"jobs":"REUSED","time":{"a":1},"lastTickAt":"two"}');
});

test('an entry that changed is never given its remembered text, and a secret in it is redacted', () => {
    const first = run({ note: 'harmless', other: 1 })!;
    const second = run({ note: SECRET, other: 1 }, first.entries)!;
    expect(second.redacted).toBe(whole({ note: SECRET, other: 1 }));
    expect(second.redacted).not.toContain('user:pw');
    // The same name with another value is another entry, and a name that only looks alike is too.
    expect(run({ 'not': 1, note: 'changed' }, first.entries)!.redacted).toBe('{"not":1,"note":"changed"}');
});

test('what cannot be split is left to the caller: not a plain object, or entries that do not join to the text given', () => {
    class Custom { a = 1; }
    for (const value of [[1, 2], 'text', 7, null, new Date(0), new Custom(), new Map()])
        expect(redactEntries(value, JSON.stringify(value))).toBeUndefined();
    // Its own toJSON decides the text, so the entries do not join to it.
    const own = { a: 1, toJSON: () => ({ b: 2 }) };
    expect(redactEntries(own, JSON.stringify(own))).toBeUndefined();
    // Text that is not this value's: same length, other content.
    expect(redactEntries({ a: 1 }, '{"a":2}')).toBeUndefined();
    expect(redactEntries({ a: 1 }, '{"a":1,"b":2}')).toBeUndefined();
    expect(run({})).toEqual({ redacted: '{}', entries: new Map(), chars: 0 });
    expect(run(Object.assign(Object.create(null) as object, { a: SECRET }))!.redacted).toBe(whole({ a: SECRET }));
    expect(run({ gone: undefined, fn: () => 1, kept: 1 })!.redacted).toBe('{"kept":1}');
});
