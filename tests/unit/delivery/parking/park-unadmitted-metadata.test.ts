import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { addMetadataHumanInput } from '../../../fixtures/pr-metadata';

test.each([true, false])('the saved decision parks with its own words: cards in Block first, one comment last (PR card %s)', async prCard => {
    const f = metadataParkFixture({ prCard });
    await f.parkNow();
    expect(f.job).toMatchObject({ status: 'blocked', parked: { stage: 'lead-pr', published: true, marker: `Office decision ${f.job.id}:1` } });
    expect(f.state.comments).toHaveLength(1);
    expect(f.state.comments[0].body).toBe(`Office decision ${f.job.id}:1: ${f.job.parked!.reason}\n\n${f.job.parked!.instruction}`);
    expect(f.job.parked!.reason).toBe("PR #200 needs an edit to its title that the Office may not make itself. The edit Sam's review asks for: Remove [skip release] from the title.");
    expect(f.blockMoves()).toEqual(prCard ? ['issue-card>block', 'pr-card>block'] : ['issue-card>block']);
    expect(f.job.parked!.metadata).toMatchObject({ step: 0, resultSha256: f.decision.resultSha256, inputSha256: f.decision.inputSha256, boardStart: 0, observed: [],
        pr: { number: 200, url: f.job.prUrl, head: f.job.head, branch: f.job.branch }, route: { prs: prCard ? ['pr-card'] : [] } });
});

test('a decision that is not the saved review of the job writes nothing', async () => {
    for (const [name, change, error] of [
        ['another step', (f: any) => { f.job.steps.push({ stage: 'lead-pr', result: f.result }); }, 'no longer the saved review'],
        ['another head', (f: any) => { f.decision.pr.head = 'c'.repeat(40); }, 'no longer the saved review'],
        ['another pull request', (f: any) => { f.decision.pr.number = 201; }, 'no longer the saved review'],
        ['another stage', (f: any) => { f.job.stage = 'prepare-pr'; }, 'no longer the saved review'],
        ['a parked job', (f: any) => { f.job.parked = { stage: 'lead-pr', reason: '', at: '', published: false }; }, 'no longer the saved review'],
        ['a changed saved result', (f: any) => { f.job.steps[0].result = { ...f.result, summary: 'other' }; }, 'no longer the saved review'],
        ['another result digest', (f: any) => { f.decision.resultSha256 = 'x'; }, 'no longer the saved review'],
        ['new human input', (f: any) => { addMetadataHumanInput(f); }, 'New human input arrived after the review'],
    ] as const) {
        const f = metadataParkFixture();
        change(f);
        await expect(f.parkNow(), name).rejects.toThrow(error);
        expect(f.writes.moves, name).toEqual([]); expect(f.writes.posts, name).toEqual([]);
        expect(f.lane('issue-card'), name).toBe('review');
    }
});

test.each([
    ['pickup off', (f: ReturnType<typeof metadataParkFixture>) => { f.store.state.coordination!.pickup = { enabled: false, status: 'Ready' }; }, 'It was not parked: automatic pickup is turned off, so moving a card cannot resume it. Edit the PR'],
    ['Block as pickup', (f: ReturnType<typeof metadataParkFixture>) => { f.store.state.coordination!.pickup = { enabled: true, status: 'Block' }; }, 'the pickup lane "Block" is not one a fresh review starts from'],
    ['a padded pickup name', (f: ReturnType<typeof metadataParkFixture>) => { f.store.state.coordination!.pickup = { enabled: true, status: 'Ready ' }; }, 'the pickup lane "Ready " is not one a fresh review starts from'],
    ['a closed issue', (f: ReturnType<typeof metadataParkFixture>) => { f.state.issue.state = 'closed'; }, 'It was not parked: the issue is closed'],
    ['an unassigned issue', (f: ReturnType<typeof metadataParkFixture>) => { f.state.issue.assignees = []; }, 'the issue is not assigned to JFusco'],
    ['an adopted PR whose issue lost its assignment', (f: ReturnType<typeof metadataParkFixture>) => { f.job.existingPR = true; f.state.issue.assignees = []; }, 'the issue is not assigned to JFusco'],
    ['no In review lane', (f: ReturnType<typeof metadataParkFixture>) => { f.state.lanes = f.state.lanes.filter(lane => lane.id !== 'review'); }, 'Leave exactly one In review lane on the board, edit the PR, then ask for a fresh review with review-pr.'],
    ['two In review lanes', (f: ReturnType<typeof metadataParkFixture>) => { f.state.lanes.push({ id: 'review-2', name: 'In Review' }); }, 'the board has 2 In review lanes'],
    ['no issue card', (f: ReturnType<typeof metadataParkFixture>) => { f.state.cards.splice(0, 1); }, 'Put the issue card back on the board, edit the PR, then ask for a fresh review with review-pr.'],
] as const)('without a board route that can resume it (%s), the job stops with the edit and nothing is written', async (_name, change, error) => {
    const f = metadataParkFixture();
    change(f);
    await expect(f.parkNow()).rejects.toThrow(error);
    await expect(f.parkNow()).rejects.toThrow("The edit Sam's review asks for: Remove [skip release] from the title.");
    expect(f.job.parked).toBeUndefined(); expect(f.writes.moves).toEqual([]); expect(f.writes.posts).toEqual([]);
});

test('a failed provider read during route discovery is an error: nothing is parked or written', async () => {
    const f = metadataParkFixture();
    f.hooks.before = call => { if (String(call.request?.query).includes('items(first')) throw new Error('gh: HTTP 502 Bad Gateway'); };
    await expect(f.parkNow()).rejects.toThrow('HTTP 502');
    expect(f.job.parked).toBeUndefined(); expect(f.writes.moves).toEqual([]); expect(f.writes.posts).toEqual([]);
});

test.each([
    ['a same-head title edit during route discovery', (f: ReturnType<typeof metadataParkFixture>) => { f.pr.title = 'docs: Joe edited it'; }, 'it was edited after the review'],
    ['a same-head body edit during route discovery', (f: ReturnType<typeof metadataParkFixture>) => { f.pr.body = 'Closes #5\nedited'; }, 'it was edited after the review'],
    ['a close without a text change', (f: ReturnType<typeof metadataParkFixture>) => { f.pr.state = 'closed'; }, 'it is no longer open'],
    ['a merge without a text change', (f: ReturnType<typeof metadataParkFixture>) => { (f.pr as any).merged_at = '2026-11-24T00:00:00Z'; }, 'it is no longer open'],
    ['human input during route discovery', (f: ReturnType<typeof metadataParkFixture>) => { addMetadataHumanInput(f); }, 'New human input arrived after the review'],
] as const)('a decision known to be stale after the route reads records no park and sends nothing: %s', async (_name, change, error) => {
    const f = metadataParkFixture();
    f.hooks.after = call => { if (String(call.request?.query).includes('items(first')) change(f); };
    await expect(f.parkNow()).rejects.toThrow(error);
    expect(f.job.parked).toBeUndefined(); expect(f.writes.moves).toEqual([]); expect(f.writes.posts).toEqual([]);
});
