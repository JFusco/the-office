import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from '../support/fake-github';
import { fakeBotPR, H1, H2 } from '../support/fake-bot-pr';
import { assertAutomationEffects } from '../../../../server/delivery/readiness/automation-effects';
import { redoBase } from '../../../../server/delivery/repairs/bot-redo/ledger';
import type { EffectIntent } from '../../../../src/shared';

afterEach(cleanupFakes);

function fixture(status: EffectIntent['status'] = 'uncertain', job = 'earlier-job') {
    const f = fakeBotPR('dependabot'), id = redoBase(f.store, 200, H1);
    f.store.putEffect({ id, work: { projectId: f.store.project.id, kind: 'delivery', id: job }, attemptId: job, operation: 'github-pr-comment', target: f.pr.html_url, authorization: 'office-harness',
        payload: { project: f.store.project.id, repository: f.store.project.repository, pr: 200, sha: H1, adoption: 'adoption-200', issue: 5, bot: 'dependabot', branch: f.job.branch, target: 'main', route: 'dependabot-rebase', args: [] },
        expectedState: {}, status, createdAt: '', dispatchedAt: status === 'prepared' ? '' : '2026-11-25T00:00:00Z', verifiedAt: '', receipt: null, error: 'HTTP 403', elapsedMs: 0 });
    f.adoption.redos = [{ sha: H1, pr: 200, issue: 5, bot: 'dependabot', branch: f.job.branch, issueUrl: `https://github.com/${f.store.project.repository}/issues/5`, firstSeenAt: '', effectId: id }];
    const settle = () => { f.adoption.redos![0].settled = { effectId: id, project: f.store.project.id, repository: f.store.project.repository, pr: 200, adoption: 'adoption-200', bot: 'dependabot', sha: H1, replacement: H2, at: '', evidence: '', cause: 'unknown' }; };
    return { ...f, id, settle, check: (active?: string) => () => assertAutomationEffects(f.store, f.job, false, active) };
}

test('an unread redo request from another job blocks this PR’s automation writes', () => {
    expect(fixture().check()).toThrow('Unresolved external writes');
});

test('the same request is history once its exact settlement is saved; the row itself is unchanged', () => {
    const f = fixture();
    f.settle();
    expect(f.check()).not.toThrow();
    expect(f.store.getEffect(f.id)).toMatchObject({ status: 'uncertain', error: 'HTTP 403', receipt: null });
});

test('a dispatching redo stays blocking even if it has a settlement', () => {
    const f = fixture('dispatching');
    f.settle();
    expect(f.check()).toThrow('Unresolved external writes');
});

test.each<[string, (f: ReturnType<typeof fixture>) => void]>([
    ['another request', f => { f.adoption.redos![0].settled!.effectId = `${f.id}:retry-1`; }],
    ['another head', f => { f.adoption.redos![0].settled!.sha = H2; }],
    ['no replacement', f => { f.adoption.redos![0].settled!.replacement = H1; }],
    ['another adoption', f => { f.adoption.redos![0].settled!.adoption = 'other'; }],
    ['another bot', f => { f.adoption.redos![0].settled!.bot = 'pin-courier'; }],
    ['a withdrawn adoption', f => { f.adoption.status = 'withdrawn'; }],
])('a settlement naming %s leaves the request blocking', (_kind, change) => {
    const f = fixture();
    f.settle(); change(f);
    expect(f.check()).toThrow('Unresolved external writes');
});

test('only the exact unsent preparation being guarded is exempt', () => {
    const prepared = fixture('prepared');
    expect(prepared.check()).toThrow('Unresolved external writes');
    expect(prepared.check(prepared.id)).not.toThrow();
    expect(prepared.check(`${prepared.id}:retry-1`)).toThrow('Unresolved external writes');
    cleanupFakes();
    const sent = fixture('uncertain');
    expect(sent.check(sent.id)).toThrow('Unresolved external writes');
});
