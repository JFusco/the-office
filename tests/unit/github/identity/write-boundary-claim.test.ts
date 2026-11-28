import { afterEach, expect, test } from 'vitest';
import { executeGitHubWrite } from '../../../../server/github/identity/write-boundary';
import { WriterRefused } from '../../../../server/store/effects';
import { appConfig, closeId, issueUrl, JOB, routeFixture, type RouteFixture } from './support/route-fixture';

let f: RouteFixture;
afterEach(() => f?.cleanup());

/** One issue close through the boundary, with a caller claim and a preflight hook; counts dispatches and claim calls. */
function close(issue: number, claim: () => string | undefined, preflight: () => void = () => {}) {
    const calls = { dispatched: 0, claimed: 0 };
    const run = executeGitHubWrite(f.store, {
        id: closeId(issue), work: { projectId: f.store.project.id, kind: 'delivery', id: JOB.id }, attemptId: JOB.id, operation: 'github-issue-close',
        target: issueUrl(issue), authorization: 'office-harness', payload: { issue }, expectedState: { key: `issue-close:${issue}` },
        preflight: async () => preflight(),
        claim: () => { calls.claimed++; return claim(); },
        dispatch: async () => { calls.dispatched++; return { issue, closed: true }; },
        verify: async () => true,
    }, { preState: async () => null });
    return { run, calls };
}

test('a caller claim runs after the writer checks and its refusal rejects the intent unsent', async () => {
    f = routeFixture();
    const refused = close(5, () => 'the caller refused at the claim');
    await expect(refused.run).rejects.toThrow(WriterRefused);
    expect(refused.calls).toEqual({ dispatched: 0, claimed: 1 });
    expect(f.store.getEffect(closeId(5))).toMatchObject({ status: 'rejected', dispatchedAt: '', error: 'the caller refused at the claim', writerRefusedAt: expect.any(String) });
    const admitted = close(6, () => undefined);
    await expect(admitted.run).resolves.toEqual({ issue: 6, closed: true });
    expect(admitted.calls).toEqual({ dispatched: 1, claimed: 1 });
});

test('a writer the route no longer authorizes is refused first: the caller claim is never asked', async () => {
    f = routeFixture();
    f.setConfig(appConfig({ 'issue-close': f.qualify(5) }));
    const { run, calls } = close(5, () => undefined, () => f.setConfig(undefined));
    await expect(run).rejects.toThrow(/the route now selects the operator/);
    expect(calls).toEqual({ dispatched: 0, claimed: 0 });
});
