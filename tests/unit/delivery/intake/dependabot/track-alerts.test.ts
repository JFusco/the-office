import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../../support/fake-github';
import { trackDependabotAlerts } from '../../../../../server/delivery/intake/dependabot/track-alerts';
import { alertMarker } from '../../../../../server/delivery/intake/dependabot/alert-issue';
import { unansweredAlerts, dependabotAlert } from '../../../../../server/delivery/intake/dependabot/alerts';
afterEach(cleanupFakes);

const NOW = new Date('2026-11-19T12:00:00Z');
const raw = (number: number, created = '2026-11-08T19:20:31Z', name = 'minimatch') => ({ number, state: 'open', created_at: created, html_url: `https://github.example/alerts/${number}`,
    dependency: { package: { name, ecosystem: 'npm' }, manifest_path: 'pnpm-lock.yaml', relationship: 'transitive' },
    security_advisory: { ghsa_id: 'GHSA-g3hv-75wg-m249', severity: 'medium', summary: 'denial of service' }, security_vulnerability: { vulnerable_version_range: '>= 7.0.0, < 11.0.1', first_patched_version: { identifier: '11.0.1' } } });

/** The shared GitHub double plus the alert list, issue comments and issue close this module adds. */
function office(alerts: any[], options: { alertsFail?: boolean } = {}) {
    const f = fakeGitHub(), extra = { alerts, comments: [] as string[], gone: 'fixed', cardFails: false, closes: [] as string[] };
    Object.assign(f.state.issue, { title: '', body: '', assignees: [], state: 'open' });
    // Board automation adds a new issue's card in Backlog.
    f.state.cards = [{ id: 'issue-card', kind: 'Issue', number: 5, status: 'backlog' }];
    const execute = async (program: string, args: string[], rest: any) => {
        const path = args[1] || '';
        if (program === 'gh' && /dependabot\/alerts\/\d+$/.test(path)) { const n = Number(path.split('/').pop()); return JSON.stringify({ number: n, state: extra.alerts.some(a => a.number === n) ? 'open' : extra.gone }); }
        if (program === 'gh' && args[1] === 'graphql' && extra.cardFails && String(rest?.input || '').includes('mutation')) throw new Error('GraphQL 502');
        if (program === 'gh' && path.includes('dependabot/alerts')) { if (options.alertsFail) throw new Error('HTTP 403'); f.state.calls.push(`gh ${args.join(' ')}`); return JSON.stringify([extra.alerts]); }
        if (program === 'gh' && /\/issues\/5\/comments/.test(path)) {
            f.state.calls.push(`gh ${args.join(' ')}`);
            if (args.includes('POST')) { extra.comments.push(args.find(a => a.startsWith('body='))!.slice(5)); return '{}'; }
            return JSON.stringify([extra.comments.map(body => ({ body }))]);
        }
        if (program === 'gh' && /\/issues\/5$/.test(path) && args.includes('PATCH')) { f.state.calls.push(`gh ${args.join(' ')}`); f.state.issue.state = 'closed'; extra.closes.push(args.find(a => a.startsWith('state_reason='))!); return '{}'; }
        return (f.execute as any)(program, args, rest);
    };
    const pickup = { enabled: true, status: 'Ready' };
    return { f, extra, pickup, run: (now = NOW) => trackDependabotAlerts(f.store, execute as any, f.delivery.jobs, pickup, now) };
}
const writes = (f: ReturnType<typeof fakeGitHub>) => f.state.calls.filter(c => /POST|PATCH/.test(c) || c.includes('mutation'));

test('an alert with no pull request after a day becomes one issue in the pickup lane, once', async () => {
    const { f, run } = office([raw(22)]);
    await run();
    expect(f.state.issue).toMatchObject({ title: '[Bug] Resolve Dependabot alert #22: minimatch', assignees: [{ login: 'JFusco' }] });
    expect(f.state.issue.body).toContain(alertMarker(22));
    expect(f.state.issue.body).toContain('First fixed version: `11.0.1`');
    expect(f.state.cards.filter(c => c.kind === 'Issue').map(c => c.status)).toEqual(['ready']);
    expect(f.store.state.coordination!.alertIssues).toMatchObject([{ alert: 22, issue: 5, status: 'tracked' }]);
    const before = writes(f).length;
    await run(); await run();
    expect(writes(f).length).toBe(before);
    expect(f.store.state.events.filter(e => e.kind === 'dependabot-alert-tracked')).toHaveLength(1);
});

test('an issue that already carries the alert\'s marker is used, and a closed one is left closed', async () => {
    const { f, run } = office([raw(22)]);
    Object.assign(f.state.issue, { title: 'Hand-filed', body: `text\n${alertMarker(22)}`, user: { login: 'JFusco' }, node_id: 'n', state: 'closed' });
    await run();
    expect(writes(f)).toEqual([]);
    expect(f.state.issue.title).toBe('Hand-filed');
    expect(f.store.state.coordination!.alertIssues).toMatchObject([{ alert: 22, issue: 5, status: 'tracked' }]);
    expect(f.store.state.coordination!.alertIssues![0].detail).toContain('left closed');
});

test('a young alert, and one Dependabot has a pull request for, wait', async () => {
    const { f, run } = office([raw(1, '2026-11-19T00:00:00Z'), raw(2, '2026-11-08T00:00:00Z', 'undici')]);
    f.state.prs.push({ number: 9, state: 'open', user: { login: 'dependabot[bot]' }, title: 'Bump undici from 6.29.0 to 6.29.1', body: '' });
    await run();
    expect(writes(f)).toEqual([]);
    expect(f.store.state.coordination!.alertIssues).toEqual([]);
    const parsed = [raw(1, '2026-11-19T00:00:00Z'), raw(3, 'not a date'), raw(4)].map(dependabotAlert) as any[];
    expect(unansweredAlerts(parsed, [{ user: { login: 'someone' }, title: 'minimatch' }], NOW).map(a => a.number)).toEqual([4]);
    expect(dependabotAlert({ ...raw(5), state: 'fixed' })).toBeNull();
});

test('when the alert is gone the open issue is explained and closed, unless a delivery is in flight', async () => {
    const { f, extra, run } = office([raw(22)]);
    await run();
    extra.alerts = [];
    f.delivery.jobs.push({ key: 'GH-5', status: 'working' } as any);
    await run();
    expect(f.state.issue.state).toBe('open');
    f.delivery.jobs.length = 0;
    await run();
    expect(f.state.issue.state).toBe('closed');
    expect(extra.comments).toHaveLength(1);
    expect(f.store.state.coordination!.alertIssues).toMatchObject([{ status: 'resolved' }]);
    const before = writes(f).length;
    await run();
    expect(writes(f).length).toBe(before);
});

test('a failed alert read is said once and stops nothing; a paused Office reads nothing', async () => {
    const { f, run } = office([raw(22)], { alertsFail: true });
    await run(); await run();
    expect(f.store.state.events.filter(e => e.kind === 'dependabot-alerts-unavailable')).toHaveLength(1);
    expect(writes(f)).toEqual([]);
    const paused = office([raw(22)]);
    paused.f.store.state.paused = true;
    await paused.run();
    expect(paused.f.state.calls.some(c => c.includes('dependabot/alerts'))).toBe(false);
});

test('a board move that could not be confirmed is never repeated; it is settled when the card is seen in the lane', async () => {
    const { f, extra, run } = office([raw(22)]);
    extra.cardFails = true;
    await run();
    expect(f.store.state.coordination!.alertIssues).toMatchObject([{ issue: 5, status: 'blocked' }]);
    expect(f.store.state.coordination!.alertIssues![0].detail).toContain('move its card to Ready yourself');
    extra.cardFails = false;
    const moves = () => f.state.calls.filter(c => c.includes('graphql')).length;
    await run();
    expect(f.state.cards[0].status).toBe('backlog');
    expect(f.store.state.coordination!.alertIssues).toMatchObject([{ status: 'blocked' }]);
    f.state.cards[0].status = 'ready';
    await run();
    expect(f.store.state.coordination!.alertIssues).toMatchObject([{ issue: 5, status: 'tracked' }]);
    expect(f.state.calls.filter(c => c.includes('title=')).length).toBe(1);
    void moves;
});

test('a dismissed alert closes its issue as not planned; an alert only missing from the list closes nothing', async () => {
    const { f, extra, run } = office([raw(22)]);
    await run();
    const kept = extra.alerts; extra.alerts = []; extra.gone = 'open';
    await run();
    expect(f.state.issue.state).toBe('open');
    extra.gone = 'auto_dismissed';
    await run();
    expect(extra.closes).toEqual(['state_reason=not_planned']);
    expect(extra.comments[0]).toContain('is now auto dismissed');
    void kept;
});

test('a changelog that mentions the package is not a pull request for it, and a quoted marker is not the alert\'s issue', async () => {
    const parsed = [raw(4, '2026-11-08T00:00:00Z', 'ms'), raw(5, '2026-11-08T00:00:00Z', 'undici')].map(dependabotAlert) as any[];
    const bot = (title: string, body = '') => ({ user: { login: 'dependabot[bot]' }, title, body });
    expect(unansweredAlerts(parsed, [bot('Bump eslint from 10.3.0 to 10.4.0', 'Release notes: fixes ms and undici handling in items')], NOW).map(a => a.number)).toEqual([4, 5]);
    expect(unansweredAlerts(parsed, [bot('Bump the dev group with 2 updates', 'Updates `undici` from 6.29.0 to 6.29.1')], NOW).map(a => a.number)).toEqual([4]);
    const { f, run } = office([raw(22)]);
    Object.assign(f.state.issue, { title: 'Docs', body: `We use ${alertMarker(22)} as the marker.`, user: { login: 'JFusco' }, node_id: 'n', state: 'open' });
    await expect(run()).resolves.toBeUndefined();
    expect(f.state.issue.title).not.toBe('Docs');
});

test('a card a person or the harness already moved is left where it is, and pickup turned off moves nothing', async () => {
    const moved = office([raw(22)]);
    moved.f.state.cards[0].status = 'progress';
    await moved.run();
    expect(moved.f.state.cards[0].status).toBe('progress');
    expect(moved.f.store.state.coordination!.alertIssues).toMatchObject([{ status: 'tracked' }]);
    const off = office([raw(22)]);
    off.pickup.enabled = false;
    await off.run();
    expect(off.f.state.cards[0].status).toBe('backlog');
    expect(off.f.state.issue.title).toContain('Resolve Dependabot alert #22');
});
