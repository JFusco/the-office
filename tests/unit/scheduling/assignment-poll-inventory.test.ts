import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../delivery/support/fake-github';
import { Coordinator } from '../../../server/scheduling/coordination';
import { noticeState } from '../../../server/conversations/notifications';
import { currentGitHubSource } from '../../../server/github/call-scope';
afterEach(cleanupFakes);

const LIST = `repos/${REPOSITORY}/pulls?state=open&per_page=100`;
const ready = { key: 'GH-5', summary: 'Restore', url: `https://github.com/${REPOSITORY}/issues/5`, assignee: 'JFusco', status: 'open', statusId: '', updated: '', type: 'GitHub issue', subtask: false, pickupStatus: 'Ready' };
const pull = (number: number, extra: Record<string, any>) => ({ number, html_url: `https://github.com/${REPOSITORY}/pull/${number}`, state: 'open', draft: false, merged_at: null,
    user: { login: 'someone' }, title: `PR ${number}`, body: '', head: { sha: HEAD, ref: `branch-${number}`, repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, ...extra });

/**
 * A hands-off poll over the shared GitHub double, with the open-PR list split across two pages and every call
 * recorded with the source it ran under. `options.pages` replaces the page split; `options.alerts` answers the alert list.
 */
function poll(options: { pages?: (open: any[]) => unknown; alerts?: any[]; noNativeLinks?: boolean } = {}) {
    const f = fakeGitHub(), calls: { source: string; line: string }[] = [];
    const execute = async (program: string, args: string[], rest: any) => {
        calls.push({ source: currentGitHubSource(), line: `${program} ${args.join(' ')}${String(rest?.input || '').includes('mutation') ? ' mutation' : ''}` });
        if (program === 'gh' && args[1] === LIST) {
            const open = f.state.prs.filter(p => p.state === 'open');
            return JSON.stringify(options.pages ? options.pages(open) : [open.slice(0, 1), open.slice(1)]);
        }
        if (program === 'gh' && args[1]?.includes('dependabot/alerts?') && options.alerts) return JSON.stringify([options.alerts]);
        if (program === 'gh' && args[0] === 'pr' && args[1] === 'view' && options.noNativeLinks) return JSON.stringify({ closingIssuesReferences: [] });
        return (f.execute as any)(program, args, rest);
    };
    const c = new Coordinator(f.store, f.engine, execute as any);
    c.activate(new Date('2026-10-31T12:00:00Z'));
    c.readAssignments = async () => [ready];
    f.engine.agents.run = async () => { throw new Error('No model run expected'); };
    const traversals = () => calls.filter(call => call.line === `gh api ${LIST} --paginate --slurp`).length;
    const writes = () => calls.filter(call => /POST|PATCH|DELETE|mutation/.test(call.line));
    return { f, c, calls, traversals, writes };
}

test('a write-free poll traverses the open-PR list once for every reader, and they all see page two', async () => {
    const alert = { number: 22, state: 'open', created_at: '2026-01-01T00:00:00Z', dependency: { package: { name: 'eslint', ecosystem: 'npm' } }, security_advisory: { severity: 'low' } };
    const x = poll({ alerts: [alert] });
    // Page one: someone else's PR. Page two: Dependabot's answer to the alert, and the PR that closes #5.
    x.f.state.prs.push(pull(300, {}),
        pull(121, { user: { login: 'dependabot[bot]' }, title: 'chore(deps-dev): bump eslint from 10.3.0 to 10.4.0', head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/eslint', repo: { full_name: REPOSITORY } } }),
        pull(119, { body: 'Closes #5', head: { sha: HEAD, ref: 'codex/5-restore', repo: { full_name: REPOSITORY } } }));
    noticeState(x.f.store).policy = { enabled: true, recipients: 'assignee', workspace: 'Verndale', mappings: '', enabledAt: '2026-01-01T00:00:00Z' };
    await x.c.poll(new Date('2026-10-31T12:01:00Z'));
    expect(x.c.state.listener.error).toBe('');
    expect(x.c.state.jobs).toMatchObject([{ key: 'GH-5', pr: 119, stage: 'prepare-pr', existingPR: true }]);
    expect(x.f.store.state.coordination!.alertIssues ?? []).toEqual([]);
    expect(x.traversals()).toBe(1);
    // Dependency refresh and merge notices found the routed PR in the inventory: neither read anything.
    expect(x.calls.filter(call => ['dependency-refresh', 'merge-notices'].includes(call.source))).toEqual([]);
    expect(x.writes()).toEqual([]);
});
test('an incomplete list admits nothing, withdraws nothing, and is not traversed again in the same pass', async () => {
    const x = poll({ pages: open => [open, { message: 'Server Error' }] });
    x.f.state.prs.push(pull(119, { body: 'Closes #5', head: { sha: HEAD, ref: 'codex/5-restore', repo: { full_name: REPOSITORY } } }));
    x.f.store.state.coordination!.adoptions = [{ id: 'refused', pr: 121, url: `https://github.com/${REPOSITORY}/pull/121`, title: 'bump', issue: 0, status: 'refused', detail: 'Refused earlier.', at: '' }];
    await x.c.poll(new Date('2026-10-31T12:01:00Z'));
    expect(x.c.state.listener.error).toContain('incomplete');
    expect(x.c.state.jobs).toEqual([]);
    expect(x.f.store.state.coordination!.adoptions).toMatchObject([{ id: 'refused', status: 'refused' }]);
    expect(x.traversals()).toBe(1);
    expect(x.writes()).toEqual([]);
});
test('a PR-body PATCH makes the next reader traverse the list again, so discovery sees the new closing directive', async () => {
    // Before a PR targets the default branch GitHub reports no closing references: only the body links it.
    const x = poll({ noNativeLinks: true });
    x.c.readAssignments = async () => [{ ...ready, pickupStatus: 'In review' }];
    x.f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 121, status: 'ready' }];
    Object.assign(x.f.state.issue, { body: '', assignees: [] });
    x.f.state.prs.push(pull(300, {}), pull(121, { user: { login: 'dependabot[bot]' }, title: 'chore(deps-dev): bump eslint', body: 'Updates `eslint`', head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/eslint', repo: { full_name: REPOSITORY } } }));
    x.f.state.prFiles[121] = ['package.json']; x.f.state.prCommits[121] = ['dependabot[bot]'];
    await x.c.poll(new Date('2026-10-31T12:01:00Z'));
    expect(x.c.state.listener.error).toBe('');
    expect(x.c.state.adoptions).toMatchObject([{ pr: 121, issue: 5, status: 'adopted' }]);
    expect(x.writes().filter(call => call.line.includes('PATCH'))).toHaveLength(1);
    expect(x.c.state.jobs).toMatchObject([{ key: 'GH-5', pr: 121, stage: 'prepare-pr', existingPR: true }]);
    expect(x.traversals()).toBe(2);
});
