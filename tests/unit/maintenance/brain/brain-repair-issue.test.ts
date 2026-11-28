import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../publication/support/fake-maintenance-github';
import { BODY } from '../publication/support/issue-body';
import { brainFixture } from './support/brain-followup-fixture';
import { blockerProvenance, diagnoseBlocker, diagnosisPacket, DiagnosisSchema, routeRepair, routedRepairMismatch } from '../../../../server/maintenance/brain/brain-repair-issue';
import { followupOwner } from '../../../../server/maintenance/brain/brain-followup-run';
afterEach(cleanupFakes);

const diagnosis = (extra: Record<string, unknown> = {}) => ({ decision: 'create' as const, issue: 0, title: '[Bug] Restore Content Hub sitemap coverage', body: BODY, labels: ['bug', 'area:catalog'],
    source: 'Content Hub', defect: 'lost sitemap coverage', summary: 'One repair', workerId: 'w', at: '', ...extra });

test('the diagnosis is strict, reads only harness-read evidence, and binds the reconciled run\'s own source and defect', async () => {
    expect(() => DiagnosisSchema.parse({ ...diagnosis(), extra: 1 })).toThrow();
    expect(blockerProvenance('original')).toBe('Office maintenance blocker original');
    const a = brainFixture();
    a.addIssue({ title: 'Open', body: 'x'.repeat(5000) });
    const packet: any = await diagnosisPacket(a.store, a.execute as any, a.run);
    expect(packet).toMatchObject({ run: 'original', outcomes: [{ stage: 'brain-maintenance', summary: 'Content Hub catalog lost sitemap coverage' }], pickup: { status: 'Ready' } });
    expect(packet.issues[0].body).toHaveLength(4000);
    // The scripted worker checks the follow-up was persisted as working before it runs.
    a.run.blockerFollowup = { status: 'working', publicationVersion: 1, detail: '' };
    a.diagnose();
    expect(await diagnoseBlocker(a.store, a.engine.agents, a.execute as any, a.run, { status: 'Ready' })).toMatchObject({ decision: 'create', source: 'Content Hub', defect: 'lost sitemap coverage' });
    // A source or defect named only by an open issue in the packet, not by the reconciled run, is refused.
    a.addIssue({ title: 'Sitecore search stale', body: 'Sitecore search index stale' });
    a.diagnose({ source: 'Sitecore', defect: 'search index stale' });
    await expect(diagnoseBlocker(a.store, a.engine.agents, a.execute as any, a.run, { status: 'Ready' })).rejects.toThrow(/not grounded in the reconciled run's outcomes/);
    a.diagnose({ decision: 'blocked', source: '', defect: '' });
    expect(await diagnoseBlocker(a.store, a.engine.agents, a.execute as any, a.run, { status: 'Ready' })).toMatchObject({ decision: 'blocked' });
});

test('routing files the keyed issue with its provenance, places the card through bound Effects and verifies; another lane stops', async () => {
    const a = brainFixture();
    a.run.blockerFollowup = { status: 'working', publicationVersion: 1, detail: '', diagnosis: diagnosis() };
    await a.claimed(a.run, 'continuation', () => routeRepair(a.store, a.execute as any, a.run, followupOwner(a.store, a.run, 'Ready'), 'Ready'));
    expect(a.state.writes).toEqual(['issue-create', 'board-add', 'board-status']);
    expect(a.state.issues[0].body).toContain(blockerProvenance('original'));
    const status = a.store.getEffect(a.run.blockerFollowup.routing!.card!.effectIds.find(id => id.includes('card-status'))!)!;
    expect(status.payload).toMatchObject({ lane: 'Ready', project: 'project', field: 'status', option: 'ready', item: a.state.cards[0].id });
    expect(await routedRepairMismatch(a.store, a.execute as any, a.run, a.board, 'Ready')).toBeUndefined();
    expect(await routedRepairMismatch(a.store, a.execute as any, a.run, a.board, 'In progress')).toMatch(/Pickup now uses Ready/);
    const b = brainFixture(), issue = b.addIssue({ title: 'Content Hub sitemap repair', body: 'Content Hub catalog lost sitemap coverage', assignees: ['JFusco'] });
    b.state.cards.push({ id: 'card-y', number: issue.number, status: 'progress' });
    b.run.blockerFollowup = { status: 'working', publicationVersion: 1, detail: '', diagnosis: diagnosis({ decision: 'adopt', issue: issue.number }) };
    await expect(b.claimed(b.run, 'continuation', () => routeRepair(b.store, b.execute as any, b.run, followupOwner(b.store, b.run, 'Ready'), 'Ready'))).rejects.toThrow(/does not move/);
    expect(b.state.writes).toEqual([]);
});

test('routing refuses an adoption with no named issue and a recorded issue closed before its assignment or card write, in their preflight too', async () => {
    const a = brainFixture();
    a.run.blockerFollowup = { status: 'working', publicationVersion: 1, detail: '', diagnosis: diagnosis({ decision: 'adopt', issue: 0 }) };
    await expect(a.claimed(a.run, 'continuation', () => routeRepair(a.store, a.execute as any, a.run, followupOwner(a.store, a.run, 'Ready'), 'Ready'))).rejects.toThrow(/names none/);
    expect(a.state.writes).toEqual([]);
    // The issue is closed by a person between the routing's first read and the assignment's preflight.
    const b = brainFixture(), issue = b.addIssue({ title: 'Content Hub sitemap repair', body: 'Content Hub catalog lost sitemap coverage', assignees: [] });
    b.run.blockerFollowup = { status: 'working', publicationVersion: 1, detail: '', diagnosis: diagnosis({ decision: 'adopt', issue: issue.number }) };
    let reads = 0;
    const execute = async (program: string, args: string[], options: any = {}) => {
        if (program === 'gh' && args[1] === `repos/${b.repository}/issues/${issue.number}` && ++reads === 2) issue.state = 'closed';
        return b.execute(program, args, options);
    };
    await expect(b.claimed(b.run, 'continuation', () => routeRepair(b.store, execute as any, b.run, followupOwner(b.store, b.run, 'Ready'), 'Ready'))).rejects.toThrow(/closed or no longer the recorded issue/);
    expect(b.state.writes).toEqual([]);
});
