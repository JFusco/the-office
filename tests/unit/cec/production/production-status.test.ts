import { expect, test } from 'vitest';
import { CEC } from '../../../../server/office/config';
import { advanceJiraStatus, STATUS_COMMENTS } from '../../../../server/cec/production/production-status';
import { awaitingJiraStatus } from '../../../../server/cec/production/awaiting-production';
import { cecStore, ticket, decision } from '../parking/fixtures';

const IDS: Record<string, string> = { '221': 'Ready for Production', '231': 'Done' };
/** A small Jira: statuses, sub-tasks, which moves are offered, and every move made with its comment. */
function jiraFor(issues: Record<string, string>, options: { parentDoneNeedsSubtasks?: boolean; loseResponse?: boolean; requiredField?: boolean; withhold?: string[]; assignee?: string; badSubtask?: boolean; noCredential?: boolean } = {}) {
    const state = { status: { ...issues }, moves: [] as { key: string; to: string; comment: string }[] };
    const subs = () => Object.keys(state.status).filter(key => key !== 'CEC-154');
    const offered = (key: string, to: string) => !(options.withhold || []).includes(`${key}:${to}`) &&
        !(options.parentDoneNeedsSubtasks && key === 'CEC-154' && to === 'Done' && subs().some(sub => state.status[sub] !== 'Done'));
    const execute: any = async (program: string, args: string[], rest: { input?: string } = {}) => {
        if (program === 'security' && options.noCredential) throw new Error('The specified item could not be found in the keychain.');
        if (program === 'security') return args.includes('-w') ? 'synthetic-token\n' : 'keychain: "login.keychain-db"\n    "acct"<blob>="office@example.test"\n    "svce"<blob>="the-office-jira"\n';
        if (program === 'curl') {
            const lines = (rest.input || '').split('\n'), setting = (name: string) => { const line = lines.find(item => item.startsWith(`${name} = "`)); return line ? JSON.parse(`"${line.slice(name.length + 4, -1)}"`) as string : ''; };
            if (setting('url').endsWith('/rest/api/3/myself')) return JSON.stringify({ accountId: CEC.account });
            const key = decodeURIComponent(setting('url').split('/issue/')[1].split('/')[0]), body = JSON.parse(setting('data-raw')), to = IDS[body.transition.id];
            const comment = JSON.stringify(body.update?.comment?.[0]?.add?.body || '');
            if (!offered(key, to)) throw new Error('curl exited 22: {"errorMessages":["Transition is not valid"]}curl: (22) The requested URL returned error: 400');
            state.status[key] = to; state.moves.push({ key, to, comment });
            if (options.loseResponse) throw new Error('transport lost after dispatch');
            return '';
        }
        const [, , command] = args, key = args[3];
        if (command === 'get') return JSON.stringify({ data: { key, status: { name: state.status[key] }, assignee: { accountId: options.assignee || CEC.account }, updated: '' } });
        if (command === 'transition') return JSON.stringify({ data: { transitions: Object.entries(IDS).filter(([, to]) => offered(args[args.indexOf('--id') + 1], to)).map(([id, toName]) => ({ id, toName, fields: options.requiredField ? [{ fieldId: 'resolution', required: true }] : [{ fieldId: 'comment', required: true }] })) } });
        if (command === 'query') return JSON.stringify({ data: { issues: subs().map(sub => options.badSubtask ? { key: sub } : { key: sub, status: { name: state.status[sub] } }) }, pageInfo: { hasNextPage: false } });
        throw new Error(`Unexpected Jira call ${args.join(' ')}`);
    };
    return { state, execute };
}
function followed(production: object) {
    const { store } = cecStore(), t = ticket('Ready for Staging');
    Object.assign(t, { key: 'CEC-154', stage: 'complete', activity: 'idle', pilot: true, production });
    t.results['staging-qa'] = decision('', { outcome: 'passed', commit: t.commit });
    store.state.tickets.push(t);
    return { store, t };
}
const PR = { pr: 41600, prUrl: 'https://dev.azure.com/org/p/_git/r/pullrequest/41600', prSource: 'opened' as const };

test('with its promotion pull request open, a ticket in Ready for Staging moves to Ready for Production once', async () => {
    const { store, t } = followed(PR), jira = jiraFor({ 'CEC-154': 'Ready for Staging', 'CEC-155': 'To Do' });
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    expect(jira.state.moves).toHaveLength(1);
    expect(jira.state.moves[0]).toMatchObject({ key: 'CEC-154', to: 'Ready for Production' });
    expect(jira.state.moves[0].comment).toContain('Verified on staging. Promotion pull request: https://dev.azure.com/org/p/_git/r/pullrequest/41600. Moved by the Office on Joe');
    expect(t.production?.readyAt).toBeTruthy();
    expect(jira.state.status['CEC-155']).toBe('To Do');
});

test('a status a person chose is left alone, and nothing moves before the pull request exists', async () => {
    const blocked = followed(PR), jira = jiraFor({ 'CEC-154': 'Blocked' });
    await advanceJiraStatus(blocked.store, jira.execute, blocked.t, 'prod-deploy');
    const early = followed({ since: 'x' }), other = jiraFor({ 'CEC-154': 'Ready for Staging' });
    await advanceJiraStatus(early.store, other.execute, early.t, 'prod-deploy');
    expect([...jira.state.moves, ...other.state.moves]).toEqual([]);
    expect(blocked.t.production?.readyAt).toBeUndefined();
});

test('after the production deploy every sub-task goes to Done, then the parent, each with its comment', async () => {
    const { store, t } = followed({ ...PR, readyAt: 'x', buildId: 903, deployedAt: '2026-11-21T00:00:00Z' });
    const jira = jiraFor({ 'CEC-154': 'Ready for Production', 'CEC-155': 'To Do', 'CEC-156': 'Done' }, { parentDoneNeedsSubtasks: true });
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    expect(jira.state.moves.map(m => [m.key, m.to])).toEqual([['CEC-155', 'Done'], ['CEC-154', 'Done']]);
    expect(jira.state.moves[0].comment).toContain(STATUS_COMMENTS.subtaskDone('CEC-154'));
    expect(jira.state.moves[1].comment).toContain('In production: prod-deploy run 903 passed with this change. Moved by the Office on Joe');
    expect(t.production?.doneAt).toBeTruthy();
    expect(awaitingJiraStatus(store)).toEqual([]);
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    expect(jira.state.moves).toHaveLength(2);
    expect(store.state.events.filter(e => e.kind === 'production-done')).toHaveLength(1);
});

test('a move Jira does not offer stops there and is said once; the parent is never closed before its sub-tasks', async () => {
    const { store, t } = followed({ ...PR, buildId: 903, deployedAt: 'x' });
    const jira = jiraFor({ 'CEC-154': 'Ready for Production', 'CEC-155': 'To Do' }, { withhold: ['CEC-155:Done'] });
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    expect(jira.state.moves).toEqual([]);
    expect(t.production?.statusNote).toContain('Jira does not offer Done for CEC-155');
    expect(store.state.events.filter(e => e.kind === 'production-status-waiting')).toHaveLength(1);
    expect(t.production?.doneAt).toBeUndefined();
});

test('a move whose answer was lost is never sent again and settles when Jira shows the status', async () => {
    const { store, t } = followed({ ...PR, buildId: 903, deployedAt: 'x' });
    const lost = jiraFor({ 'CEC-154': 'Ready for Production' }, { loseResponse: true });
    await expect(advanceJiraStatus(store, lost.execute, t, 'prod-deploy')).rejects.toThrow();
    // Jira did apply it: the next look reads Done and finishes without another write.
    await advanceJiraStatus(store, lost.execute, t, 'prod-deploy');
    expect(lost.state.moves).toHaveLength(1);
    expect(t.production?.doneAt).toBeTruthy();
});

test('a move sent and not applied is left to a person, and a screen that needs another field is refused', async () => {
    const { store, t } = followed({ ...PR, buildId: 903, deployedAt: 'x' });
    const jira = jiraFor({ 'CEC-154': 'Ready for Production' });
    const broken: any = async (program: string, args: string[], rest: any) => { if (program === 'curl' && String(rest?.input).includes('/transitions')) throw new Error('socket hang up'); return jira.execute(program, args, rest); };
    await expect(advanceJiraStatus(store, broken, t, 'prod-deploy')).rejects.toThrow();
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    expect(jira.state.moves).toEqual([]);
    expect(t.production?.statusNote).toContain('was sent and did not read back');
    const strict = followed({ ...PR, buildId: 903, deployedAt: 'x' }), needs = jiraFor({ 'CEC-154': 'Ready for Production' }, { requiredField: true });
    await expect(advanceJiraStatus(strict.store, needs.execute, strict.t, 'prod-deploy')).rejects.toThrow('requires fields the Office does not supply');
    expect(needs.state.moves).toEqual([]);
});

test('a parent a person moved or owns is left alone with its sub-tasks, and a sub-task read without its status closes nothing', async () => {
    for (const [status, options] of [['Blocked', {}], ['Ready for Production', { assignee: 'someone-else' }]] as const) {
        const { store, t } = followed({ ...PR, buildId: 903, deployedAt: 'x' }), jira = jiraFor({ 'CEC-154': status, 'CEC-155': 'To Do' }, options);
        await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
        await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
        expect(jira.state.moves).toEqual([]);
        expect(t.production?.statusNote).toContain('leaves it and its sub-tasks as they are');
        expect(store.state.events.filter(e => e.kind === 'production-status-waiting')).toHaveLength(1);
    }
    const { store, t } = followed({ ...PR, buildId: 903, deployedAt: 'x' }), bad = jiraFor({ 'CEC-154': 'Ready for Production', 'CEC-155': 'To Do' }, { badSubtask: true });
    await expect(advanceJiraStatus(store, bad.execute, t, 'prod-deploy')).rejects.toThrow('without its key or status');
    expect(bad.state.moves).toEqual([]);
});

test('a move stopped before sending is tried three times and then left; a move a person undid is not made again', async () => {
    const { store, t } = followed(PR), jira = jiraFor({ 'CEC-154': 'Ready for Staging' }, { noCredential: true });
    for (let look = 0; look < 6; look++) await advanceJiraStatus(store, jira.execute, t, 'prod-deploy').catch(() => undefined);
    expect(jira.state.moves).toEqual([]);
    expect(t.production?.statusNote).toContain('stopped before sending three times');
    const effects = store.db.prepare("SELECT COUNT(*) AS n FROM effects WHERE id LIKE 'production-status:%'").get() as { n: number };
    expect(effects.n).toBe(3);

    const again = followed(PR), ok = jiraFor({ 'CEC-154': 'Ready for Staging' });
    await advanceJiraStatus(again.store, ok.execute, again.t, 'prod-deploy');
    ok.state.status['CEC-154'] = 'Ready for Staging'; delete again.t.production!.readyAt;
    await advanceJiraStatus(again.store, ok.execute, again.t, 'prod-deploy');
    expect(ok.state.moves).toHaveLength(1);
    expect(again.t.production?.statusNote).toContain('someone has moved it since');
});

test('an abandoned promotion pull request is not announced', async () => {
    const { store, t } = followed(PR), jira = jiraFor({ 'CEC-154': 'Ready for Staging' });
    store.state.azure.prs = [{ id: 41600, title: '', draft: false, status: 'abandoned', source: '', target: '', commit: '', mergeCommit: '', url: '', policies: [] }];
    await advanceJiraStatus(store, jira.execute, t, 'prod-deploy');
    expect(jira.state.moves).toEqual([]);
});
