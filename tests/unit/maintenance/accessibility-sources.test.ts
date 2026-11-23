import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { backup } from 'node:sqlite';
import { savePickup } from '../../../server/delivery/intake/pickup';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { projectPolicy } from '../../../server/office/project-policy';
import { GitHubMaintenance } from '../../../server/maintenance/maintenance';
import { coordination } from '../../../server/scheduling/coordination';
import type { command } from '../../../server/workers/process';
import { savedState } from '../store/saved-state-fixture';

const project = {
    ...projectById('cms-field-vocabulary'), id: 'accessibility-standards', name: 'Accessibility Standards',
    repository: 'JFusco/accessibility-standards', target: 'main',
    githubProject: { owner: 'JFusco', number: 11, url: 'https://github.com/users/JFusco/projects/11' },
};
const source = 'https://www.w3.org/TR/WCAG22/';
const issueUrl = `https://github.com/${project.repository}/issues/7`;
const roots: { store: Store; path: string }[] = [];
afterEach(() => roots.splice(0).forEach(({ store, path }) => { store.close(); rmSync(path, { recursive: true, force: true }); }));

function setup({ status = 'completed', retrieval = false, wrongAssignee = false, boardDrift = false } = {}) {
    const path = mkdtempSync(join(tmpdir(), 'office-accessibility-'));
    const store = new Store(':memory:', { ...project, repo: path }, path);
    roots.push({ store, path });
    store.state.paused = false;
    const createdAt = new Date(Date.now() - 60_000).toISOString();
    const sha256 = 'c'.repeat(64);
    const digest = createHash('sha256').update(JSON.stringify([source, retrieval ? 'retrieval' : sha256, []])).digest('hex');
    const marker = `<!-- official-source:${digest} -->`;
    const issue = {
        number: 7, node_id: 'source-issue-7', state: 'open', html_url: issueUrl, title: 'Review official source',
        body: `${retrieval ? 'unavailable' : 'changed'} observation for ${source}.\n${marker}`,
        user: { login: 'github-actions[bot]', id: 41898282 },
        labels: [], assignees: [] as { login: string }[],
    };
    const issues = [issue];
    const pulls: { number: number; body: string; base: { ref: string; repo: { full_name: string } } }[] = [];
    const closingIssuesReferences: { url: string }[] = [];
    const provider = {
        scanStatus: status, card: '', lane: '', writes: [] as string[], laneReadsSinceWrite: 0,
        beforeDownload: (): void | Promise<void> => {}, beforePullList: () => {}, beforeBoardRead: () => {},
    };
    const downloads: string[] = [];
    const execute = vi.fn<typeof command>(async (name, args, options) => {
        expect(name).toBe('gh');
        if (args[0] === 'run' && args[1] === 'list') {
            expect(args.slice(2, 10)).toEqual(['--repo', project.repository, '--workflow', 'standards-freshness.yml', '--branch', 'main', '--limit', '1']);
            return JSON.stringify([{ status: provider.scanStatus, conclusion: 'success', event: 'schedule', databaseId: 17, headSha: 'b'.repeat(40), createdAt }]);
        }
        if (args[0] === 'run' && args[1] === 'download') {
            downloads.push(args[2]);
            expect(args).toEqual(['run', 'download', '17', '--repo', project.repository, '--name', 'standards-observations', '--dir', expect.any(String)]);
            await provider.beforeDownload();
            writeFileSync(join(args.at(-1)!, 'standards-scan.json'), JSON.stringify({ mode: 'full', documents: [
                { url: source, status: retrieval ? 'unavailable' : 'changed', baseline: 'a'.repeat(64),
                    locators: { focus: ['pattern.dialog'] }, ...(retrieval ? { error: '503' } : { sha256, missing_anchors: [] }) },
            ] }));
            return '';
        }
        if (args[1] === `repos/${project.repository}/issues?state=all&per_page=100`) {
            expect(args.slice(2)).toEqual(['--paginate', '--slurp']);
            return JSON.stringify(issues.map(listed => [listed]));
        }
        if (args[1] === `repos/${project.repository}/pulls?state=open&per_page=100`) {
            expect(args.slice(2)).toEqual(['--paginate', '--slurp']);
            provider.beforePullList();
            return JSON.stringify([pulls]);
        }
        if (args[0] === 'pr') {
            expect(args).toEqual(['pr', 'view', '12', '--repo', project.repository, '--json', 'closingIssuesReferences']);
            return JSON.stringify({ closingIssuesReferences });
        }
        if (args[1] === `repos/${project.repository}/issues/7`) {
            if (args[3] === 'PATCH') {
                provider.writes.push('assign');
                const { assignees } = JSON.parse(options!.input as string);
                issue.assignees = wrongAssignee ? [] : assignees.map((login: string) => ({ login }));
            }
            return JSON.stringify(issue);
        }
        expect(args).toEqual(['api', 'graphql', '--input', '-']);
        const { query, variables } = JSON.parse(options!.input as string);
        let data;
        if (query.includes('projectV2(number:')) {
            provider.beforeBoardRead();
            expect(variables).toEqual({ owner: project.githubProject.owner, number: project.githubProject.number });
            data = { user: { projectV2: { id: 'board', fields: {
                nodes: [{ id: 'status', name: 'Status', options: [{ id: 'ready', name: 'Ready' }, { id: 'backlog', name: 'Backlog' }] }],
                pageInfo: { hasNextPage: false },
            } } } };
        } else if (query.includes('items(first:')) {
            expect(variables).toEqual({ project: 'board' });
            data = { node: { items: {
                nodes: provider.card ? [{ id: provider.card, content: { __typename: 'Issue', number: 7, repository: { nameWithOwner: project.repository } } }] : [],
                pageInfo: { hasNextPage: false },
            } } };
        } else if (query.includes('fieldValues(first:')) {
            expect(variables).toEqual({ item: provider.card });
            if (provider.lane === 'ready' && boardDrift && ++provider.laneReadsSinceWrite > 1) provider.lane = 'backlog';
            data = { node: { id: provider.card, fieldValues: {
                nodes: [{ optionId: provider.lane, field: { id: 'status' } }], pageInfo: { hasNextPage: false },
            } } };
        } else if (query.includes('addProjectV2ItemById')) {
            expect(variables).toEqual({ project: 'board', content: issue.node_id });
            provider.writes.push('add-card');
            provider.card = 'card-7';
            provider.lane = 'backlog';
            data = { addProjectV2ItemById: { item: { id: provider.card } } };
        } else if (query.includes('updateProjectV2ItemFieldValue')) {
            expect(variables).toEqual({ project: 'board', item: provider.card, field: 'status', option: 'ready' });
            provider.writes.push('move-card');
            provider.lane = variables.option;
            data = { updateProjectV2ItemFieldValue: { projectV2Item: { id: provider.card } } };
        } else {
            throw new Error('Unexpected board query');
        }
        return JSON.stringify({ data });
    });
    const assessment = {
        outcome: 'passed', checks: [], receipts: [], candidates: [], ledger: 'Matched the existing scanner issue.',
        approach: null, summary: '', blocker: '',
        findings: [{ issue: 7, source, marker, disposition: retrieval ? 'retain-baseline' : 'contract-change',
            evidence: retrieval ? 'HTTP 503. Retain the reviewed baseline.' : 'WCAG 2.2 focus changes pattern.dialog.' }],
    };
    const runAgent = vi.fn(async () => assessment);
    const maintenance = new GitHubMaintenance(store, { active: new Set(), run: runAgent } as any, execute);
    return { store, execute, runAgent, maintenance, issue, issues, pulls, closingIssuesReferences, provider, downloads, assessment };
}

test('the reported registration resolves to a daily hands-off 4 p.m. checkpoint and harness merge', () => {
    const inputs = new Map([[project.id, { merge: 'harness' as const, handsOff: true, checkpoint: { hour: 16, weekends: true } }]]);
    expect(projectPolicy(project, inputs)).toMatchObject({
        handsOff: true, merge: 'harness', checkpoint: { hour: 16, weekends: true },
    });
});

test('the checkpoint saves a read-only assessment and verifies the issue, assignee and Ready card through Effects', async () => {
    const { maintenance, store, runAgent, issue, provider, downloads } = setup();
    const run = maintenance.request(true);
    expect(run.weekly).toBe(false);
    await maintenance.pump(run.id);
    expect(run.error).toBe('');
    expect(run.status).toBe('queued');
    expect(run.steps.map(step => step.stage)).toEqual(['source-review']);
    expect(runAgent).toHaveBeenCalledWith('pm', expect.stringContaining('pattern.dialog'), expect.anything(), expect.objectContaining({ readOnly: true }));
    expect(JSON.stringify(runAgent.mock.calls)).not.toContain('CMS maintenance');
    expect(provider.writes).toEqual([]);

    await maintenance.pump(run.id);
    expect(run.error).toBe('');
    expect(run.status).toBe('completed');
    expect(issue.assignees).toEqual([{ login: 'JFusco' }]);
    expect(provider).toMatchObject({ card: 'card-7', lane: 'ready', writes: ['assign', 'add-card', 'move-card'] });
    const handoff = run.steps.at(-1)!;
    expect(handoff.stage).toBe('source-handoff');
    expect(handoff.result.ledger).toContain(`${issueUrl} verified in Ready and assigned to JFusco`);
    expect(handoff.result.receipts.map(r => r.action).sort()).toEqual(['github-issue-assign', 'github-project-add', 'github-project-status']);
    for (const receipt of handoff.result.receipts) {
        expect(receipt).toMatchObject({ verified: true, uncertain: false });
        expect(store.getEffect(receipt.id)).toMatchObject({ attemptId: run.id, status: 'verified' });
    }
    expect(downloads).toEqual(['17']);
    expect(runAgent).toHaveBeenCalledTimes(1);
    expect(maintenance.request(true).id).toBe(run.id);

    // Recover the boundary where Effects were saved but the handoff step was not.
    run.steps.pop();
    run.status = 'queued';
    await maintenance.pump(run.id);
    expect(run.status).toBe('completed');
    expect(run.steps.at(-1)?.result.receipts).toEqual(handoff.result.receipts);
    expect(provider.writes).toEqual(['assign', 'add-card', 'move-card']);
    expect(downloads).toEqual(['17']);
    expect(runAgent).toHaveBeenCalledTimes(1);
});

test.each([
    { login: 'outside-contributor', id: 41898282 },
    { login: 'github-actions[bot]', id: 42 },
])('a matching issue with the wrong scanner author ($login, $id) creates no Effects', async user => {
    const { maintenance, store, issue, provider } = setup();
    issue.user = user;
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run).toMatchObject({ status: 'blocked', error: expect.stringContaining('trusted scanner') });
    expect(provider.writes).toEqual([]);
    expect(store.db.prepare('SELECT id FROM effects').all()).toEqual([]);
    expect(store.state.maintenance?.lastDaily).toBe('');
});

test('a lookalike from another author does not count as a duplicate scanner issue', async () => {
    const { maintenance, issue, issues, provider } = setup();
    issues.push({ ...issue, number: 8, node_id: 'outside-issue-8', user: { login: 'contributor', id: 42 } });
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run.status).toBe('completed');
    expect(provider.writes).toEqual(['assign', 'add-card', 'move-card']);
});

test('the Effect guard checks scanner authorship on the fresh issue read', async () => {
    const { maintenance, issue, provider } = setup();
    provider.beforePullList = () => { issue.user = { login: 'contributor', id: 42 }; };
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run).toMatchObject({ status: 'blocked', error: expect.stringContaining('trusted scanner author') });
    expect(provider.writes).toEqual([]);
});

test.each(['open', 'closed'])('an empty assessment checks the inventory when the matching issue is %s', async state => {
    const { maintenance, store, issue, provider, assessment } = setup();
    issue.state = state;
    assessment.findings = [];
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(provider.writes).toEqual([]);
    if (state === 'open') {
        expect(run).toMatchObject({ status: 'blocked', error: expect.stringContaining('open scanner issue GH-7') });
        expect(store.state.maintenance?.lastDaily).toBe('');
    } else {
        expect(run.status).toBe('completed');
        expect(store.state.maintenance?.lastDaily).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
});

test('an omitted prior scanner issue with the same source blocks a partial assessment before writes', async () => {
    const { maintenance, store, issue, issues, provider, assessment } = setup();
    const priorMarker = `<!-- official-source:${'d'.repeat(64)} -->`;
    issues.push({ ...issue, number: 8, node_id: 'source-issue-8', body: issue.body.replace(assessment.findings[0].marker, priorMarker) });
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run).toMatchObject({ status: 'blocked', error: expect.stringContaining('open scanner issue GH-8') });
    expect(store.state.maintenance?.lastDaily).toBe('');
    expect(provider.writes).toEqual([]);
});

test.each([
    { enabled: false, status: 'Ready' },
    { enabled: true, status: 'Backlog' },
])('changing pickup during PR discovery ($enabled, $status) stops stale writes', async pickup => {
    const { maintenance, store, provider } = setup();
    store.state.coordination = coordination();
    savePickup(store, { enabled: true, status: 'Ready' });
    provider.beforePullList = () => savePickup(store, pickup);
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run).toMatchObject({ status: 'blocked', error: expect.stringContaining('pickup setting changed') });
    expect(provider.writes).toEqual([]);
    expect(store.state.maintenance?.lastDaily).toBe('');
});

test('losing the verified assignment before adding the card blocks board writes', async () => {
    const { maintenance, store, issue, provider } = setup();
    provider.beforeBoardRead = () => {
        if (provider.writes.includes('assign')) issue.assignees = [];
    };
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run).toMatchObject({ status: 'blocked', error: expect.stringContaining('changed owners') });
    expect(provider.writes).toEqual(['assign']);
    expect(run.steps.at(-1)?.result.receipts).toEqual([expect.objectContaining({ action: 'github-issue-assign', verified: true })]);
    expect(store.state.maintenance?.lastDaily).toBe('');
});

test.each([
    { ref: 'main', link: '', ownsIssue: false },
    { ref: 'main', link: 'https://github.com/another/repo/issues/7', ownsIssue: false },
    { ref: 'main', link: issueUrl, ownsIssue: true },
    { ref: 'stack-parent', link: '', ownsIssue: true },
])('pull request ownership follows closing references and the stacked exception ($ref, $link)', async ({ ref, link, ownsIssue }) => {
    const { maintenance, store, pulls, closingIssuesReferences, provider } = setup();
    pulls.push({ number: 12, body: ref === project.target ? '> Closes #7' : 'Closes #7', base: { ref, repo: { full_name: project.repository } } });
    if (link) closingIssuesReferences.push({ url: link });
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run.status).toBe('completed');
    expect(store.state.maintenance?.ledger).toContain(ownsIssue ? 'left to pull request #12' : 'verified in Ready');
    expect(provider.writes).toEqual(ownsIssue ? [] : ['assign', 'add-card', 'move-card']);
});

test('a mismatched assignment readback blocks completion and keeps the write uncertain', async () => {
    const { maintenance, store, provider, issue } = setup({ wrongAssignee: true });
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('Independent read-back did not verify');
    expect(provider.writes).toEqual(['assign']);
    const [assignment] = run.steps.at(-1)!.result.receipts;
    expect(assignment).toMatchObject({ action: 'github-issue-assign', verified: false, uncertain: true });
    expect(store.state.maintenance?.lastDaily).toBe('');

    // The provider catches up after the failed read. Recover from the saved
    // assessment and Effect at the interrupted handoff boundary.
    issue.assignees = [{ login: 'JFusco' }];
    run.steps.pop();
    run.status = 'queued';
    await maintenance.pump(run.id);
    expect(run.status).toBe('completed');
    expect(store.getEffect(assignment.id)?.status).toBe('verified');
    expect(provider.writes).toEqual(['assign', 'add-card', 'move-card']);
});

test('a card moved away after the Ready write blocks the final handoff check', async () => {
    const { maintenance, provider } = setup({ boardDrift: true });
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(provider.lane).toBe('backlog');
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('did not read back as assigned to JFusco in Ready');
});

test('a recorded retrieval failure retains its baseline with zero writes', async () => {
    const { maintenance, store, issue, provider, downloads } = setup({ retrieval: true });
    const originalIssue = structuredClone(issue);
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run.status).toBe('completed');
    expect(issue).toEqual(originalIssue);
    expect(provider.writes).toEqual([]);
    expect(downloads).toEqual(['17']);
    expect(run.steps.at(-1)?.result.receipts).toEqual([]);
    expect(store.state.maintenance?.ledger).toContain('retain-baseline · HTTP 503');
});

test('a changed observation cannot be classified as a retrieval failure', async () => {
    const { maintenance, store, provider, assessment } = setup();
    assessment.findings[0].disposition = 'retain-baseline';
    const run = maintenance.request();
    await maintenance.pump(run.id);
    await maintenance.pump(run.id);
    expect(run).toMatchObject({ status: 'blocked', error: expect.stringContaining('classification mismatch') });
    expect(provider.writes).toEqual([]);
    expect(store.state.maintenance?.lastDaily).toBe('');
});

test('startup recovery can settle an interrupted scan captured during download', async () => {
    const { maintenance, store, runAgent, provider, execute } = setup();
    const path = join(store.dataRoot, 'interrupted-scan.sqlite');
    provider.beforeDownload = async () => {
        await backup(store.db, path);
        throw new Error('Stopped during download');
    };
    const run = maintenance.request();
    const claim = store.claimWork({ projectId: project.id, kind: 'maintenance', id: run.id }, 'scheduler', run.stage)!;
    await maintenance.pump(run.id);

    const recovered = new Store(path, store.project, store.dataRoot);
    try {
        expect(recovered.state.maintenance?.runs[0]).toMatchObject({ status: 'working', stage: 'source-scan', steps: [] });
        expect(recovered.activeClaims().map(active => active.id)).toEqual([claim.id]);
        recovered.recover();
        const interrupted = recovered.state.maintenance!.runs[0];
        expect(interrupted.status).toBe('interrupted');
        expect(recovered.activeClaims()).toEqual([]);
        const error = interrupted.error;
        expect(error).toContain('Interrupted assignment');
        const restarted = new GitHubMaintenance(recovered, maintenance.agents, execute);
        await restarted.reconcile(run.id);
        expect(interrupted).toMatchObject({ status: 'reconciled', error, steps: [] });
        expect(recovered.state.maintenance?.lastDaily).toBe('');
        expect(restarted.request().id).not.toBe(run.id);
        expect(runAgent).not.toHaveBeenCalled();
        expect(provider.writes).toEqual([]);
    } finally {
        recovered.close();
    }
});

test('an unfinished scan is reconciled as unfinished before a deliberate new request', async () => {
    const { maintenance, runAgent, provider, downloads } = setup({ status: 'in_progress' });
    const run = maintenance.request();
    await maintenance.pump(run.id);
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('successful current Accessibility Standards scan');
    expect(downloads).toEqual([]);
    expect(runAgent).not.toHaveBeenCalled();
    const error = run.error;
    expect(() => maintenance.request()).toThrow('Prior project maintenance');
    await maintenance.reconcile(run.id);
    expect(run).toMatchObject({ status: 'reconciled', error, steps: [] });
    expect(runAgent).not.toHaveBeenCalled();
    expect(provider.writes).toEqual([]);

    provider.scanStatus = 'completed';
    const next = maintenance.request();
    expect(next.id).not.toBe(run.id);
    await maintenance.pump(next.id);
    await maintenance.pump(next.id);
    expect(next.status).toBe('completed');
    expect(run.error).toBe(error);
    expect(downloads).toEqual(['17']);
});

test('a worker failure before a step was saved still requires original worker readback', async () => {
    const { maintenance, store, runAgent } = setup();
    runAgent.mockImplementationOnce(async () => {
        expect(savedState(store).maintenance?.runs[0]).toMatchObject({ status: 'working', stage: 'source-review', steps: [] });
        throw new Error('worker failed after dispatch');
    });
    const run = maintenance.request();
    await maintenance.pump(run.id);
    expect(run).toMatchObject({ status: 'blocked', stage: 'source-review', steps: [], error: 'Error: worker failed after dispatch' });
    await expect(maintenance.reconcile(run.id)).rejects.toThrow('Terminated original maintenance and scheduler-owned reader required');
    expect(() => maintenance.request()).toThrow('Prior project maintenance');
    expect(runAgent).toHaveBeenCalledTimes(1);
});
