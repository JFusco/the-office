import { afterEach, expect, test, vi } from 'vitest';
import { centralCompanionHandoff, centralCompanionIssue } from '../../../../../server/delivery/intake/dependency-bots/companion-issue';
import { ensureTrackingIssue, findTrackingIssue } from '../../../../../server/delivery/intake/dependabot/tracking-issue';

afterEach(() => vi.unstubAllEnvs());
const repo = 'JFusco/brain';
const issue = () => ({ number: 81, node_id: 'issue-node', html_url: `https://github.com/${repo}/issues/81`, state: 'open',
    user: { login: 'pin-courier[bot]', id: 351979519 },
    body: `<!-- pin-courier-companion:v1 ${repo}#32 -->\n<!-- office-pin-courier-pr:32 -->` });

test('handoff is disabled by default and never enrolls Migrator or another project', () => {
    expect(centralCompanionHandoff(repo, '')).toBe(false);
    expect(centralCompanionHandoff(repo, 'true')).toBe(true);
    expect(centralCompanionHandoff('JFusco/cms-field-vocabulary', 'true')).toBe(true);
    for (const repository of ['verndale/migrator', 'verndale/ai-orchestration', 'JFusco/the-office'])
        expect(centralCompanionHandoff(repository, 'true')).toBe(false);
});

test('only exact App-owned repository and PR records qualify', () => {
    expect(centralCompanionIssue(issue(), repo, 32)).toBe(true);
    for (const change of [{ user: { login: 'pin-courier[bot]', id: 1 } }, { pull_request: {} },
        { html_url: 'https://github.com/attacker/brain/issues/81' }, { body: '<!-- office-pin-courier-pr:32 -->' }])
        expect(centralCompanionIssue({ ...issue(), ...change }, repo, 32)).toBe(false);
    expect(centralCompanionIssue(issue(), repo, 33)).toBe(false);
    expect(centralCompanionIssue(issue(), 'verndale/migrator', 32)).toBe(false);
});

function fixture(rows: any[]) {
    const execute = vi.fn(async (_program: string, args: string[]) => {
        if (args.includes('POST') || args.includes('PATCH')) throw new Error('Unexpected mutation');
        return JSON.stringify(args[1].includes('?') ? [rows] : rows[0]);
    });
    const store = { project: { repository: repo, repo: '/tmp/unused' } } as any;
    return { execute, store };
}

test('enabled handoff reuses the central identity without creating an issue', async () => {
    vi.stubEnv('OFFICE_PIN_COURIER_CENTRAL_ISSUES', 'true');
    const { execute, store } = fixture([issue()]);
    expect(await findTrackingIssue(store, execute, 32, 0, 'pin-courier')).toEqual({ number: 81, nodeId: 'issue-node', url: issue().html_url });
    expect(await ensureTrackingIssue(store, execute, { id: 'adoption', issue: 0 }, { number: 32, bot: 'pin-courier' } as any, () => {}))
        .toMatchObject({ number: 81 });
    expect(execute.mock.calls.every(([, args]) => !args.includes('POST') && !args.includes('PATCH'))).toBe(true);
});

test('an absent central issue waits instead of racing central creation', async () => {
    vi.stubEnv('OFFICE_PIN_COURIER_CENTRAL_ISSUES', 'true');
    const { execute, store } = fixture([]);
    await expect(ensureTrackingIssue(store, execute, { id: 'adoption', issue: 0 }, { number: 32, bot: 'pin-courier' } as any, () => {}))
        .rejects.toThrow('awaits its central companion');
    expect(execute).toHaveBeenCalledTimes(1);
});

test('legacy Office records stay authoritative; duplicates and human closures are preserved', async () => {
    vi.stubEnv('OFFICE_PIN_COURIER_CENTRAL_ISSUES', 'true');
    const legacy = { ...issue(), number: 82, html_url: `https://github.com/${repo}/issues/82`, user: { login: 'JFusco' },
        assignees: [{ login: 'JFusco' }], body: '<!-- office-pin-courier-pr:32 -->' };
    let f = fixture([legacy]);
    expect(await findTrackingIssue(f.store, f.execute, 32, 82, 'pin-courier')).toMatchObject({ number: 82 });
    f = fixture([legacy, issue()]);
    await expect(findTrackingIssue(f.store, f.execute, 32, 0, 'pin-courier')).rejects.toThrow('2 tracking issues');
    f = fixture([{ ...issue(), state: 'closed' }]);
    await expect(findTrackingIssue(f.store, f.execute, 32, 0, 'pin-courier')).rejects.toThrow('is closed');
});
