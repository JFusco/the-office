import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { assertMovable, assertRecordedInBlock, observeInBlock, recordBlockCoverage, recordedInBlock, type ParkInventory } from '../../../../server/delivery/parking/metadata-park-inventory';
import { ParkNeedsRestore, ParkSuperseded } from '../../../../server/delivery/parking/metadata-park-freshness';
import type { MetadataParkBinding } from '../../../../src/contracts/metadata-park';
import type { BoardUpdate, TicketJob } from '../../../../src/shared';

const options = [{ id: 'ready', name: 'Ready' }, { id: 'review', name: 'In review' }, { id: 'block', name: 'Block' }, { id: 'done', name: 'Done' }, { id: 'backlog', name: 'Backlog' }];
const binding = (changes: Partial<MetadataParkBinding> = {}): MetadataParkBinding => ({ step: 0, resultSha256: '', inputSha256: '', pr: { number: 200, url: '', head: '', branch: '', contentSha256: '' },
    route: { project: 'project', field: 'status', pickup: { name: 'Ready', option: 'ready' }, block: { id: 'block', name: 'Block' }, review: { id: 'review', name: 'In review' }, issue: 'issue-card', prs: ['pr-card'], assignee: 'JFusco' },
    boardStart: 1, observed: [], ...changes });
const note = (item: string, at = '2026-11-24T00:00:00Z'): BoardUpdate => ({ stage: 'lead-pr', head: 'a'.repeat(40), project: 'project', item, field: 'status', option: 'block', target: 'Block', at, status: 'verified', detail: 'Block already verified.' });
const inventory = (lanes: Record<string, string | undefined>): ParkInventory => ({ field: { projectId: 'project', fieldId: 'status', options },
    cards: Object.keys(lanes).map(id => ({ id, kind: id.startsWith('issue') ? 'Issue' : 'PullRequest', number: id.startsWith('issue') ? 5 : 200 })), lanes: new Map(Object.entries(lanes)) });

test('only the park\'s own board updates and observations put a card on its record, never an older note', () => {
    const job = { boardUpdates: [note('issue-card'), note('pr-card')] } as TicketJob;
    expect([...recordedInBlock(job, binding())]).toEqual(['pr-card']);
    expect([...recordedInBlock(job, binding({ observed: ['issue-card'] }))].sort()).toEqual(['issue-card', 'pr-card']);
});

test('a card found in Block with no record is observed there once', () => {
    const f = metadataParkFixture(), b = binding({ boardStart: 0 }), job = { boardUpdates: [] } as unknown as TicketJob;
    observeInBlock(f.store, job, b, inventory({ 'issue-card': 'block', 'pr-card': 'review' }));
    observeInBlock(f.store, job, b, inventory({ 'issue-card': 'block', 'pr-card': 'review' }));
    expect(b.observed).toEqual(['issue-card']);
});

test('a recorded issue card taken out of Block supersedes the park; the PR card taken out, or a recorded card gone, must be restored', () => {
    const job = { boardUpdates: [] } as unknown as TicketJob, b = binding({ boardStart: 0, observed: ['issue-card', 'pr-card'] });
    expect(() => assertRecordedInBlock(job, b, inventory({ 'issue-card': 'block', 'pr-card': 'block' }))).not.toThrow();
    expect(() => assertRecordedInBlock(job, b, inventory({ 'issue-card': 'ready', 'pr-card': 'block' }))).toThrow(ParkSuperseded);
    expect(() => assertRecordedInBlock(job, b, inventory({ 'issue-card': 'block', 'pr-card': 'review' }))).toThrow(ParkNeedsRestore);
    expect(() => assertRecordedInBlock(job, b, inventory({ 'issue-card': 'block' }))).toThrow('no longer on the board');
});

test('before any first move a card in a human lane refuses, as the mover would; a new PR card in its default lane does not', () => {
    const b = binding();
    expect(() => assertMovable(b, inventory({ 'issue-card': 'review', 'pr-card': undefined }))).not.toThrow();
    expect(() => assertMovable(b, inventory({ 'issue-card': 'ready', 'pr-card': 'backlog' }))).not.toThrow();
    expect(() => assertMovable(b, inventory({ 'issue-card': 'backlog', 'pr-card': 'review' }))).toThrow('Issue card is in "backlog", a human lane');
    expect(() => assertMovable(b, inventory({ 'issue-card': 'review', 'pr-card': 'done' }))).toThrow('PullRequest card is in "done", a human lane');
});

test('Block coverage is recorded only when the recorded issue card and every PR card on the board, a new one included, read in Block', async () => {
    const f = metadataParkFixture({ prCard: false }), b = binding({ boardStart: 0, route: { ...binding().route, prs: [] } });
    f.state.cards[0].status = 'block'; f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    await expect(recordBlockCoverage(f.store, f.delivery.execute, f.job, b)).rejects.toThrow("1 of the park's cards do not read in Block");
    expect(b.verified).toBeUndefined();
    f.state.cards[1].status = 'block';
    await recordBlockCoverage(f.store, f.delivery.execute, f.job, b);
    expect(b.verified).toEqual({ items: ['issue-card', 'pr-card'], at: expect.any(String) });
    const gone = binding({ boardStart: 0 });
    f.state.cards.splice(1, 1);
    await expect(recordBlockCoverage(f.store, f.delivery.execute, f.job, gone)).rejects.toThrow('a pull request card the park recorded is no longer on the board');
    f.state.lanes.find(lane => lane.id === 'block')!.id = 'block-2';
    await expect(recordBlockCoverage(f.store, f.delivery.execute, f.job, gone)).rejects.toThrow(ParkNeedsRestore);
});
