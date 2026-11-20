import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { park } from '../../../../server/delivery/parking/park';
import { returnCardToPickup } from '../../../../server/delivery/parking/return-to-pickup';
import { HOLDS } from '../../../../server/office/config';
import type { StageResult } from '../../../../src/shared';
afterEach(() => { cleanupFakes(); delete HOLDS['GH-5']; });

const reason = { slug: 'probe', label: 'Probe unpark', body: (lane: string) => `The wait is over; moving the card back to ${lane}.` };
async function parked() {
    const f = fakeGitHub(), job = f.candidate({ stage: 'implement', status: 'working' });
    f.state.cards[0].status = 'progress';
    const result = { outcome: 'blocked', summary: 'Waiting', blocker: 'Waiting on something outside.', commit: HEAD, evidence: [], findings: [], receipts: [], previewUrl: '', qaRunDir: '', prerequisites: null,
        resolution: { kind: 'provider-wait', findingIds: [], evidenceIds: [] } } as unknown as StageResult;
    await claimedDelivery(f.store, job, () => park(f.delivery, job, result));
    return { f, job, execute: f.execute as any };
}
const effects = (f: any, job: any) => (f.store.db.prepare('SELECT id, status FROM effects WHERE id LIKE ?').all(`harness:${job.id}:probe-%`) as { id: string; status: string }[]).map(row => `${row.id.split(':').slice(2).join(':')}=${row.status}`).sort();

test('moves the parked card to the pickup lane with one marked comment, both as verified Effects, and returns the lane name', async () => {
    const { f, job, execute } = await parked(), comments = f.state.comments.length, attempt = job.steps.length;
    expect(await returnCardToPickup(f.store, execute, job, 'ready', reason)).toBe('Ready');
    expect(f.state.cards[0].status).toBe('ready');
    expect(f.state.comments).toHaveLength(comments + 1);
    expect(f.state.comments.at(-1).body).toBe(`Office probe ${job.id}:${attempt}: The wait is over; moving the card back to Ready.`);
    expect(effects(f, job)).toEqual([`probe-comment:${attempt}=verified`, `probe-lane:${attempt}=verified`]);
});

test('a card that is no longer in Block is left where a person put it: null, no comment, no Effect', async () => {
    const { f, job, execute } = await parked(), comments = f.state.comments.length;
    f.state.cards[0].status = 'progress';
    expect(await returnCardToPickup(f.store, execute, job, 'Ready', reason)).toBeNull();
    expect([f.state.cards[0].status, f.state.comments.length, effects(f, job)]).toEqual(['progress', comments, []]);
});

test('a hold stops it before any write', async () => {
    const { f, job, execute } = await parked(), comments = f.state.comments.length;
    HOLDS['GH-5'] = 'Held for the test';
    await expect(returnCardToPickup(f.store, execute, job, 'Ready', reason)).rejects.toThrow('Probe unpark stopped: the parked job changed');
    expect([f.state.cards[0].status, f.state.comments.length]).toEqual(['block', comments]);
});

test('a comment already on the issue is not posted again', async () => {
    const { f, job, execute } = await parked();
    f.state.comments.push({ id: 991, html_url: 'https://example.test/c/991', body: `Office probe ${job.id}:${job.steps.length}: earlier` });
    const comments = f.state.comments.length;
    expect(await returnCardToPickup(f.store, execute, job, 'Ready', reason)).toBe('Ready');
    expect([f.state.comments.length, f.state.cards[0].status]).toEqual([comments, 'ready']);
});

test('a board without exactly one such lane is refused', async () => {
    const { f, job, execute } = await parked();
    await expect(returnCardToPickup(f.store, execute, job, 'No Such Lane', reason)).rejects.toThrow('exactly one "No Such Lane" Status option');
});
