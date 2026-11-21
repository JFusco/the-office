import { expect, test } from 'vitest';
import { serialisedSnapshot } from '../../../../server/office/http/serialised-snapshot';
import { json, jsonText } from '../../../../server/office/http/responses';
import { storeTimings } from '../../../../server/store/store-timings';

test('serialising a built snapshot is counted once under its purpose, sized by the text sent', () => {
    const store = { timings: storeTimings() }, snapshot = { revision: 7, tickets: [{ key: 'CEC-1' }] };
    const text = serialisedSnapshot(store, snapshot, 'a push');
    expect(text).toBe(JSON.stringify(snapshot));
    serialisedSnapshot(store, snapshot, 'a request');
    const report = store.timings.report().timings;
    expect(report['browser snapshot: serialise for a push']).toMatchObject({ calls: 1, chars: text.length });
    expect(report['browser snapshot: serialise for a request']).toMatchObject({ calls: 1, chars: text.length });
    expect(Object.keys(report)).toHaveLength(2); // Nothing else is counted here: the build is timed where it is built.
});

test('a response built from serialised text is the response `json` gives for the same body', async () => {
    const body = { ok: true, items: ['é', 1] };
    const direct = json(body), fromText = jsonText(JSON.stringify(body));
    expect(await fromText.text()).toBe(await direct.text());
    expect(fromText.status).toBe(direct.status);
    expect(Object.fromEntries(fromText.headers)).toEqual(Object.fromEntries(direct.headers));
    expect(jsonText('{}', 503).status).toBe(503);
});
