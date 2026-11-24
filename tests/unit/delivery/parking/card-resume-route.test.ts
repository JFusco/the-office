import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { cardResumeRoute } from '../../../../server/delivery/parking/card-resume-route';
afterEach(cleanupFakes);

test('a configured board with one pickup lane, one Block lane and the issue card can resume a park', async () => {
    const f = fakeGitHub(), job = f.candidate();
    expect(await cardResumeRoute(f.store, f.execute as any, job)).toEqual({ pickup: 'Ready' });
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    expect(await cardResumeRoute(f.store, f.execute as any, job)).toEqual({ pickup: 'Ready' });
});

test('anything a card-driven resume needs that is absent is named, and nothing is written', async () => {
    for (const [name, change, missing] of [
        ['no board', (f: any) => { delete f.store.project.githubProject; }, 'this project has no configured board'],
        ['pickup off', (f: any) => { f.store.state.coordination.pickup.enabled = false; }, 'automatic pickup is turned off'],
        ['no pickup lane', (f: any) => { f.store.state.coordination.pickup.status = 'Todo'; }, 'the board has 0 "Todo" lanes, not one'],
        ['two Block lanes', (f: any) => { f.state.lanes.push({ id: 'blocked', name: 'Blocked' }); }, 'the board has 2 Block lanes, not one'],
        ['no issue card', (f: any) => { f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' }]; }, 'the issue has no card on the board'],
    ] as const) {
        const f = fakeGitHub(), job = f.candidate();
        change(f);
        const cards = JSON.stringify(f.state.cards);
        expect(await cardResumeRoute(f.store, f.execute as any, job), name).toEqual({ missing });
        expect(JSON.stringify(f.state.cards), name).toBe(cards);
        expect(f.state.comments, name).toEqual([]);
    }
});
