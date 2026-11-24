import { describe, expect, test } from 'vitest';
import { redactedText, sanitize, sanitizeObject } from '../../../server/office/security';

/** A string holding JSON text, redacted and parsed again, as a reader of a saved receipt detail would. */
const reparsed = (value: unknown) => JSON.parse(sanitize(JSON.stringify(value)));

/** The characters `JSON.stringify` writes as an escape: `\n`, `\t`, `\r`, `\b`, `\f` and `\u001b`. */
const ESCAPED = ['\n', '\t', '\r', '\b', '\f', '\u001b'];
const CLASSIC_TOKEN = `ghp_${'a'.repeat(36)}`;
const TOKENS = [`sk-${'b'.repeat(40)}`, `gho_${'c'.repeat(36)}`, CLASSIC_TOKEN, `ghr_${'d'.repeat(36)}`, `ghs_${'e'.repeat(36)}`];
/** JSON text holding `line`, the separator, then the tail: what `sanitize` sees in a string whose content is JSON. */
const jsonLine = (separator: string, tail: string) => JSON.stringify({ prior: `line${separator}${tail}` });

describe('a token right after a JSON escape', () => {
    test.each(ESCAPED.map(separator => [JSON.stringify(separator), separator]))('is redacted after %s', (_, separator) => {
        for (const token of TOKENS) expect(sanitize(jsonLine(separator, token))).toBe(jsonLine(separator, '[redacted]'));
    });

    test('is redacted inside a stored string whose content is JSON text', () => {
        const value = { detail: jsonLine('\n', CLASSIC_TOKEN) };
        expect(redactedText(value)).toBe(JSON.stringify({ detail: jsonLine('\n', '[redacted]') }));
        expect(sanitizeObject(value).detail).toBe(jsonLine('\n', '[redacted]'));
        expect(JSON.parse(sanitizeObject(value).detail)).toEqual({ prior: 'line\n[redacted]' });
    });

    test('counts a written \\u escape even when it stands for a word character', () => {
        expect(sanitize(String.raw`{"m":"\u005Fghp_fixture"}`)).toBe(String.raw`{"m":"\u005F[redacted]"}`);
        expect(sanitize('_ghp_fixture')).toBe('_ghp_fixture');
    });

    test('counts an escape letter after a literal backslash too, keeping the backslashes', () => {
        expect(sanitize(JSON.stringify({ m: `\\n${CLASSIC_TOKEN}` }))).toBe(JSON.stringify({ m: '\\n[redacted]' }));
    });

    test.each(['ghost', 'gh-pages', 'task-runner', 'skip'])('keeps the ordinary word %j', word => {
        for (const separator of ESCAPED) expect(sanitize(jsonLine(separator, word))).toBe(jsonLine(separator, word));
    });

    test('still needs a separator in plain text', () => {
        expect(sanitize(`line\n${CLASSIC_TOKEN}`)).toBe('line\n[redacted]');
        expect(sanitize(`linen${CLASSIC_TOKEN}`)).toBe(`linen${CLASSIC_TOKEN}`);
    });
});

describe('JSON text stored in a string stays JSON', () => {
    test.each([
        ['cookie: abc', 'cookie: [redacted]'],
        ['password=x', 'password=[redacted]'],
        ['api_key: k', 'api_key: [redacted]'],
        ['secret=s', 'secret=[redacted]'],
        ['authorization: Bearer y', 'authorization: [redacted]'],
        ['connection_string=Server=x;Pwd=y', 'connection_string=[redacted]'],
    ])('%s is redacted and its sibling field kept', (secret, redacted) => {
        expect(reparsed({ prior: `stopped: ${secret}`, id: 'c1' })).toEqual({ prior: `stopped: ${redacted}`, id: 'c1' });
    });

    test.each([
        ['an array element', JSON.stringify(['secret:'])],
        ['a property name', JSON.stringify({ 'secret:': 1 })],
        ['an array element before a space', '["secret:" ]'],
        ['a property name before a spaced colon', '{"secret:" : 1}'],
        ['a value before a sibling field', JSON.stringify({ a: 'secret:', b: 'x' })],
    ])('a label ending %s keeps the closing quote', (_, text) => {
        expect(sanitize(text)).toBe(text);
        expect(JSON.parse(sanitize(text))).toEqual(JSON.parse(text));
    });

    test.each([
        ['password="hunter2" expired', 'password=[redacted]'],
        ['cookie: a"b rest', 'cookie: [redacted]'],
        ['got "Bearer tok" back', 'got "Bearer [redacted] back'],
        ['see ?token=abc"', 'see ?token=[redacted]'],
        ['"postgres://u:p@host/db" tail', '"[database redacted] tail'],
        ['cookie: abc\\', 'cookie: [redacted]'],
    ])('an escaped quote or backslash in %j stays inside the value', (text, redacted) => {
        expect(reparsed({ prior: text, id: 'c1' })).toEqual({ prior: redacted, id: 'c1' });
    });

    test('a receipt detail saved through sanitizeObject still parses', () => {
        const detail = JSON.stringify({ checkpointId: 'c1', prior: { detail: 'stopped: cookie: abc', status: 'blocked' } });
        const saved = sanitizeObject({ detail });
        expect(JSON.parse(saved.detail)).toEqual({ checkpointId: 'c1', prior: { detail: 'stopped: cookie: [redacted]', status: 'blocked' } });
    });

    test('a serialized backspace before "earer" keeps its escape', () => {
        expect(reparsed({ m: '\bearer sample' })).toEqual({ m: '\bearer [redacted]' });
        expect(reparsed({ m: '\\bearer sample' })).toEqual({ m: '\\Bearer [redacted]' });
    });
});

describe('plain-text redaction', () => {
    test.each([
        ['cookie: abc def, next', 'cookie: [redacted], next'],
        ['password=hunter2} x', 'password=[redacted]} x'],
        ['secret=s1 two\nnext line', 'secret=[redacted]\nnext line'],
        ['api_key: k1 k2', 'api_key: [redacted]'],
        ['Bearer abc', 'Bearer [redacted]'],
        ['bEaReR abc', 'Bearer [redacted]'],
        ['Authorization: Bearer abc.def', 'Authorization: [redacted]'],
        ['?token=abc&x=1', '?token=[redacted]&x=1'],
        ['postgres://u:p@h/d x', '[database redacted] x'],
        ['use sk-abc123 now', 'use [redacted] now'],
        [`push ghp_${'a'.repeat(36)} now`, 'push [redacted] now'],
        ['Bearer secret-token postgres://user:password@host/db', 'Bearer [redacted] [database redacted]'],
    ])('%j is redacted as before', (text, redacted) => {
        expect(sanitize(text)).toBe(redacted);
    });

    test.each([
        ['password="hunter2" rest, x', 'password="[redacted]" rest, x'],
        ['password="]hunter2" rest, x', 'password="[redacted]" rest, x'],
        ['password=":hunter2" rest, x', 'password="[redacted]" rest, x'],
        ['password=" hunter2" rest, x', 'password="[redacted]" rest, x'],
    ])('a quoted value %j is redacted inside its quotes', (text, redacted) => {
        expect(sanitize(text)).toBe(redacted);
    });

    test('a backslash takes the next character into the value, a bare newline ends it', () => {
        expect(sanitize('password=one\\\ntwo, tail')).toBe('password=[redacted], tail');
        expect(sanitize('password=one\ntwo, tail')).toBe('password=[redacted]\ntwo, tail');
        expect(sanitize('?token=a\\&b=2&x=3')).toBe('?token=[redacted]&x=3');
        expect(sanitize('password=abc\\')).toBe('password=[redacted]');
    });

    test('a secret holding a bare quote is redacted only up to it', () => {
        expect(sanitize('password=ab"cd, x')).toBe('password=[redacted]"cd, x');
        expect(sanitize('password="ab"cd"')).toBe('password="[redacted]"cd"');
    });
});

test.each([
    'password="hunter2" rest, x',
    'password=ab"cd, x',
    'cookie: abc, next',
    JSON.stringify({ prior: 'stopped: cookie: abc', id: 'c1' }),
    JSON.stringify({ prior: 'password="hunter2" expired', id: 'c1' }),
    JSON.stringify(['secret:']),
    JSON.stringify({ m: '\bearer sample' }),
    JSON.stringify({ prior: `line\n${CLASSIC_TOKEN}` }),
])('redacting %j again changes nothing', text => {
    expect(sanitize(sanitize(text))).toBe(sanitize(text));
});
