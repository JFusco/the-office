import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { addMetadataHumanInput } from '../../../fixtures/pr-metadata';
import { assertParkCurrent, assertParkDecision, assertParkLocal, assertParkRoute, ParkNeedsRestore, ParkSuperseded } from '../../../../server/delivery/parking/metadata-park-freshness';

/** A recorded park, stopped before its first move. */
async function recorded() {
    const f = metadataParkFixture();
    f.hooks.after = call => { if (String(call.request?.query).includes('fieldValues')) f.store.state.paused = true; };
    await expect(f.parkNow()).rejects.toThrow('paused');
    f.hooks.after = undefined; f.store.state.paused = false;
    expect(f.writes.moves).toEqual([]);
    return { f, parked: f.job.parked! };
}

test('the decision holds while the saved review, the inputs and the live PR are the ones it was decided on', async () => {
    const { f, parked } = await recorded();
    await f.run(() => assertParkCurrent(f.delivery, f.job, parked));
});

test('a changed saved review or new human input supersedes the decision; a pause is only a refusal', async () => {
    const { f, parked } = await recorded();
    await f.run(async () => {
        f.store.state.paused = true;
        let refused: unknown;
        try { assertParkLocal(f.delivery, f.job, parked); } catch (error) { refused = error; }
        expect(String(refused)).toContain('paused'); expect(refused).not.toBeInstanceOf(ParkSuperseded);
        f.store.state.paused = false;
        addMetadataHumanInput(f);
        expect(() => assertParkLocal(f.delivery, f.job, parked)).toThrow(ParkSuperseded);
    });
});

test.each([
    ['closed', (pr: any) => { pr.state = 'closed'; }, 'is no longer open'],
    ['merged with the same text', (pr: any) => { pr.merged_at = '2026-11-24T00:00:00Z'; }, 'is no longer open'],
    ['a new head', (pr: any) => { pr.head.sha = 'c'.repeat(40); }, 'has a new head'],
    ['an edited body', (pr: any) => { pr.body = 'Closes #5\nedited'; }, 'was edited after the review'],
] as const)('a live PR that is %s supersedes the decision', async (_name, change, error) => {
    const { f, parked } = await recorded();
    change(f.pr);
    await expect(f.run(() => assertParkDecision(f.delivery, f.job, parked))).rejects.toThrow(error);
    await expect(f.run(() => assertParkDecision(f.delivery, f.job, parked))).rejects.toBeInstanceOf(ParkSuperseded);
});

test.each([
    ['pickup turned off', (f: ReturnType<typeof metadataParkFixture>) => { f.store.state.coordination!.pickup = { enabled: false, status: 'Ready' }; }, 'automatic pickup is turned off'],
    ['the pickup option replaced', (f: ReturnType<typeof metadataParkFixture>) => { f.state.lanes.find(lane => lane.id === 'ready')!.id = 'ready-2'; }, 'the pickup lane, which was Ready, changed'],
    ['the In review option replaced', (f: ReturnType<typeof metadataParkFixture>) => { f.state.lanes.find(lane => lane.id === 'review')!.id = 'review-2'; }, 'the In review lane changed'],
    ['the PR card gone', (f: ReturnType<typeof metadataParkFixture>) => { f.state.cards.splice(1, 1); }, "the pull request's card changed"],
    ['the issue unassigned', (f: ReturnType<typeof metadataParkFixture>) => { f.state.issue.assignees = []; }, 'not assigned to JFusco'],
] as const)('a route with %s names what to restore', async (_name, change, error) => {
    const { f, parked } = await recorded();
    change(f);
    const route = f.run(() => assertParkRoute(f.delivery, f.job, parked));
    await expect(route).rejects.toThrow(error);
    await expect(route).rejects.toBeInstanceOf(ParkNeedsRestore);
});
