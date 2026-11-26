import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../support/fake-github';
import { intakeUnderWay } from '../../../../server/delivery/intake/intake-under-way';
import { adoptDependabot } from '../../../../server/delivery/intake/dependabot/adopt';
import { trackDependabotAlerts } from '../../../../server/delivery/intake/dependabot/track-alerts';
import type { DependabotAdoption, DependabotAlertIssue, EffectIntent } from '../../../../src/shared';
afterEach(cleanupFakes);

const adoption = (id: string, pr: number, status: DependabotAdoption['status'], issue = 0): DependabotAdoption => ({ id, pr, url: '', title: 'Bump', issue, status, detail: '', at: '' });
const alert = (id: string, number: number, status: DependabotAlertIssue['status']): DependabotAlertIssue => ({ id, alert: number, package: 'eslint', issue: 0, status, detail: '', at: '' });
function unsettled(f: ReturnType<typeof fakeGitHub>, attemptId: string, status: EffectIntent['status'] = 'uncertain') {
    f.store.putEffect({ id: `harness:${attemptId}:write`, work: { projectId: f.store.project.id, kind: 'delivery', id: attemptId }, attemptId, operation: 'github-pr-body', target: 'pr', authorization: 'office-harness',
        payload: {}, expectedState: {}, status, createdAt: '', dispatchedAt: '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
}

test('work under way is a started record, one that owns an unsettled Effect, or an adopted PR whose delivery is live', () => {
    const f = fakeGitHub();
    f.store.state.coordination!.adoptions = [adoption('adopting', 1, 'adopting'), adoption('blocked', 2, 'blocked'), adoption('uncertain', 3, 'blocked'), adoption('verified', 4, 'blocked'),
        { ...adoption('live', 5, 'adopted', 5), bot: 'wiki-sync' }, { ...adoption('done', 6, 'adopted', 6), bot: 'pin-courier' }];
    f.store.state.coordination!.alertIssues = [alert('tracking', 10, 'tracking'), alert('tracked', 11, 'tracked'), alert('alert-uncertain', 12, 'blocked')];
    unsettled(f, 'uncertain'); unsettled(f, 'verified', 'verified'); unsettled(f, 'alert-uncertain', 'dispatching');
    const jobs = [{ key: 'GH-5', pr: 5, status: 'running' }, { key: 'GH-6', pr: 6, status: 'completed' }] as any;
    const underWay = intakeUnderWay(f.store, jobs), records = f.store.state.coordination!.adoptions;
    expect(records.filter(underWay.adoption).map(record => record.id)).toEqual(['adopting', 'uncertain']);
    expect([underWay.bot('dependabot'), underWay.bot('wiki-sync'), underWay.bot('pin-courier')]).toEqual([true, true, false]);
    expect(f.store.state.coordination!.alertIssues.filter(underWay.alert).map(record => record.id)).toEqual(['tracking', 'alert-uncertain']);
    expect(underWay.alerts()).toBe(true);
});

test('scoped to work under way, adoption takes up no new PR and alert tracking no new alert', async () => {
    const f = fakeGitHub();
    f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 121, status: 'ready' }];
    f.state.prs.push({ number: 121, html_url: `https://github.com/${REPOSITORY}/pull/121`, state: 'open', draft: false, user: { login: 'dependabot[bot]' }, title: 'bump', body: 'Updates `eslint`',
        head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/eslint', repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null });
    f.state.prCommits[121] = ['dependabot[bot]'];
    // An alert no Dependabot PR answers, a day old: due unless the pass is scoped.
    const open = { number: 22, state: 'open', created_at: '2026-01-01T00:00:00Z', dependency: { package: { name: 'lodash', ecosystem: 'npm' } }, security_advisory: { severity: 'low' } };
    const execute = async (program: string, args: string[], options?: any) => args[1]?.includes('dependabot/alerts?') ? JSON.stringify([[open]]) : f.execute(program, args, options);
    const none = () => false, pickup = f.store.state.coordination!.pickup!;
    await adoptDependabot(f.store, execute as any, f.delivery.jobs, pickup, undefined, none);
    await trackDependabotAlerts(f.store, execute as any, f.delivery.jobs, pickup, new Date('2026-11-26T13:00:00Z'), undefined, none);
    expect(f.store.state.coordination!.adoptions).toEqual([]);
    expect(f.store.state.coordination!.alertIssues).toEqual([]);
    expect(f.state.calls.filter(call => /POST|PATCH/.test(call))).toEqual([]);
    // Unscoped, the same pass adopts the PR.
    await adoptDependabot(f.store, execute as any, f.delivery.jobs, pickup);
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ pr: 121, status: 'adopted' }]);
});

test('beside work under way, a new PR in the pickup lane and a new due alert are left for after the hold', async () => {
    const f = fakeGitHub();
    f.state.cards = [{ id: 'card-121', kind: 'PullRequest', number: 121, status: 'ready' }, { id: 'card-122', kind: 'PullRequest', number: 122, status: 'ready' }];
    for (const number of [121, 122]) {
        f.state.prs.push({ number, html_url: `https://github.com/${REPOSITORY}/pull/${number}`, state: 'open', draft: false, user: { login: 'dependabot[bot]' }, title: `bump ${number}`, body: 'Updates `eslint`',
            head: { sha: HEAD, ref: `dependabot/npm_and_yarn/eslint-${number}`, repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null });
        f.state.prCommits[number] = ['dependabot[bot]'];
    }
    f.store.state.coordination!.adoptions = [{ ...adoption('started', 121, 'adopting'), url: `https://github.com/${REPOSITORY}/pull/121` }];
    f.store.state.coordination!.alertIssues = [alert('dependabot-alert-22', 22, 'tracking')];
    const due = (number: number, name: string) => ({ number, state: 'open', created_at: '2026-01-01T00:00:00Z', dependency: { package: { name, ecosystem: 'npm' } }, security_advisory: { severity: 'low' } });
    const execute = async (program: string, args: string[], options?: any) => args[1]?.includes('dependabot/alerts?') ? JSON.stringify([[due(22, 'lodash'), due(23, 'minimist')]]) : f.execute(program, args, options);
    const underWay = intakeUnderWay(f.store, f.delivery.jobs), pickup = f.store.state.coordination!.pickup!;
    await adoptDependabot(f.store, execute as any, f.delivery.jobs, pickup, undefined, underWay.adoption);
    expect(f.store.state.coordination!.adoptions).toMatchObject([{ id: 'started', pr: 121, status: 'adopted' }]);
    expect(f.state.calls.filter(call => call.includes('pulls/122'))).toEqual([]);
    await trackDependabotAlerts(f.store, execute as any, f.delivery.jobs, pickup, new Date('2026-11-26T13:00:00Z'), undefined, underWay.alert);
    expect(f.store.state.coordination!.alertIssues!.map(record => record.alert)).toEqual([22]);
    expect(f.store.state.coordination!.alertIssues![0].status).not.toBe('tracking');
});
