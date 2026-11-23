import { expect, test, vi } from 'vitest';
import { snapshotText } from '../../../../server/office/http/snapshot-text';
import { redactedText, sanitizeObject } from '../../../../server/office/security';
import { json, jsonText } from '../../../../server/office/http/responses';
import { storeTimings } from '../../../../server/store/store-timings';

test('a snapshot is built once and sent as the text that serialising its redacted form gives', () => {
    const store = { timings: storeTimings() }, build = vi.fn(() => ({ revision: 7, tickets: [{ key: 'CEC-1', note: 'password=hunter2 and more', url: 'https://x.test/?token=abc&page=2' }], '10': 'ten', '2': 'two', nothing: undefined, at: new Date('2026-11-22T00:00:00Z') }));
    const text = snapshotText(store, build, 'a push');
    expect(build).toHaveBeenCalledTimes(1);
    // Byte for byte what the previous two steps produced: redact to an object, then serialise it.
    expect(text).toBe(JSON.stringify(sanitizeObject(build())));
    expect(text).not.toContain('hunter2');
    expect(text).not.toContain('token=abc');
    expect(JSON.parse(text)).toEqual(sanitizeObject(build()));
    snapshotText(store, build, 'a request');
    const report = store.timings.report().timings;
    expect(report['browser snapshot: build for a push']).toMatchObject({ calls: 1, chars: 0 });
    expect(report['browser snapshot: build for a request']).toMatchObject({ calls: 1, chars: 0 });
    expect(report['browser snapshot: redact and serialise for a push']).toMatchObject({ calls: 1, chars: text.length });
    expect(report['browser snapshot: redact and serialise for a request']).toMatchObject({ calls: 1, chars: text.length });
    expect(Object.keys(report)).toHaveLength(4);
});

test('a snapshot that cannot be built or redacted is reported, and nothing is returned in its place', () => {
    const store = { timings: storeTimings() }, failure = new Error('projection failed');
    expect(() => snapshotText(store, () => { throw failure; }, 'a push')).toThrow(failure);
    const circular: Record<string, unknown> = {}; circular.self = circular;
    expect(() => snapshotText(store, () => circular, 'a request')).toThrow();
    // Each failure is counted under the step it failed in.
    const report = store.timings.report().timings;
    expect(report['browser snapshot: build for a push']).toMatchObject({ calls: 1 });
    expect(report['browser snapshot: redact and serialise for a request']).toMatchObject({ calls: 1, chars: 0 });
    expect(report['browser snapshot: redact and serialise for a push']).toBeUndefined();
});

test('redacted text is what the redacted object serialises to, for every shape redaction handles', () => {
    for (const value of [null, 'Bearer abc.def', ['sk-abcdef', 7, null, { 'api_key': 'x', inner: 'cookie: a=b' }], { postgres: 'postgresql://user:pw@host/db', nested: { deep: ['authorization = Basic Zm9v'] } }, { toJSON: () => ({ secret: 'secret=shh' }) }])
        expect(redactedText(value)).toBe(JSON.stringify(sanitizeObject(value)));
});

test('a response built from serialised text is the response `json` gives for the same body', async () => {
    const body = { ok: true, items: ['é', 1] };
    const direct = json(body), fromText = jsonText(JSON.stringify(body));
    expect(await fromText.text()).toBe(await direct.text());
    expect(fromText.status).toBe(direct.status);
    expect(Object.fromEntries(fromText.headers)).toEqual(Object.fromEntries(direct.headers));
    expect(jsonText('{}', 503).status).toBe(503);
});
