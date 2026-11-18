import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { CEC } from '../../../server/office/config';
import { PROJECT_BINDINGS, projectById, projectData } from '../../../server/office/projects';
import { parseBindingBlocks } from '../../../server/office/project-binding-blocks';
import { ownProjectBindings } from '../../../server/office/own-project-bindings';
import type { OwnBindingBlocks } from '../../../server/office/own-binding-blocks';
import type { ProjectBindings } from '../../../server/office/project-bindings-config';
import { jiraBinding } from '../../../server/office/project-bindings';
import { ownTicket, ticketPrefix } from '../../../server/office/ticket-key';
import { intakeJql, intakeLocation, projectListScope } from '../../../server/cec/intake-scope';
import { readAssignments } from '../../../server/scheduling/assignment-poll';
import { sessionScope } from '../../../server/workers/session-scope';
import { JiraIssuePublisher } from '../../../server/cec/issue-publication';
import { improvementManifest } from '../../../server/knowledge/improvement-publication';
import { verifyAlreadyAtStatus, verifiedTransition } from '../../../server/cec/transition-readback';
import { withCECPreflightPRs } from '../../../server/cec/preflight-pr-read';
import { cecPrompt } from '../../../server/cec/prompts/cec';
import { defaultPickupStatus } from '../../../server/delivery/intake/default-pickup';
import type { OfficeProject, StageResult, Ticket } from '../../../src/shared';
import { ticket as fixtureTicket } from './parking/fixtures';
import { ACME_AUTHORITY, acmeEntry } from '../office/second-project-fixture';

const LIST = `${acmeEntry.jira.site}/jira/software/c/projects/ACME/list?jql=${encodeURIComponent('project = ACME AND assignee = "acme-account" ORDER BY cf[10019] ASC')}`;
const entry = { ...acmeEntry, jira: { ...acmeEntry.jira, board: undefined, intakeListUrl: LIST } };
const acme: OfficeProject = { id: 'acme', name: 'Acme', provider: 'azure', repo: entry.repo, repository: entry.repository, target: entry.target };
const registry = PROJECT_BINDINGS as Map<string, ProjectBindings>;
const roots: string[] = [], stores: Store[] = [];
afterEach(() => { registry.delete('acme'); stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

/** Registers acme as the loader resolves it, and opens an isolated store for `project` in its own data root. */
function open(project: OfficeProject) {
    registry.set('acme', ownProjectBindings(acme, parseBindingBlocks(JSON.parse(JSON.stringify(entry)), undefined) as OwnBindingBlocks));
    const root = mkdtempSync(resolve(tmpdir(), `office-two-projects-${project.id}-`)); roots.push(root);
    const store = new Store(':memory:', project, root); stores.push(store);
    return store;
}
const acmeTicket = (key = 'ACME-7'): Ticket => ({ ...fixtureTicket(), key, assignee: 'acme-account' });

test('intake list, JQL and labels are scoped to each project key', async () => {
    open(acme);
    const binding = jiraBinding(acme);
    expect(projectListScope(binding)).toEqual({ url: new URL(LIST).href, jql: 'project = ACME AND assignee = "acme-account"' });
    expect(await intakeJql(binding, async () => { throw new Error('no board read in list mode'); })).toBe('project = ACME AND assignee = "acme-account"');
    expect(intakeLocation(binding).name).toBe('ACME Jira list');
    expect(new URL(intakeLocation(binding).url).pathname).toBe('/jira/software/c/projects/ACME/list');
    expect(defaultPickupStatus(acme)).toBe('Selected');
    const cec = jiraBinding(projectById('cec'));
    expect(intakeLocation(cec)).toEqual({ name: 'CEC Jira board', url: `${CEC.site}/secure/RapidBoard.jspa?rapidView=${CEC.board}` });
    expect(defaultPickupStatus(projectById('cec'))).toBe('To Do');
});

test('the assignment poll queries each project with its own key, site and login profile', async () => {
    const calls: string[][] = [];
    const execute = vi.fn(async (_program: string, args: string[]) => {
        calls.push(args);
        return JSON.stringify({ data: { issues: [
            { key: 'ACME-7', summary: 'Own', url: '', assignee: { accountId: 'acme-account' }, status: { name: 'Selected', id: '10100' }, updated: '', issuetype: { name: 'Task', subtask: false } },
            { key: 'CEC-7', summary: 'Foreign', url: '', assignee: { accountId: 'acme-account' }, status: { name: 'Selected', id: '10100' }, updated: '', issuetype: { name: 'Task', subtask: false } },
        ] } });
    });
    const assigned = await readAssignments.call({ store: open(acme), execute } as never);
    expect(assigned.map(issue => issue.key)).toEqual(['ACME-7']);
    expect(calls[0]).toContain('project = ACME AND assignee = "acme-account" AND resolution = Unresolved ORDER BY key ASC');
    expect(calls[0].slice(-8, -4)).toEqual(['--site', 'https://acme.example.net', '--profile', 'acme']);
    await readAssignments.call({ store: open(projectById('cec')), execute } as never);
    expect(calls[1]).toContain(`project = CEC AND assignee = "${CEC.account}" AND resolution = Unresolved ORDER BY key ASC`);
    expect(calls[1]).toContain(CEC.site);
    expect(calls[1]).not.toContain('--profile');
});

test('ticket ownership and session scope accept only the project\'s own keys', () => {
    open(acme);
    expect(ticketPrefix(acme)).toBe('ACME');
    expect(ownTicket(acme, 'ACME-12')).toBe(true);
    expect(ownTicket(acme, 'CEC-12')).toBe(false);
    expect(ownTicket(projectById('cec'), 'ACME-12')).toBe(false);
    const row = (type: string, payload: unknown) => JSON.stringify({ type, timestamp: '2026-11-17T10:00:00Z', payload });
    const call = (input: string) => row('response_item', { type: 'custom_tool_call', name: 'exec', input });
    const raw = [row('session_meta', { id: 'chat' }), row('event_msg', { type: 'task_started' }),
        call('twg jira workitem get ACME-12 CEC-13 --site https://acme.example.net -o json'),
        call(`twg jira workitem get CEC-14 ACME-15 --site ${CEC.site} -o json`),
        call('open https://acme.example.net/browse/ACME-16 https://acme.example.net/browse/CEC-17'),
    ].join('\n');
    const scopes = sessionScope(raw, 'chat', [projectById('cec'), acme]).scopes;
    expect(scopes.find(scope => scope.project === 'acme')?.issues).toEqual([12, 16]);
    expect(scopes.find(scope => scope.project === 'acme')?.evidence.map(item => item.reference)).toContain('twg jira workitem ACME-12 --site https://acme.example.net');
    expect(scopes.find(scope => scope.project === 'cec')?.issues).toEqual([14]);
    expect(scopes.find(scope => scope.project === 'cec')?.evidence.map(item => item.reference)).toContain(`twg jira workitem CEC-14 --site ${CEC.site}`);
});

test('issue and improvement publication use the project key as the Jira space', async () => {
    const store = open(acme), calls: string[][] = [];
    const execute = vi.fn(async (_program: string, args: string[]) => { calls.push(args); return JSON.stringify({ data: { key: 'ACME-40', url: 'https://acme.example.net/browse/ACME-40' } }); });
    const publisher = new JiraIssuePublisher(store, { id: 'f1', marker: () => 'office-feature-f1-item-a' }, execute as never);
    const operation = (space: string) => ({ id: 'create', kind: 'create', payload: { space, type: 'Task', summary: 'S', description: 'D office-feature-f1-item-a', labels: ['office-feature-f1-item-a'] }, expected: {} }) as never;
    expect(await publisher.dispatch({} as never, operation('ACME'), '', '')).toEqual({ key: 'ACME-40', url: 'https://acme.example.net/browse/ACME-40' });
    expect(calls[0].slice(0, 6)).toEqual(['jira', 'workitem', 'create', '--space', 'ACME', '--type']);
    await expect(publisher.dispatch({} as never, operation('CEC'), '', '')).rejects.toThrow();
    const manifest = await improvementManifest(store, { id: 'i1', problemKey: 'p', cause: 'c', change: 'Change', regression: 'r', acceptance: ['a'], evidence: [] } as never,
        { context: async () => JSON.stringify({ recommendedType: 'Task', assignee: 'acme-account' }) });
    expect((manifest.items[0].operations[0].payload as { space: string }).space).toBe('ACME');
    const cecManifest = await improvementManifest(open(projectById('cec')), { id: 'i1', problemKey: 'p', cause: 'c', change: 'Change', regression: 'r', acceptance: ['a'], evidence: [] } as never,
        { context: async () => JSON.stringify({ recommendedType: 'Task', assignee: CEC.account }) });
    expect((cecManifest.items[0].operations[0].payload as { space: string }).space).toBe('CEC');
});

test('the second project gets the native status read-back and PR preflight fences, not a skip', async () => {
    const store = open(acme), ticket = { ...acmeTicket(), runId: `unit-${crypto.randomUUID()}`, stage: 'repair-review' } as Ticket;
    const result: StageResult = { outcome: 'passed', summary: 'Already Code Review', blocker: '', commit: '', evidence: [], findings: [], paidRuns: 0, worktree: '', branch: '', prId: 0, previewUrl: '', qaRunDir: '',
        receipts: [{ id: 'original', action: 'jira-read-only', target: ticket.key, verified: true, uncertain: false, detail: 'Read-only model observation' }] };
    const issue = { key: ticket.key, status: { id: '10104', name: 'Code Review' }, assignee: { accountId: 'acme-account' }, issuetype: { name: 'Task', subtask: false }, updated: '2026-11-17T10:00:00Z' };
    const execute = vi.fn(async (_program: string, args: string[]) => { expect(args).toContain('https://acme.example.net'); return JSON.stringify({ data: [issue] }); });
    const verified = await verifyAlreadyAtStatus(store, ticket, 'Code Review', result, execute as never);
    expect(verifiedTransition(verified)).toBe(true);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(verified.evidence.at(-1)!.path.startsWith(store.dataRoot)).toBe(true);

    let reads = 0, task = '';
    await withCECPreflightPRs(store, 'readback', 'ACME-7', 'Read this issue', async text => { task = text; return { blocker: '' }; }, async () => { reads++; return []; });
    expect(reads).toBeGreaterThan(0);
    expect(task).toContain('NATIVE ACME AZURE PR OBSERVATION');
    expect(task).not.toContain('NATIVE CEC');
    expect(task).toContain('"repositoryId":"acme-repo-id"');
    await expect(withCECPreflightPRs(store, 'readback', 'CEC-7', 'Read', async () => ({}), async () => [])).rejects.toThrow('provider binding changed');
});

test('each project keeps its own data root', () => {
    expect(projectData(acme)).not.toBe(projectData(projectById('cec')));
    expect(open(acme).dataRoot).not.toBe(open(projectById('cec')).dataRoot);
});

test('the rendered delivery prompt carries the second project\'s authority, target and statuses and none of CEC\'s text', () => {
    const store = open(acme);
    for (const stage of ['understand', 'implement', 'draft-pr', 'ready-for-staging', 'preview', 'qa'] as const) {
        const prompt = cecPrompt(store, { ...acmeTicket(), stage }, stage, 'developer', '/artifacts');
        expect(prompt).toContain(`AUTHORITY: ${ACME_AUTHORITY}\n`);
        expect(prompt).toContain('"repository":"acme-web"');
        expect(prompt).toContain('"target":"develop"');
        expect(prompt).toContain('freshly fetched origin/develop;');
        expect(prompt).toContain('Branch codex/acme-N-short-slug.');
        expect(prompt).toContain('Intake status may move through PM-managed Doing/Code Review/Ready for QA/Testing; reassignment, deletion, another owner, On Hold or unrelated');
        expect(prompt).toContain(`explicitly configured ACME project list ${new URL(LIST).href}`);
        for (const legacy of ['plan on 2026-10-27', 'COS_DEV_PORT', 'origin/staging', 'Existing CEC authority allows documented HTML when ADF is unavailable.', CEC.repositoryId, CEC.site])
            expect(prompt).not.toContain(legacy);
    }
    expect(cecPrompt(store, { ...acmeTicket(), stage: 'understand' }, 'understand', 'developer', '/artifacts')).toContain('the separate Doing transition');
    // Workers use only TWG on this project's own site and login profile, with no connector fallback.
    const twg = cecPrompt(store, { ...acmeTicket(), stage: 'enhance' }, 'enhance', 'pm', '/artifacts');
    expect(twg).toContain(`Use only the installed TWG CLI with --site ${entry.jira.site} --profile acme; there is no MCP or other connector fallback.`);
    expect(twg).not.toMatch(/MCP connection|capability fallback chosen/);
    // CEC still renders its legacy authority and preview from the same registry.
    const cec = cecPrompt(open(projectById('cec')), { ...fixtureTicket(), stage: 'implement' }, 'implement', 'developer', '/artifacts');
    for (const legacy of ['plan on 2026-10-27', 'COS_DEV_PORT', 'Existing CEC authority allows documented HTML when ADF is unavailable.']) expect(cec).toContain(legacy);
    expect(cec).not.toContain(ACME_AUTHORITY);
});

test('eligibility labels and the intake prompt name the project, not CEC', async () => {
    const acmeStore = open(acme), cecStore = open(projectById('cec'));
    const { eligibility } = await import('../../../server/cec/workflow');
    const { cecIntakePrompt } = await import('../../../server/cec/prompts/cec-reads');
    expect(eligibility(acme, { ...acmeTicket(), key: 'CEC-7' })).toBe('Outside ACME');
    expect(eligibility(acme, { ...acmeTicket(), boardMember: false })).toBe('Not in the configured ACME project list');
    expect(eligibility(projectById('cec'), { ...fixtureTicket(), key: 'ACME-7' })).toBe('Outside CEC');
    expect(cecIntakePrompt(acmeStore)).toMatch(/^Check the ACME mailbox \(READ ONLY\)\./);
    expect(cecIntakePrompt(cecStore)).toMatch(/^Check the CEC mailbox \(READ ONLY\)\./);
});
