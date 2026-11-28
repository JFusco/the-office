import { expect, test } from 'vitest';
import { cmsOwner, versionedAt, weeklyContext } from '../../../../server/maintenance/publication/weekly-context';
import { HOST_ENVIRONMENT } from '../../../../server/workers/launch-qualification';
import { UNREVIEWED_LINT_ISOLATION } from '../../../../server/maintenance/publication/lint-isolation';

test('the weekly context carries the pump cursor and the qualification environment; the owner is the run\'s maintenance claim', () => {
    let cursor = 2;
    const store: any = { state: { paused: false } }, run: any = { id: 'r', steps: [{}, { publicationVersion: 1 }, {}] };
    const ctx = weeklyContext({ store, agents: { run: async () => ({}) } as any, execute: (async () => '') as any }, run, '/root', () => cursor);
    expect(ctx.qualification).toBe(HOST_ENVIRONMENT);
    // The production lint gate unless the maintenance instance carries another.
    expect(ctx.lintIsolation).toBe(UNREVIEWED_LINT_ISOLATION);
    const open = () => undefined;
    expect(weeklyContext({ store, agents: { run: async () => ({}) } as any, execute: (async () => '') as any, lintIsolation: open }, run, '/root', () => cursor).lintIsolation).toBe(open);
    expect(ctx.at()).toBe(2); cursor = 3; expect(ctx.at()).toBe(3);
    expect([versionedAt(ctx, 1), versionedAt(ctx, 2), versionedAt(ctx, 9)]).toEqual([true, false, false]);
    const owner = cmsOwner(ctx, 'k', 5);
    expect(owner).toMatchObject({ run, claim: 'maintenance', subject: 'k', issue: 5 });
    expect(owner.current()).toBeUndefined();
    store.state.paused = true;
    expect(owner.current()).toMatch(/paused/);
});
