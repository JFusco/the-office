import { expect, test } from 'vitest';
import { hoursReadbackPending } from '../../../server/time/readback-pending';
import { projectOutbox } from '../../../server/conversations/outbox';
import { READBACK_INTERVAL_MS, SETTLE_MS } from '../../../server/time/time-readback';
import { cecStore } from '../cec/parking/fixtures';

const CREATED = '2026-11-20T03:26:00Z', after = (ms: number) => new Date(Date.parse(CREATED) + ms);
const entry = { id: 'GH-415:2026-11-20', key: 'GH-415', date: '2026-11-20', seconds: 200, sourceIds: [], status: 'uncertain' as const, detail: 'The hours write could not be confirmed.', url: '' };
const publication = (extra: object = {}) => ({ id: 'p1', provider: 'github' as const, key: 'GH-415', status: 'uncertain' as const, createdAt: CREATED, ...extra }) as any;

test('an unconfirmed write is the Office\'s own until its read-back hands it over or the window passes', () => {
    const ledger = { publications: [publication()] };
    expect(hoursReadbackPending(ledger, entry, after(60_000))).toBe(true);
    expect(hoursReadbackPending(ledger, entry, after(SETTLE_MS + READBACK_INTERVAL_MS - 1))).toBe(true);
    expect(hoursReadbackPending(ledger, entry, after(SETTLE_MS + READBACK_INTERVAL_MS))).toBe(false);
    expect(hoursReadbackPending({ publications: [publication({ readbackNote: 'Board hours changed outside the Office' })] }, entry, after(60_000))).toBe(false);
});

test.each([['no recorded write', []], ['a Jira worklog', [publication({ provider: 'jira' })]], ['a write since verified', [publication({ status: 'verified' })]], ['an unreadable date', [publication({ createdAt: '' })]], ['another ticket\'s write', [publication({ key: 'GH-9' })]]])('%s is never pending', (_name, publications) => {
    expect(hoursReadbackPending({ publications }, entry, after(60_000))).toBe(false);
    expect(hoursReadbackPending(undefined, entry, after(60_000))).toBe(false);
});

test('the outbox lists the hours item only once it is a person\'s', () => {
    const { store } = cecStore();
    store.state.coordination = { listener: { status: 'idle', error: '' }, jobs: [], ...(store.state.coordination || {}), time: { enabled: true, entries: [entry], publications: [publication()] } } as any;
    const listed = (at: Date) => projectOutbox(store.state, at).filter(item => item.id === `time:${entry.id}`).length;
    expect(listed(after(120_000))).toBe(0);
    expect(listed(after(SETTLE_MS + READBACK_INTERVAL_MS))).toBe(1);
    (store.state.coordination as any).time.publications = [];
    expect(listed(after(120_000))).toBe(1);
});
