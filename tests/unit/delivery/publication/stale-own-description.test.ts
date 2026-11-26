import { realpathSync } from 'node:fs';
import { expect, test, vi } from 'vitest';
import { staleOwnDescription } from '../../../../server/delivery/publication/stale-own-description';
import { bindMetadata } from '../../../../server/delivery/publication/metadata-context';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { CommandFailure } from '../../../../server/workers/process';
import { INCIDENTS, RUN, staleFixture, type IncidentKey } from '../../../fixtures/stale-description';
import type { Finding } from '../../../../src/shared';

const home = vi.hoisted(() => ({ path: '' }));
vi.mock('node:os', async original => ({ ...await original<typeof import('node:os')>(), homedir: () => home.path }));

/** The incident's final review read against its live PR; `change` edits the saved steps first. */
async function decide(key: IncidentKey, change: (f: ReturnType<typeof staleFixture>) => void = () => {}, options: Parameters<typeof staleFixture>[1] = {}) {
    const f = staleFixture(key, options); home.path = f.home;
    change(f);
    const others = f.review.findings.filter((x: Finding) => x.status === 'open' && x.id !== 'pr-metadata');
    const claim = f.leadClaim(), record = bindMetadata(f.delivery, f.job, f.pr, ['pr-metadata'], 'lead-pr');
    const run = (reviewed: any = structuredClone(f.pr)) => withAssignment(claim, 'delivery', () => staleOwnDescription(f.delivery, f.job, others, record, reviewed));
    return { f, run, others };
}

test('GH-193: the run\'s own description for 8cab916, an ancestor of 074eedf in the job\'s checkout, is stale', async () => {
    const { f, run } = await decide('GH-193'), i = INCIDENTS['GH-193'], decision = await run();
    expect(decision).toMatchObject({ stale: true, proof: { route: 'stale-own-description', head: i.published,
        source: { kind: 'maintenance', runId: RUN, step: 5, workerId: i.draft.worker }, revision: { edits: 0, lastEditId: null, lastEditedAt: null } } });
    expect(f.ancestry.calls).toEqual([['merge-base', '--is-ancestor', i.published, i.head]]);
    // No fetch, no write: only reads of the existing checkout and the provider.
    expect(f.state.calls.filter(c => /fetch|PATCH|POST|push/.test(c))).toEqual([]);
    expect(realpathSync(f.job.worktree)).toBeTruthy();
});

test('git exit 1 is a stable refusal; exit 128 and every other failure stay errors', async () => {
    const not = await decide('GH-193', () => {}, { ancestry: 'not-ancestor' });
    expect(await not.run()).toEqual({ stale: false, reason: 'the head the description was written for is not an ancestor of the current head' });
    const missing = await decide('GH-193', () => {}, { ancestry: 'missing' });
    await expect(missing.run()).rejects.toThrow(/^git exited 128: fatal: Not a valid commit name/);
    const interrupted = await decide('GH-193');
    const execute = interrupted.f.delivery.execute;
    interrupted.f.delivery.execute = (async (program, args, options) => {
        if (program === 'git' && args[0] === 'merge-base') { const e = new CommandFailure('git exited 1: ', 'other', true); e.interrupted = true; throw e; }
        return execute(program, args, options);
    }) as typeof execute;
    await expect(interrupted.run()).rejects.toThrow('git exited 1');
});

test('a description written for the current head is not stale, and Git is never asked', async () => {
    const { f, run } = await decide('GH-193', g => {
        const i = INCIDENTS['GH-193'];
        g.job.head = g.pr.head.sha = g.state.local.head = i.published;
    });
    expect(await run()).toEqual({ stale: false, reason: 'the description was written for the current head' });
    expect(f.ancestry.calls).toEqual([]);
});

test('GH-195: the advisory the passed review and validation carried may sit beside the reserved finding', async () => {
    const { run, others } = await decide('GH-195');
    expect(others.map(x => x.id)).toEqual(['refresh-pr-description']);
    expect(await run()).toMatchObject({ stale: true, proof: { head: INCIDENTS['GH-195'].published, source: { step: 9 } } });
});

test('a validation-only advisory from an accepted pass is carried too', async () => {
    const { run } = await decide('GH-195', f => { f.job.steps[4].result.findings = f.job.steps[4].result.findings.filter(x => x.id !== 'refresh-pr-description'); });
    expect(await run()).toMatchObject({ stale: true });
});

test.each<[string, (f: ReturnType<typeof staleFixture>) => void]>([
    ['a new companion finding', f => { f.review.findings.push({ id: 'source-defect', status: 'open', summary: 'Source defect', expected: '', actual: '', attempts: 0 }); }],
    ['an ID an earlier QA result raised', f => { f.job.steps.splice(3, 0, { stage: 'validate', result: { ...f.job.steps[5].result, outcome: 'failed', commit: INCIDENTS['GH-195'].published } }); }],
    ['an ID a repair is still answering', f => { f.job.repairCycle!.pendingFindingIds = ['refresh-pr-description']; }],
    ['an ID only another head carried', f => { f.job.steps[4].result.commit = f.job.steps[5].result.commit = INCIDENTS['GH-195'].published; }],
])('%s is not carried, so the description is left for a person', async (_name, change) => {
    const { f, run } = await decide('GH-195', change);
    expect(await run()).toEqual({ stale: false, reason: 'another open finding is not an advisory the saved steps carried' });
    expect(f.ancestry.calls).toEqual([]); expect(f.state.calls.filter(c => c.startsWith('gh api graphql'))).toEqual([]);
});

test('a review that read other bytes, or an unattributable description, is refused before Git', async () => {
    const other = await decide('GH-193');
    expect(await other.run({ ...structuredClone(other.f.pr), body: 'What Sam read' })).toEqual({ stale: false, reason: 'the review read another head or other description bytes' });
    const unattributed = await decide('GH-193', f => { f.maintenance.status = 'blocked'; });
    expect(await unattributed.run()).toMatchObject({ stale: false, reason: expect.stringMatching(/^no Office write is recorded and no completed maintenance draft step/) });
    expect(unattributed.f.ancestry.calls).toEqual([]);
});
