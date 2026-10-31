import { projectOutbox } from '../../server/outbox';
import { drainMaintenance } from '../fixtures/scheduler';
import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../server/store';
import { Engine } from '../../server/engine';
import { Conversations } from '../../server/conversations';
import { projectById, officeCapacity, contextPacket, validTicket } from '../../server/projects';
import { BrainMaintenance } from '../../server/brain-maintenance';
import { GitHubMonitor } from '../../server/github';
import { GitHubMaintenance, weeklyDue } from '../../server/maintenance';
import { command } from '../../server/process';
import type { MaintenanceResult } from '../../src/shared';
const roots: string[] = [], stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function setup(id = 'cms-field-vocabulary', path = ':memory:') {
    const root = mkdtempSync(resolve(tmpdir(), 'office-project-test-'));
    roots.push(root);
    const store = new Store(path, projectById(id), root);
    stores.push(store);
    mkdirSync(resolve(root, 'handover'));
    writeFileSync(resolve(root, 'handover/policies.json'), JSON.stringify([{ id: 'unit-fixture', prompt: 'SYNTHETIC TEST POLICY. No live actions.', memory: 'No prior evidence.' }]));
    return store;
}
const result: MaintenanceResult = { outcome: 'passed', summary: 'Unit fixture, not live proof', ledger: 'Synthetic ledger', receipts: [], candidates: [], blocker: '' };
test('project stores preserve independent state and reject unknown projects and cross-project issue keys', () => {
    const cec = setup('cec'), cms = setup();
    cec.state.projectNotes.push({ id: 'cec-only', ticket: '', summary: 'CEC fixture', detail: 'Private CEC context', requestId: 'test', createdAt: '' });
    cec.save();
    cms.save();
    expect(cms.state.projectNotes).toEqual([]);
    expect(cms.state.project?.repository).toBe('JFusco/cms-field-vocabulary');
    expect(contextPacket(cms.project)).not.toContain('COS-monorepo');
    expect(() => projectById('../cec')).toThrow('Unknown');
    expect(validTicket(cms.project, 'CEC-123')).toBe(false);
    expect(validTicket(cms.project, 'GH-123')).toBe(true);
});
test('separate database paths recover queued requests and goals without moving the legacy CEC database', () => {
    const dir = mkdtempSync(resolve(tmpdir(), 'office-project-persist-'));
    roots.push(dir);
    const path = resolve(dir, 'cms.sqlite');
    const first = setup('cms-field-vocabulary', path);
    first.state.goals = [{ id: 'cms-goal', project: 'CMS', title: 'Fixture', detail: '', priority: 2, status: 'idea', updatedAt: '', requestId: 'fixture' }];
    first.save();
    const second = setup('cms-field-vocabulary', path);
    second.recover();
    expect(second.state.goals?.[0].id).toBe('cms-goal');
    expect(setup('cec').state.goals).toEqual([]);
});
test('shared capacity prevents another project taking the pipeline; pausing CMS does not abort CEC workers', () => {
    const capacity = officeCapacity(), cec = new Engine(setup('cec'), capacity), cms = new Engine(setup(), capacity);
    cec.busy = true;
    expect(cms.busy).toBe(true);
    expect(() => { cms.busy = true; }).toThrow('Another project');
    cec.busy = false;
    expect(cms.busy).toBe(false);
    const cecController = new AbortController();
    capacity.active.set('developer', cecController);
    cms.pause();
    expect(cecController.signal.aborted).toBe(false);
    expect(cec.agents.active).toBe(cms.agents.active);
});
test('CMS chat receives only its project context, permits explicit PM issue filing, and keeps handoffs read-only', async () => {
    const store = setup(), engine = new Engine(store), chat = new Conversations(store, engine, store.dataRoot);
    const calls: {
        task: string;
        opts: any;
    }[] = [];
    engine.agents.run = async (_role, task, _schema, opts) => { calls.push({ task, opts }); return {} as any; };
    const message = chat.enqueue({ id: crypto.randomUUID(), body: 'Create a GitHub issue to document the missing profile evidence.' });
    await engine.agents.followup('pm', message);
    expect(calls[0].opts.readOnly).toBe(false);
    expect(calls[0].opts.cwd).toBe(store.project.repo);
    expect(calls[0].task).toContain('github-issue-creator/SKILL.md');
    expect(calls[0].task).not.toContain('CEC HTML');
    await engine.agents.followup('developer', message, 'Read this requirement');
    expect(calls[1].opts.readOnly).toBe(true);
    message.body = 'Draft a GitHub issue';
    await engine.agents.followup('pm', message);
    expect(calls[2].opts.readOnly).toBe(true);
    for (const body of ['Should we open an issue for X?', "Don't create an issue", 'What open issue is oldest?', 'Do not file a GitHub issue', 'Never open an issue', 'Draft an issue and then create an issue', 'Example: create a GitHub issue', '"Create an issue for X"']) {
        message.body = body;
        await engine.agents.followup('pm', message);
        expect(calls.at(-1)!.opts.readOnly).toBe(true);
    }
    for (const body of ['Create a GitHub issue to document the missing profile evidence.', 'Can you create a GitHub issue for X?', 'Could you please file an issue for X?', 'Please open a new GitHub issue for X.']) {
        message.body = body;
        await engine.agents.followup('pm', message);
        expect(calls.at(-1)!.opts.readOnly).toBe(false);
    }
    expect(() => chat.enqueue({ id: crypto.randomUUID(), body: 'Fixture', ticket: 'CEC-123' })).toThrow('another project');
});
test('weekly review is due at Monday 3 PM Eastern, catches missed Mondays, and handles DST', () => {
    expect(weeklyDue('2026-10-19', new Date('2026-10-26T18:59:59Z'))).toBe(false);
    expect(weeklyDue('2026-10-19', new Date('2026-10-26T19:00:00Z'))).toBe(true);
    expect(weeklyDue('2026-10-26', new Date('2026-10-27T19:00:00Z'))).toBe(false);
    expect(weeklyDue('2026-10-26', new Date('2026-11-02T19:59:59Z'))).toBe(false);
    expect(weeklyDue('2026-10-26', new Date('2026-11-02T20:00:00Z'))).toBe(true);
    expect(weeklyDue('2026-10-26', new Date('2026-11-04T20:00:00Z'))).toBe(true);
});
test('combined maintenance is durable and idempotent while queued; interruption blocks replay', () => {
    const store = setup(), engine = new Engine(store), maintenance = engine.maintenance;
    const run = maintenance.request(true);
    expect(maintenance.request(true).id).toBe(run.id);
    expect(store.state.maintenance?.runs).toHaveLength(1);
    run.status = 'working';
    store.save();
    store.recover();
    expect(String(run.status)).toBe('interrupted');
    expect(() => maintenance.request(true)).toThrow('reconciliation');
    expect(projectOutbox(store.state).some(o => o.id === `maintenance:${run.id}` && o.status === 'open')).toBe(true);
});
test('an uncertain maintenance effect stops later roles and is not automatically replayed', async () => {
    const store = setup(), engine = new Engine(store), calls: string[] = [];
    engine.agents.run = async (_role, _task, _schema, opts) => { calls.push(opts!.stage!); return { ...result, receipts: [{ id: 'fixture', action: 'merge', target: 'https://example.org/fixture', verified: false, uncertain: true, detail: 'Timeout after submit' }] } as any; };
    const run = engine.maintenance.request();
    await drainMaintenance(engine.maintenance);
    expect(run.status).toBe('blocked');
    expect(calls).toEqual(['follow-up']);
    await drainMaintenance(engine.maintenance);
    expect(calls).toHaveLength(1);
    expect(store.state.maintenance?.lastDaily).toBe('');
});
test('weekly proposals go through separate developer, lead, QA and draft-publication assignments', async () => {
    const store = setup(), engine = new Engine(store), calls: {
        role: string;
        stage: string;
    }[] = [], queue: (string | undefined)[] = [];
    engine.maintenance.verifyCandidate = async () => { };
    engine.maintenance.verifyDraft = async () => { };
    const candidate = { issue: 123, worktree: '/private/tmp/unit-owned-worktree', branch: 'codex/123-fixture', head: 'a'.repeat(40), summary: 'Unit fixture only' };
    engine.agents.run = async (role, _task, _schema, opts) => { calls.push({ role, stage: opts!.stage! }); queue.push(opts?.enqueuedAt); const path = resolve(store.dataRoot, 'runs', opts!.requestId!, 'fixture-checks.txt'); writeFileSync(path, 'Synthetic verification fixture, not a real test run.'); return { ...result, checks: [{ path, commit: candidate.head, summary: 'Unit fixture only' }], candidates: ['vendor-review', 'proposal'].includes(opts!.stage!) ? [candidate] : [] } as any; };
    const run = engine.maintenance.request();
    run.weekly = true;
    await drainMaintenance(engine.maintenance);
    expect(run.status).toBe('completed');
    expect(calls).toEqual([{ role: 'pm', stage: 'follow-up' }, { role: 'pm', stage: 'vendor-review' }, { role: 'developer', stage: 'proposal' }, { role: 'lead', stage: 'proposal-review' }, { role: 'qa', stage: 'package-verification' }, { role: 'developer', stage: 'draft-pr' }]);
    expect(store.state.maintenance?.lastWeekly).not.toBe('');
    expect(queue).toEqual([run.requestedAt, undefined, undefined, undefined, undefined, undefined]);
});
test('candidate isolation uses the Git worktree root and accepts a nested isolated worktree', async () => {
    const store = setup(), primary = resolve(store.dataRoot, 'primary');
    // Initialize only the test-owned fixture, independently of project Git history.
    mkdirSync(primary);
    await command('git', ['init', '-q', '-b', 'main'], { cwd: primary });
    await command('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'user.name=Office Unit Fixture', '-c', 'user.email=unit-fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-q', '-m', 'Unit fixture baseline'], { cwd: primary });
    store.project = { ...store.project, repo: primary };
    await command('git', ['remote', 'add', 'origin', `https://github.com/${store.project.repository}.git`], { cwd: primary });
    const head = (await command('git', ['rev-parse', 'HEAD'], { cwd: primary })).trim(), branch = (await command('git', ['branch', '--show-current'], { cwd: primary })).trim();
    const candidate = { issue: 123, worktree: primary, branch, head, summary: 'Synthetic isolated candidate' };
    let reads = 0;
    const maintenance = new GitHubMaintenance(store, new Engine(store).agents, async (program, args, opts) => {
        if (program === 'git')
            return command(program, args, opts);
        expect(program).toBe('gh');
        expect(args.slice(0, 3)).toEqual(['issue', 'view', '123']);
        reads++;
        return JSON.stringify({ number: 123, state: 'OPEN', url: `https://github.com/${store.project.repository}/issues/123` });
    });
    await expect(maintenance.verifyCandidate({ ...candidate })).rejects.toThrow('isolated owned worktree');
    const subdir = resolve(primary, 'server');
    mkdirSync(subdir);
    await expect(maintenance.verifyCandidate({ ...candidate, worktree: subdir })).rejects.toThrow('isolated owned worktree');
    expect(reads).toBe(0);
    const isolated = resolve(primary, 'proposals/isolated');
    await command('git', ['-c', 'core.hooksPath=/dev/null', 'worktree', 'add', '-b', 'codex/123-fixture', isolated, 'HEAD'], { cwd: primary });
    const nested = resolve(isolated, 'src');
    mkdirSync(nested);
    const valid = { ...candidate, worktree: nested, branch: 'codex/123-fixture' };
    await maintenance.verifyCandidate(valid);
    expect(valid.worktree).toBe(realpathSync(isolated));
    expect(reads).toBe(1);
    await expect(maintenance.verifyCandidate({ ...valid, head: 'b'.repeat(40) })).rejects.toThrow('head or clean state');
    writeFileSync(resolve(isolated, 'dirty.txt'), 'Synthetic untracked file');
    await expect(maintenance.verifyCandidate({ ...valid })).rejects.toThrow('head or clean state');
}, 30000);
test('GitHub observation paginates issues and retains last good evidence if a later page fails', async () => {
    const store = setup(), monitor = new GitHubMonitor(store, async (_program, args) => {
        const path = args[1];
        if (path.includes('/issues?')) {
            expect(args).toContain('--paginate');
            return JSON.stringify([[{ number: 91, title: 'Fixture issue', state: 'open', html_url: 'https://github.com/JFusco/cms-field-vocabulary/issues/91', updated_at: '2026-10-27T00:00:00Z' }], []]);
        }
        if (path.includes('/pulls?'))
            return '[[]]';
        if (path.includes('/actions/runs?'))
            return '{"workflow_runs":[]}';
        throw new Error('Unexpected fixture command');
    });
    await monitor.poll();
    expect(store.state.github?.issues[0].number).toBe(91);
    expect(store.state.tickets[0].key).toBe('GH-91');
    const observedAt = store.state.github!.observedAt;
    const failed = new GitHubMonitor(store, async () => { throw new Error('Fixture second-page failure'); });
    await failed.poll();
    expect(store.state.github?.status).toBe('blocked');
    expect(store.state.github?.observedAt).toBe(observedAt);
    expect(store.state.github?.issues[0].number).toBe(91);
});
test('CMS issue delivery stages cannot accidentally call the CEC Azure workflow', async () => {
    const engine = new Engine(setup());
    await expect(engine.startPilot('GH-91')).rejects.toThrow('CMS issues');
    await expect(engine.resume('GH-91')).rejects.toThrow('CEC delivery stages');
});
test('Brain uses its own dispatch and policy, preserves daily gate refusals and blocks false completion', async () => {
    const store = setup('brain'), engine = new Engine(store);
    expect(engine.maintenance).toBeInstanceOf(BrainMaintenance);
    expect(store.project.repository).toBe('JFusco/brain');
    expect(store.state.intake.schedule).toContain('5:00 PM');
    const maintenance = engine.maintenance as BrainMaintenance;
    let calls = 0;
    engine.agents.run = async (_role, task) => { calls++; expect(task).toContain('ACTUAL current agent/thread ID'); expect(task).toContain('fresh independent content review'); return { outcome: 'completed', runId: 'fabricated', reason: '', summary: 'Synthetic only', ledger: '', receipts: [] } as any; };
    maintenance.readStatus = async () => ({ active: null, completed: null, attempts: 0, slotDate: '2026-10-29', retryAfter: null });
    const run = maintenance.request(true);
    expect(maintenance.request(true).id).toBe(run.id);
    await drainMaintenance(maintenance);
    expect(run.status).toBe('blocked');
    expect(run.error).toContain('independently confirmed');
    expect(store.state.maintenance?.lastDaily).toBe('');
    await drainMaintenance(maintenance);
    expect(calls).toBe(1);
    expect(() => maintenance.request()).toThrow('reconciliation');
});
test('Brain gate backoff is a recorded skip rather than a claimed publication', async () => {
    const store = setup('brain'), engine = new Engine(store), maintenance = engine.maintenance as BrainMaintenance;
    engine.agents.run = async () => ({ outcome: 'skipped', runId: '', reason: 'backoff', summary: 'Synthetic backoff', ledger: 'Preserve original failure', receipts: [] }) as any;
    maintenance.readStatus = async () => ({ active: null, completed: null, attempts: 1, slotDate: '2026-10-29', retryAfter: new Date(Date.now() + 60000).toISOString() });
    const run = maintenance.request(true);
    await drainMaintenance(maintenance);
    expect(run.status).toBe('completed');
    expect(run.stage).toBe('skipped: backoff');
    expect(store.state.maintenance?.lastDaily).toBe('');
    store.state.paused = true;
    expect(() => maintenance.request()).toThrow('paused');
});
test('CMS PM follow-up coordinates only its configured board and retains proposal and release guards', async () => {
    const store = setup(), engine = new Engine(store);
    let calls = 0;
    engine.agents.run = async (role, task, _schema, opts) => {
        calls++;
        expect(role).toBe('pm');
        expect(opts?.stage).toBe('follow-up');
        expect(opts?.readOnly).toBe(false);
        expect(task).toContain('Use ONLY https://github.com/users/JFusco/projects/6 and issues in JFusco/cms-field-vocabulary');
        expect(task).toContain('read back both saved lane and comment');
        expect(task).toContain('no issue closure, source edits, profile/lock acceptance, merge or release');
        expect(task).not.toContain('projects/8');
        return { ...result } as any;
    };
    const run = engine.maintenance.request();
    run.weekly = false;
    await drainMaintenance(engine.maintenance);
    expect(run.status).toBe('completed');
    expect(calls).toBe(1);
});
