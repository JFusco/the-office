import { afterEach, expect, test } from 'vitest';
import { draftRetryAdmission } from '../../../../server/delivery/attempts/draft-retry';
import { shallowBoundaries, walkCommits } from '../../../../server/delivery/publication/original-git';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { unmarkedHistory } from '../support/marker-repo';
import { unsettledEffects } from '../../../../server/operations/unsettled-effects';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { APPROACH, update } from '../attempts/retry-fixture';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';

afterEach(cleanupFakes);
const typed = (promise: Promise<unknown>) => promise.then(() => { throw new Error('expected a refusal'); }, (error: unknown) => { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; });

test('a local history read that fails is a typed indeterminate refusal, never an untyped stop', async () => {
    const failing = (async () => { throw new Error('fatal: bad object'); }) as any;
    expect(await typed(shallowBoundaries(failing, '/repo'))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('could not be read: fatal: bad object') });
    expect(await typed(walkCommits(failing, 'a'.repeat(40), []))).toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining('the local history of') });
    const shallow = (async (args: string[]) => args[1] === '--is-shallow-repository' ? 'true\n' : '/nowhere/shallow\n') as any;
    expect(await typed(shallowBoundaries(shallow, '/repo'))).toMatchObject({ diagnostic: expect.stringContaining('the shallow boundary file of /repo could not be read') });
    expect(unmarkedHistory('git', ['rev-parse', '--is-shallow-repository'])).toBe('false\n');
});

/** A hands-off draft ready to publish, stepped through the ordinary entrypoint. */
function draft(fail: (program: string, args: string[]) => boolean | string) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft', approach: { ...APPROACH, checks: [...APPROACH.checks] }, boardUpdates: [update({ stage: 'implement', option: 'progress', target: 'In progress' })] } as any);
    f.state.fail = fail;
    return { f, job, step: () => claimedDelivery(f.store, job, () => f.delivery.step(job)), pushRows: () => [0, 1].map(n => f.store.getEffect(`harness:${job.id}:push:${HEAD}${n ? `:retry-${n}` : ''}`)).filter(Boolean) };
}

test('a failed local walk during publication persists a release-marker stop with zero push intents; a transient provider read keeps its retry route', async () => {
    const local = draft((program, args) => program === 'git' && args[0] === 'log' && args[1] === '-z' ? 'fatal: unable to read 1234abcd' : false);
    await local.step();
    expect(local.job).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('the local history of') } } });
    expect(local.pushRows()).toEqual([]);
    expect(local.f.state.calls.some(call => call.startsWith('git push'))).toBe(false);
    expect(draftRetryAdmission(local.f.store, local.job, unsettledEffects(local.f.store))).toEqual({ refused: 'A release-marker refusal needs a decision' });
    const provider = draft((program, args) => program === 'git' && args[0] === 'ls-remote' ? 'git ls-remote exited 128: fatal: unable to access https://github.com/: The requested URL returned error: HTTP 502' : false);
    await provider.step();
    expect(provider.job).toMatchObject({ status: 'blocked', stop: { kind: 'transient' } });
    expect(provider.pushRows()).toEqual([]);
    expect(draftRetryAdmission(provider.f.store, provider.job, unsettledEffects(provider.f.store))).toMatchObject({ mode: 'draft' });
});
