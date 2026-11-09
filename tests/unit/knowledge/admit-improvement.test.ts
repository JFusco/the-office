import { test, expect } from 'vitest';
import { admitImprovement, improvementEligible } from '../../../server/knowledge/admit-improvement';
import { improvementIntakeGate } from '../../../server/knowledge/improvement-intake-gate';
import { improvementFixture } from './improvement-fixture';
import { GitHubIssuePublisher } from '../../../server/github/issue-publication';
import { improvementDigest } from '../../../server/knowledge/propose-improvements';
import { job, maintenanceRun } from './knowledge-fixture';
test('explicit linked repair blocks a differently worded duplicate and late source links recheck the incident threshold', async () => {
    const f = improvementFixture();
    try {
        f.item.incidents = ['maintenance:original', 'maintenance:other']; f.item.digest = improvementDigest(f.item);
        f.store.state.maintenance = { runs: [maintenanceRun({ id: 'original', blockerFollowup: { status: 'completed', issue: 88, detail: 'Existing repair' } })], lastDaily: '', lastWeekly: '', ledger: '' };
        f.provider.openItems = async () => [{ key: 'GH-88', text: 'Different wording', url: 'https://example.com/88' }];
        await admitImprovement(f.store, f.item.id, f.provider);
        expect(f.item.status).toBe('needs-input'); expect(f.counts().creates).toBe(0); expect(f.item.detail).toContain('linked repair GH-88');
        f.item.incidents = ['maintenance:original', 'job:repair']; f.item.digest = improvementDigest(f.item);
        f.store.state.coordination!.jobs!.push(job({ id: 'repair', key: 'GH-88' }));
        expect(improvementEligible(f.store, f.item)).toBe(false);
        await admitImprovement(f.store, f.item.id, f.provider); expect(f.counts().creates).toBe(0);
    } finally { f.close(); }
});
test('an existing open repair PR prevents an improvement create', async () => {
    const f = improvementFixture();
    try {
        const github = new GitHubIssuePublisher(f.store, { id: f.item.id, marker: () => 'fixture' }, async () => JSON.stringify([[{ number: 88, title: f.item.cause, body: 'Existing repair', html_url: 'https://github.com/example/repo/pull/88', pull_request: {} }]]));
        f.provider.openItems = () => github.openItems();
        await admitImprovement(f.store, f.item.id, f.provider);
        expect(f.item.status).toBe('needs-input'); expect(f.counts()).toEqual({ creates: 0, assignments: 0 });
    } finally { f.close(); }
});
for (const project of ['brain', 'cec']) test(`${project}: unknown create stays fenced across retries and is reconciled without a second dispatch`, async () => {
    const f = improvementFixture(project);
    try {
        f.failCreate(); f.found(false);
        await admitImprovement(f.store, f.item.id, f.provider);
        expect(f.item.status).toBe('uncertain'); expect(improvementIntakeGate(f.store, 'GH-999').allowed).toBe(false);
        await admitImprovement(f.store, f.item.id, f.provider); expect(f.counts().creates).toBe(1);
        f.found(true); await admitImprovement(f.store, f.item.id, f.provider);
        expect(f.counts()).toEqual({ creates: 1, assignments: 1 }); expect(f.item.status).toBe('open');
        expect(improvementIntakeGate(f.store, f.item.providerId!).allowed).toBe(true);
        expect(f.store.getEffect(`improvement:${f.item.id}:create`)?.authorization).toBe('harper-improvement-queue-v1');
        expect(f.store.state.features).toEqual([]);
    } finally { f.close(); }
});
test('duplicate ambiguity, capacity and revoked grants stop mutation', async () => {
    const f = improvementFixture();
    try {
        f.provider.openItems = async () => [{ key: 'GH-1', text: f.item.cause, url: '' }];
        await admitImprovement(f.store, f.item.id, f.provider); expect(f.item.status).toBe('needs-input'); expect(f.counts().creates).toBe(0);
        f.item.status = 'proposed'; f.provider.openItems = async () => [];
        f.store.state.knowledge!.improvementGrant!.enabled = false;
        expect(improvementEligible(f.store, f.item)).toBe(false);
        await admitImprovement(f.store, f.item.id, f.provider); expect(f.counts().creates).toBe(0);
    } finally { f.close(); }
});
test('authorization is rechecked after awaited preflight and before dispatch', async () => {
    const f = improvementFixture();
    try {
        f.provider.preflight = async () => { f.store.state.knowledge!.improvementGrant!.enabled = false; };
        await admitImprovement(f.store, f.item.id, f.provider);
        expect(f.counts().creates).toBe(0); expect(f.item.status).toBe('needs-input');
        expect(f.store.getEffect(`improvement:${f.item.id}:create`)?.status).toBe('rejected');
    } finally { f.close(); }
});
test('revocation permits read-back of the original create but never assignment or another write', async () => {
    const f = improvementFixture();
    try {
        f.failCreate(); f.found(false); await admitImprovement(f.store, f.item.id, f.provider);
        f.store.state.knowledge!.improvementGrant!.enabled = false; f.found(true);
        await admitImprovement(f.store, f.item.id, f.provider);
        expect(f.counts()).toEqual({ creates: 1, assignments: 0 });
        expect(f.item).toMatchObject({ status: 'uncertain', providerId: 'GH-123' });
    } finally { f.close(); }
});
test('three reserved or open improvements defer a fourth; only positive provider closure frees a slot', async () => {
    const f = improvementFixture();
    try {
        f.store.state.knowledge!.improvements!.push(...[1, 2, 3].map(i => ({ ...structuredClone(f.item), id: `existing-${i}`, status: 'open' as const, providerId: `GH-${i}` })));
        await admitImprovement(f.store, f.item.id, f.provider); expect(f.counts().creates).toBe(0); expect(f.item.status).toBe('proposed');
        f.provider.closed = async () => false; await admitImprovement(f.store, 'existing-1', f.provider);
        expect(f.store.state.knowledge!.improvements![1].status).toBe('open');
        f.provider.closed = async () => true; await admitImprovement(f.store, 'existing-1', f.provider);
        expect(f.store.state.knowledge!.improvements![1].status).toBe('closed');
        await admitImprovement(f.store, f.item.id, f.provider); expect(f.item.status).toBe('open');
    } finally { f.close(); }
});
