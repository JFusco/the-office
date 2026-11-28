import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../../server/store/store';
import { projectById } from '../../../../../server/office/projects';
import { coordination } from '../../../../../server/scheduling/coordination';
import { withAssignment } from '../../../../../server/workers/assignment-context';
import type { MaintenanceRun, WorkClaim } from '../../../../../src/shared';

/**
 * A stateful synthetic GitHub, Git remote and project board for #612 maintenance publication tests. It never
 * touches a provider: issues, labels, pull requests, comments, the remote branch tips and board cards are in
 * memory, every write is counted, and a scripted fault can lose a response after the write applied.
 */
export const REPOSITORY = 'JFusco/cms-field-vocabulary';
export const HEAD = 'a'.repeat(40), BASE = 'b'.repeat(40);
type Fault = 'lost' | 'drop-assignee' | 'drop-label' | 'fail';
/** A process crash at one send: `before` the provider applies the write, or `after` it applied it and before the response returns. */
export interface CrashPoint { op: 'issue-create' | 'push' | 'pr-create' | 'comment'; when: 'before' | 'after' }
const cleanup: (() => void)[] = [];
export function cleanupFakes() { cleanup.splice(0).forEach(fn => fn()); }

/**
 * `fixture` is a synthetic GitHub project that reaches the weekly maintenance route but is not CMS, so its fresh
 * maintenance push is not held (`push-hold.ts`); it exercises the harness publication sequence past the CMS hold.
 */
export type FakeProject = 'cms-field-vocabulary' | 'brain' | 'fixture';
const FIXTURE_PROJECT = { id: 'maintenance-fixture', name: 'Maintenance fixture', repository: 'JFusco/maintenance-fixture' };

export function fakeMaintenanceGitHub(options: { project?: FakeProject; pageSize?: number; onDisk?: boolean } = {}) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-maintenance-publication-'));
    const repo = resolve(root, 'checkout'); mkdirSync(repo, { recursive: true });
    const base = options.project === 'fixture' ? { ...projectById('cms-field-vocabulary'), ...FIXTURE_PROJECT } : projectById(options.project || 'cms-field-vocabulary'), repository = base.repository;
    const project = { ...base, repo, target: 'main', githubProject: { owner: 'JFusco', number: 6, url: 'https://github.com/users/JFusco/projects/6' } };
    const storePath = options.onDisk ? resolve(root, 'office.sqlite') : ':memory:';
    let store = new Store(storePath, project, resolve(root, 'data'));
    store.state.paused = false;
    store.state.coordination = coordination();
    store.state.coordination.pickup = { enabled: true, status: 'Ready' };
    cleanup.push(() => { try { store.close(); } catch { /* already closed by a reopen */ } rmSync(root, { recursive: true, force: true }); });
    /** An on-disk store saved, closed and opened again from the same file, as after a restart; the synthetic remote is unchanged. */
    const reopen = () => {
        if (storePath === ':memory:') throw new Error('Only an on-disk fixture store can be reopened');
        store.save(); store.close(); store = new Store(storePath, project, resolve(root, 'data'));
        return store;
    };
    /** After a crash: the file is opened again exactly as the crash left it, with nothing more saved. Recovery is the caller's. */
    const reopenAfterCrash = () => {
        if (storePath === ':memory:' || !state.crashed) throw new Error('Only an on-disk fixture store that crashed can be reopened after the crash');
        store = new Store(storePath, project, resolve(root, 'data'));
        return store;
    };
    const state = {
        user: 'JFusco',
        issues: [] as any[], labels: ['bug', 'area:sources', 'enhancement'] as string[], pulls: [] as any[], comments: {} as Record<number, any[]>,
        remote: {} as Record<string, string>, closing: {} as Record<number, string[]>,
        lanes: [{ id: 'ready', name: 'Ready' }, { id: 'backlog', name: 'Backlog' }, { id: 'progress', name: 'In progress' }],
        cards: [] as { id: string; number: number; status: string }[],
        writes: [] as string[], calls: [] as string[], faults: {} as Record<string, Fault>,
        pageSize: options.pageSize ?? 100,
        origin: `https://github.com/${repository}.git`, hooksPath: '.git/hooks',
        /** Local branches of the primary checkout, as `git for-each-ref` would list them. */
        localBranches: new Set<string>(),
        /** Where the process crashes: the store connection closes with nothing more saved, and the send throws. */
        crashAt: undefined as CrashPoint | undefined,
        crashed: false,
    };
    const boundary = (op: CrashPoint['op'], when: CrashPoint['when']) => {
        if (state.crashAt?.op !== op || state.crashAt.when !== when) return;
        state.crashAt = undefined; state.crashed = true;
        store.close();
        throw new Error(`simulated crash ${when} the ${op} send`);
    };
    const pages = <T>(rows: T[]) => { const out: T[][] = []; for (let i = 0; i < rows.length; i += state.pageSize) out.push(rows.slice(i, i + state.pageSize)); return out.length ? out : [[]]; };
    const fault = (name: string) => { const f = state.faults[name]; delete state.faults[name]; return f; };
    const issueUrl = (n: number) => `https://github.com/${repository}/issues/${n}`;
    const addIssue = (input: Partial<any> & { title: string; body: string }) => {
        const number = 100 + state.issues.length + state.pulls.length;
        const issue = { number, node_id: `I_${number}`, html_url: issueUrl(number), state: 'open', title: input.title, body: input.body,
            labels: (input.labels || []).map((name: string) => ({ name })), assignees: (input.assignees || []).map((login: string) => ({ login })), user: { login: input.user || state.user }, ...(input.extra || {}) };
        state.issues.push(issue); return issue;
    };
    const addPull = (input: { branch: string; head: string; title: string; body: string; draft?: boolean; state?: string; base?: string; fork?: boolean; user?: string; closes?: string[] }) => {
        const number = 100 + state.issues.length + state.pulls.length;
        const pull = { number, html_url: `https://github.com/${repository}/pull/${number}`, state: input.state || 'open', draft: input.draft ?? true, title: input.title, body: input.body,
            user: { login: input.user || state.user }, head: { ref: input.branch, sha: input.head, repo: { full_name: input.fork ? 'someone/fork' : repository } }, base: { ref: input.base || 'main', repo: { full_name: repository } } };
        state.pulls.push(pull); state.closing[number] = input.closes || []; return pull;
    };
    const graphql = ({ query, variables }: { query: string; variables: any }) => {
        if (query.startsWith('mutation') && query.includes('addProjectV2ItemById')) {
            state.writes.push('board-add');
            const issue = state.issues.find(i => i.node_id === variables.content); const id = `card-${issue.number}`;
            state.cards.push({ id, number: issue.number, status: '' }); return { data: { addProjectV2ItemById: { item: { id } } } };
        }
        if (query.startsWith('mutation')) { state.writes.push('board-status'); state.cards.find(c => c.id === variables.item)!.status = variables.option; return { data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: variables.item } } } }; }
        if (query.includes('fields(first')) return { data: { user: { projectV2: { id: 'project', fields: { nodes: [{ id: 'status', name: 'Status', options: state.lanes }], pageInfo: { hasNextPage: false } } } } } };
        if (query.includes('items(first')) return { data: { node: { items: { nodes: state.cards.map(card => ({ id: card.id, content: { __typename: 'Issue', number: card.number, repository: { nameWithOwner: repository } } })), pageInfo: { hasNextPage: false } } } } };
        const card = state.cards.find(c => c.id === variables.item)!;
        return { data: { node: { id: card.id, fieldValues: { nodes: card.status ? [{ field: { id: 'status' }, optionId: card.status }] : [], pageInfo: { hasNextPage: false } } } } };
    };
    const execute = async (program: string, args: string[], opts: any = {}): Promise<string> => {
        const line = `${program} ${args.join(' ')}`; state.calls.push(line);
        if (program === 'git' && args[0] === 'ls-remote') {
            const ref = args[args.length - 1], branch = ref.replace('refs/heads/', '');
            return state.remote[branch] ? `${state.remote[branch]}\t${ref}\n` : '';
        }
        if (program === 'git' && args[0] === 'remote' && args[1] === 'get-url') return `${state.origin}\n`;
        if (program === 'git' && args[0] === 'rev-parse' && args[1] === '--git-path') return `${state.hooksPath}\n`;
        if (program === 'git' && args[0] === 'push') {
            boundary('push', 'before');
            const [sha, ref] = args[2].split(':'); state.writes.push(`push ${ref}`);
            if (fault('push') === 'fail') throw new Error('git push exited 1: rejected');
            state.remote[ref.replace('refs/heads/', '')] = sha;
            boundary('push', 'after');
            if (state.faults.pushLost) { delete state.faults.pushLost; throw new Error('git push exited 128: connection reset'); }
            return '';
        }
        if (program === 'gh' && args[0] === 'pr' && args[1] === 'create') {
            const head = args[args.indexOf('--head') + 1], title = args[args.indexOf('--title') + 1];
            boundary('pr-create', 'before');
            state.writes.push(`pr-create ${head}`);
            const pull = addPull({ branch: head, head: state.remote[head], title, body: opts.input, draft: true, closes: [...String(opts.input).matchAll(/Closes #(\d+)/g)].map(m => issueUrl(Number(m[1]))) });
            boundary('pr-create', 'after');
            if (fault('pr-create') === 'lost') throw new Error('gh exited 1: HTTP 502');
            return `${pull.html_url}\n`;
        }
        if (program === 'gh' && args[0] === 'pr' && args[1] === 'view') {
            const pull = state.pulls.find(p => p.number === Number(args[2]));
            return JSON.stringify({ number: pull.number, url: pull.html_url, title: pull.title, body: pull.body, headRefOid: pull.head.sha, isDraft: pull.draft, closingIssuesReferences: (state.closing[pull.number] || []).map(url => ({ url })) });
        }
        if (program === 'gh' && args[0] === 'api') {
            const path = args[1], method = args.includes('--method') ? args[args.indexOf('--method') + 1] : 'GET';
            if (path === 'graphql') return JSON.stringify(graphql(JSON.parse(opts.input)));
            const rest = path.replace(`repos/${repository}/`, '');
            if (rest === 'issues?state=all&per_page=100') return JSON.stringify(pages([...state.issues, ...state.pulls.map(p => ({ ...p, pull_request: {} }))]));
            if (rest === 'labels?per_page=100') return JSON.stringify(pages(state.labels.map(name => ({ name }))));
            if (rest === 'pulls?state=all&per_page=100' || rest === 'pulls?state=open&per_page=100') return JSON.stringify(pages(state.pulls.filter(p => rest.includes('all') || p.state === 'open')));
            if (rest === 'issues' && method === 'POST') {
                boundary('issue-create', 'before');
                const input = JSON.parse(opts.input); state.writes.push('issue-create');
                const f = fault('issue-create');
                const issue = addIssue({ ...input, assignees: f === 'drop-assignee' ? [] : input.assignees, labels: f === 'drop-label' ? input.labels.slice(1) : input.labels });
                boundary('issue-create', 'after');
                if (f === 'lost') throw new Error('gh exited 1: HTTP 502');
                return JSON.stringify(issue);
            }
            const assign = rest.match(/^issues\/(\d+)\/assignees$/);
            if (assign && method === 'POST') { state.writes.push('issue-assign'); const issue = state.issues.find(i => i.number === Number(assign[1])); issue.assignees.push(...JSON.parse(opts.input).assignees.map((login: string) => ({ login }))); return JSON.stringify(issue); }
            const comments = rest.match(/^issues\/(\d+)\/comments(\?per_page=100)?$/);
            if (comments && method === 'POST') {
                boundary('comment', 'before');
                const n = Number(comments[1]); state.writes.push('comment'); const id = 9000 + Object.values(state.comments).flat().length;
                const comment = { id, html_url: `${issueUrl(n)}#issuecomment-${id}`, body: JSON.parse(opts.input).body, user: { login: state.user } };
                (state.comments[n] ??= []).push(comment);
                boundary('comment', 'after');
                if (fault('comment') === 'lost') throw new Error('gh exited 1: HTTP 502');
                return JSON.stringify(comment);
            }
            if (comments) return JSON.stringify(pages(state.comments[Number(comments[1])] || []));
            const issue = rest.match(/^issues\/(\d+)$/);
            if (issue) return JSON.stringify(state.issues.find(i => i.number === Number(issue[1])) || state.pulls.find(p => p.number === Number(issue[1])));
        }
        throw new Error(`Unexpected synthetic command: ${line}`);
    };
    const board = async () => ({ error: '', items: state.cards.map(card => ({ repository, number: card.number, status: state.lanes.find(l => l.id === card.status)?.name || '' })) });
    /** Runs work under a real, running scheduler claim of this kind for the run, as the scheduler does. */
    const claimed = async <T>(run: MaintenanceRun, kind: 'maintenance' | 'continuation' | 'reconciliation' | 'conversation', work: () => Promise<T>, stage = kind === 'continuation' ? 'repair-followup' : run.stage, id = run.id): Promise<T> => {
        const claim = store.claimWork({ projectId: store.project.id, kind, id }, 'test-scheduler', stage) as WorkClaim;
        if (!claim) throw new Error('claim refused');
        try { return await withAssignment(claim, 'delivery', work); }
        finally { store.finishClaim(claim.id, 'completed'); }
    };
    return { root, get store() { return store; }, reopen, reopenAfterCrash, project, repository, state, execute, addIssue, addPull, board, claimed, issueUrl };
}
