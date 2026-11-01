import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { GitHubDelivery } from '../../../../server/delivery/pipeline/github-delivery';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import type { TicketJob } from '../../../../src/shared';

export const REPOSITORY = 'JFusco/cms-field-vocabulary';
export const BASE = 'b'.repeat(40);
export const HEAD = 'a'.repeat(40);
const cleanup: (() => void)[] = [];
export function cleanupFakes() { cleanup.splice(0).forEach(fn => fn()); }

/** Stateful, synthetic GitHub + git + board for hands-off delivery tests. Never touches a real provider. */
export function fakeGitHub(issueNumber = 5) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-delivery-'));
    const repo = resolve(root, 'cms-field-vocabulary');
    mkdirSync(repo, { recursive: true });
    const store = new Store(':memory:', { ...projectById('cms-field-vocabulary'), repo, repository: REPOSITORY, target: 'main', githubProject: { owner: 'JFusco', number: 6, url: 'https://github.com/users/JFusco/projects/6' } }, resolve(root, 'data'));
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    store.state.coordination = coordination();
    store.state.coordination.pickup = { enabled: true, status: 'Ready' };
    store.state.tickets.push({ key: `GH-${issueNumber}`, summary: 'Restore release scans', type: 'GitHub issue', status: 'open', statusId: '', assignee: 'JFusco', subtask: false, boardMember: true, url: `https://github.com/${REPOSITORY}/issues/${issueNumber}`, updated: '', stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' });
    const issueUrl = `https://github.com/${REPOSITORY}/issues/${issueNumber}`;
    const state = {
        issue: { number: issueNumber, html_url: issueUrl, title: '[Bug] Restore release scans', state: 'open', updated_at: '2026-10-31T12:00:00Z', assignees: [{ login: 'JFusco' }] } as any,
        prs: [] as any[],
        remote: {} as Record<string, string>,
        local: { head: BASE, branch: '', dirty: false },
        localBranches: new Set<string>(),
        comments: [] as any[],
        runs: [] as any[],
        lanes: [{ id: 'ready', name: 'Ready' }, { id: 'progress', name: 'In progress' }, { id: 'review', name: 'In review' }, { id: 'done', name: 'Done' }, { id: 'block', name: 'Block' }, { id: 'backlog', name: 'Backlog' }],
        cards: [{ id: 'issue-card', kind: 'Issue', number: issueNumber, status: 'ready' }] as { id: string; kind: string; number: number; status: string }[],
        calls: [] as string[],
        fail: (_program: string, _args: string[]) => false as boolean | string,
        notAncestor: false,
        lintFails: false,
    };
    const prJson = (pr: any) => ({ number: pr.number, url: pr.html_url, state: pr.merged_at ? 'MERGED' : pr.state === 'open' ? 'OPEN' : 'CLOSED', headRefOid: pr.head.sha, baseRefName: pr.base.ref, isDraft: pr.draft, closingIssuesReferences: new RegExp(`Closes #${issueNumber}\\b`).test(pr.body || '') ? [{ url: issueUrl, number: issueNumber }] : [] });
    const execute = async (program: string, args: string[], options: any = {}): Promise<string> => {
        const line = `${program} ${args.join(' ')}`;
        state.calls.push(line);
        const failure = state.fail(program, args);
        if (failure) throw new Error(typeof failure === 'string' ? failure : `Synthetic failure: ${line}`);
        if (program === 'git') {
            const [cmd, ...rest] = args;
            if (cmd === 'remote') return `https://github.com/${REPOSITORY}.git\n`;
            if (cmd === 'fetch') return '';
            if (cmd === 'rev-parse') return rest[0] === 'HEAD' ? state.local.head : BASE;
            if (cmd === 'branch') { if (rest[0] === '-D') { state.localBranches.delete(rest[1]); return ''; } return state.local.branch; }
            if (cmd === 'status') return state.local.dirty ? ' M file.ts' : '';
            if (cmd === 'for-each-ref') return state.localBranches.has(rest[1].replace('refs/heads/', '')) ? state.local.head : '';
            if (cmd === 'worktree') {
                if (rest[0] === 'remove') { rmSync(rest[2], { recursive: true, force: true }); return ''; }
                if (rest[0] === 'prune') return '';
                mkdirSync(rest[3], { recursive: true }); state.localBranches.add(rest[2]); Object.assign(state.local, { head: rest[4], branch: rest[2], dirty: false }); return '';
            }
            if (cmd === 'merge-base') { if (state.notAncestor) throw new Error('not an ancestor'); return ''; }
            if (cmd === 'ls-remote') { const ref = rest[2].replace('refs/heads/', ''); return state.remote[ref] ? `${state.remote[ref]}\trefs/heads/${ref}\n` : ''; }
            if (cmd === 'push') { const [sha, ref] = rest[1].split(':'); const branch = ref.replace('refs/heads/', ''); state.remote[branch] = sha; for (const pr of state.prs) if (pr.head.ref === branch && pr.state === 'open') pr.head.sha = sha; return ''; }
            if (cmd === 'log') return 'fix(sources): restore release scans\n';
        }
        if (program === 'pnpm') { if (state.lintFails) throw new Error('lint:pr failed'); return ''; }
        if (program === 'gh' && args[0] === 'pr') {
            const flag = (name: string) => args[args.indexOf(name) + 1];
            if (args[1] === 'list') return JSON.stringify(state.prs.filter(pr => (args.includes('--base') ? pr.base.ref === flag('--base') : pr.head.ref === flag('--head')) && (flag('--state') === 'all' || pr.state === flag('--state'))).map(prJson));
            if (args[1] === 'create') {
                const number = 200 + state.prs.length, branch = flag('--head');
                state.prs.push({ number, html_url: `https://github.com/${REPOSITORY}/pull/${number}`, state: 'open', draft: true, title: flag('--title'), body: options.input, head: { sha: state.remote[branch], ref: branch }, base: { ref: flag('--base'), sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null, merge_commit_sha: null, updated_at: '2026-10-31T12:00:00Z' });
                return `https://github.com/${REPOSITORY}/pull/${number}\n`;
            }
            if (args[1] === 'ready') { state.prs.find(pr => pr.number === Number(args[2])).draft = false; return ''; }
            if (args[1] === 'view') return JSON.stringify({ closingIssuesReferences: prJson(state.prs.find(pr => pr.number === Number(args[2]))).closingIssuesReferences });
        }
        if (program === 'gh' && args[0] === 'issue' && args[1] === 'close') { state.issue.state = 'closed'; return ''; }
        if (program === 'gh' && args[0] === 'api') {
            const path = args[1];
            if (path === 'graphql') return JSON.stringify(graphql(JSON.parse(options.input)));
            if (path.includes('/comments') && args.includes('-f')) { const comment = { id: 900 + state.comments.length, html_url: `${issueUrl}#issuecomment-${900 + state.comments.length}`, body: args[args.indexOf('-f') + 1].slice(5) }; state.comments.push(comment); return JSON.stringify(comment); }
            if (path.includes('issues/comments/')) return JSON.stringify(state.comments.find(c => path.endsWith(`/${c.id}`)));
            if (path.includes(`/issues/${issueNumber}/comments`)) return JSON.stringify([state.comments]);
            if (path.endsWith(`/issues/${issueNumber}`)) return JSON.stringify(state.issue);
            if (path.includes('/pulls?state=open&base=')) return JSON.stringify([state.prs.filter(pr => pr.state === 'open' && pr.base.ref === decodeURIComponent(path.split('base=')[1].split('&')[0]))]);
            if (path.includes('/pulls?state=open')) return JSON.stringify([state.prs.filter(pr => pr.state === 'open')]);
            if (path.includes('/pulls/')) return JSON.stringify(state.prs.find(pr => path.endsWith(`/pulls/${pr.number}`)));
            if (path.includes('actions/runs')) return JSON.stringify({ total_count: state.runs.length, workflow_runs: state.runs });
            if (path.endsWith('/commits/main')) return JSON.stringify({ sha: BASE });
        }
        throw new Error(`Unexpected synthetic command: ${line}`);
    };
    function graphql({ query, variables }: { query: string; variables: any }) {
        if (query.startsWith('mutation')) { state.cards.find(c => c.id === variables.item)!.status = variables.option; return { data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: variables.item } } } }; }
        if (query.includes('fields(first')) return { data: { user: { projectV2: { id: 'project', fields: { nodes: [{ id: 'status', name: 'Status', options: state.lanes }], pageInfo: { hasNextPage: false } } } } } };
        if (query.includes('items(first')) return { data: { node: { items: { nodes: state.cards.map(card => ({ id: card.id, content: { __typename: card.kind, number: card.number, repository: { nameWithOwner: REPOSITORY } } })), pageInfo: { hasNextPage: false } } } } };
        const card = state.cards.find(c => c.id === variables.item)!;
        return { data: { node: { id: card.id, fieldValues: { nodes: [{ field: { id: 'status' }, optionId: card.status }], pageInfo: { hasNextPage: false } } } } };
    }
    const engine = new Engine(store);
    engine.github.board = async () => ({ title: 'CMS', url: 'https://github.com/users/JFusco/projects/6', description: '', readme: '', observedAt: '', error: '', lanes: state.lanes.map(l => l.name), items: state.cards.filter(c => c.kind === 'Issue').map(c => ({ id: c.id, number: c.number, title: '', url: issueUrl, repository: REPOSITORY, state: state.issue.state, status: state.lanes.find(l => l.id === c.status)!.name })) });
    const delivery = new GitHubDelivery(store, engine, execute as any);
    const root_ = (job: TicketJob) => { const dir = resolve(store.dataRoot, 'ticket-work', job.id); mkdirSync(dir, { recursive: true }); return dir; };
    /** A reviewed local candidate ready to publish. */
    function candidate(overrides: Partial<TicketJob> = {}): TicketJob {
        delivery.enqueue(`GH-${issueNumber}`, 0, 'Ready');
        const job = delivery.jobs.at(-1)!;
        const worktree = resolve(root, 'cms-field-vocabulary-worktrees', `${issueNumber}-restore-release-scans`);
        mkdirSync(worktree, { recursive: true });
        writeFileSync(resolve(worktree, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'node scripts/validate_pr_body.cjs' } }));
        Object.assign(job, { head: HEAD, branch: `codex/${issueNumber}-restore-release-scans`, worktree, candidateBase: BASE, approach: { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } }, overrides);
        Object.assign(state.local, { head: job.head, branch: job.branch, dirty: false });
        return job;
    }
    return { root, repo, store, engine, delivery, execute, state, issueUrl, artifactRoot: root_, candidate };
}
