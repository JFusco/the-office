import { afterEach, expect, test } from 'vitest';
import { lastFailedMailCheck, lastMailCheckOutcome } from '../../../server/incidents/mailbox-check-window';
import type { Store } from '../../../server/store/store';
import { projectStore } from './incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store() { const s = projectStore('cec'); stores.push(s); return s; }
const event = (s: Store, kind: string, at: string) => s.db.prepare('INSERT INTO events(body) VALUES(?)').run(JSON.stringify({ id: 0, at, kind, message: 'PRIVATE message' }));

test('the last check that ended blocked, from its start to its failure, read from the persisted events', () => {
    const s = store();
    expect(lastFailedMailCheck(s.db)).toBeNull();
    event(s, 'mail-check', '2026-11-20T10:00:00.000Z');
    expect(lastFailedMailCheck(s.db)).toBeNull();
    event(s, 'mail-blocked', '2026-11-20T10:06:00.000Z');
    expect(lastFailedMailCheck(s.db)).toEqual({ checkedAt: '2026-11-20T10:00:00.000Z', blockedAt: '2026-11-20T10:06:00.000Z' });
    // Queuing another check and unrelated traffic do not move it, however much there is.
    event(s, 'mail-check-queued', '2026-11-20T10:07:00.000Z');
    for (let n = 0; n < 150; n++) event(s, 'agent-finished', '2026-11-20T10:08:00.000Z');
    expect(lastFailedMailCheck(s.db)).toEqual({ checkedAt: '2026-11-20T10:00:00.000Z', blockedAt: '2026-11-20T10:06:00.000Z' });
});

test('a later check that started or succeeded ends the window; a failure without its start has none', () => {
    const s = store();
    event(s, 'mail-check', '2026-11-20T10:00:00.000Z');
    const blocked = event(s, 'mail-blocked', '2026-11-20T10:06:00.000Z').lastInsertRowid;
    event(s, 'mail-check', '2026-11-20T11:00:00.000Z');
    expect(lastFailedMailCheck(s.db)).toBeNull();
    expect(lastMailCheckOutcome(s.db)).toEqual({ id: Number(blocked), kind: 'mail-blocked', at: '2026-11-20T10:06:00.000Z' });
    const delivered = event(s, 'mail-delivered', '2026-11-20T11:01:00.000Z').lastInsertRowid;
    expect(lastMailCheckOutcome(s.db)).toEqual({ id: Number(delivered), kind: 'mail-delivered', at: '2026-11-20T11:01:00.000Z' });
    expect(lastFailedMailCheck(s.db)).toBeNull();
    event(s, 'mail-blocked', '2026-11-20T11:02:00.000Z');
    expect(lastFailedMailCheck(s.db)).toBeNull();
});
