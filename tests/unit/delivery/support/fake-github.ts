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

/** When a synthetic pull request without its own creation time was opened. */
export const CREATED = '2026-10-31T12:00:00Z';
let editSeconds = 0;
/** GitHub's `PullRequest` description fields for a synthetic REST pull request, with its edit history. */
export function descriptionNode(pr: any) {
    const edits = pr.edits || [];
    return { number: pr.number, url: pr.html_url, state: pr.merged_at ? 'MERGED' : pr.state === 'open' ? 'OPEN' : 'CLOSED', baseRefName: pr.base.ref,
        headRefName: pr.head.ref, headRefOid: pr.head.sha, title: pr.title, body: pr.body, createdAt: pr.created_at || CREATED,
        lastEditedAt: pr.last_edited_at ?? null, includesCreatedEdit: !!pr.includes_created_edit,
        userContentEdits: { totalCount: edits.length, nodes: edits, pageInfo: { hasNextPage: false } } };
}
/** Records a body edit the way GitHub does: the first edit also lists the original text, dated at creation. */
export function editDescription(pr: any, body: string, at = new Date(Date.UTC(2026, 10, 24, 0, 0, ++editSeconds)).toISOString().replace('.000Z', 'Z')) {
    if (body === pr.body) return;
    pr.edits ??= [];
    if (!pr.includes_created_edit) { pr.edits.push({ id: `UCE_${pr.number}_original`, createdAt: at, editedAt: pr.created_at || CREATED, deletedAt: null }); pr.includes_created_edit = true; }
    pr.edits.unshift({ id: `UCE_${pr.number}_${editSeconds}_${pr.edits.length}`, createdAt: at, editedAt: at, deletedAt: null });
    pr.last_edited_at = at; pr.body = body;
}

/** Stateful, synthetic GitHub + git + board for hands-off delivery tests. Never touches a real provider. */
export function fakeGitHub(issueNumber = 5, options: { onDisk?: boolean } = {}) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-delivery-'));
    const repo = resolve(root, 'cms-field-vocabulary');
    mkdirSync(repo, { recursive: true });
    const project = { ...projectById('cms-field-vocabulary'), repo, repository: REPOSITORY, target: 'main', githubProject: { owner: 'JFusco', number: 6, url: 'https://github.com/users/JFusco/projects/6' } };
    const storePath = options.onDisk ? resolve(root, 'office.sqlite') : ':memory:';
    let store = new Store(storePath, project, resolve(root, 'data'));
    cleanup.push(() => { try { store.close(); } catch { /* already closed by reopen */ } rmSync(root, { recursive: true, force: true }); });
    store.state.coordination = coordination();
    store.state.coordination.pickup = { enabled: true, status: 'Ready' };
    store.state.tickets.push({ key: `GH-${issueNumber}`, summary: 'Restore release scans', type: 'GitHub issue', status: 'open', statusId: '', assignee: 'JFusco', subtask: false, boardMember: true, url: `https://github.com/${REPOSITORY}/issues/${issueNumber}`, updated: '', stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' });
    const issueUrl = `https://github.com/${REPOSITORY}/issues/${issueNumber}`;
    const state = {
        issue: { number: issueNumber, html_url: issueUrl, title: '[Bug] Restore release scans', state: 'open', updated_at: '2026-10-31T12:00:00Z', assignees: [{ login: 'JFusco' }] } as any,
        prs: [] as any[],
        remote: {} as Record<string, string>,
        local: { head: BASE, branch: '', dirty: false } as { head: string; branch: string; dirty: boolean; status?: string },
        localBranches: new Set<string>(),
        comments: [] as any[],
        runs: [] as any[],
        lanes: [{ id: 'ready', name: 'Ready' }, { id: 'progress', name: 'In progress' }, { id: 'review', name: 'In review' }, { id: 'done', name: 'Done' }, { id: 'block', name: 'Block' }, { id: 'backlog', name: 'Backlog' }],
        cards: [{ id: 'issue-card', kind: 'Issue', number: issueNumber, status: 'ready' }] as { id: string; kind: string; number: number; status: string }[],
        calls: [] as string[],
        fail: (_program: string, _args: string[]) => false as boolean | string,
        notAncestor: false,
        lintFails: false,
        prFiles: {} as Record<number, (string | Record<string, unknown>)[]>,
        prCommits: {} as Record<number, (string | Record<string, unknown>)[]>,
        /** Optional provider state for bot PR recovery tests; absent fields keep the routes above unchanged. */
        nativeLinks: {} as Record<number, boolean>,
        issues: {} as Record<number, any>,
        checks: {} as Record<string, any[]>,
        trees: {} as Record<string, { truncated?: boolean; tree: { path: string; type: string; mode: string; sha: string }[] }>,
        events: {} as Record<number, any[]>,
        targetTip: BASE,
        repo: { full_name: REPOSITORY, default_branch: 'main', allow_merge_commit: true } as any,
        user: 'JFusco',
        /** Attempted writes, recorded before the remote state changes. */
        mutations: [] as { method: string; target: string; args: string[] }[],
        /** Applies the write, then loses its response. */
        loseResponse: (_program: string, _args: string[]) => false as boolean,
        onDispatch: (_workflow: string, _inputs: Record<string, string>, _run: any) => {},
    };
    const linked = (pr: any) => state.nativeLinks[pr.number] ?? new RegExp(`Closes #${issueNumber}\\b`).test(pr.body || '');
    const prJson = (pr: any) => ({ number: pr.number, url: pr.html_url, state: pr.merged_at ? 'MERGED' : pr.state === 'open' ? 'OPEN' : 'CLOSED', headRefOid: pr.head.sha, baseRefName: pr.base.ref, isDraft: pr.draft, title: pr.title, body: pr.body, closingIssuesReferences: linked(pr) ? [{ url: issueUrl, number: issueNumber }] : [] });
    const fields = (args: string[]) => Object.fromEntries(args.flatMap((arg, i) => args[i - 1] === '-f' ? [[arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)]] : []));
    const method = (args: string[]) => args[args.indexOf('-X') + 1] && args.includes('-X') ? args[args.indexOf('-X') + 1] : args.includes('--method') ? args[args.indexOf('--method') + 1] : '';
    const execute = async (program: string, args: string[], options: any = {}): Promise<string> => {
        const line = `${program} ${args.join(' ')}`;
        state.calls.push(line);
        const write = program === 'gh' && args[0] === 'api' && (!!method(args) || args.includes('-f') && args[1] !== 'graphql');
        const failure = state.fail(program, args);
        if (write) state.mutations.push({ method: method(args) || 'POST', target: args.find(a => a.startsWith('repos/')) || '', args });
        if (failure) throw new Error(typeof failure === 'string' ? failure : `Synthetic failure: ${line}`);
        const out = await respond(program, args, options);
        const mutation = program === 'gh' && args[1] === 'graphql' && /^\s*mutation\b/.test(JSON.parse(options.input || '{}').query || '');
        if ((write || mutation) && state.loseResponse(program, args)) throw new Error(`Synthetic lost response: ${line}`);
        return out;
    };
    const number = (match: RegExpMatchArray) => Number(match[1]);
    const respond = async (program: string, args: string[], options: any = {}): Promise<string> => {
        const line = `${program} ${args.join(' ')}`;
        if (program === 'git') {
            const [cmd, ...rest] = args;
            if (cmd === 'remote') return `https://github.com/${REPOSITORY}.git\n`;
            if (cmd === 'fetch') return '';
            if (cmd === 'rev-parse') return rest[0] === 'HEAD' ? state.local.head : BASE;
            if (cmd === 'branch') { if (rest[0] === '-D') { state.localBranches.delete(rest[1]); return ''; } return state.local.branch; }
            if (cmd === 'status') return state.local.status ?? (state.local.dirty ? ' M file.ts' : '');
            if (cmd === 'for-each-ref') return state.localBranches.has(rest[1].replace('refs/heads/', '')) ? state.local.head : '';
            if (cmd === 'worktree') {
                if (rest[0] === 'remove') { rmSync(rest.at(-1)!, { recursive: true, force: true }); return ''; }
                if (rest[0] === 'prune') return '';
                if (rest[0] === 'list') return '';
                mkdirSync(rest[3], { recursive: true }); state.localBranches.add(rest[2]); Object.assign(state.local, { head: rest[4], branch: rest[2], dirty: false }); return '';
            }
            if (cmd === 'merge-base') { if (state.notAncestor) throw new Error('not an ancestor'); return ''; }
            if (cmd === 'ls-remote') { const ref = rest[2].replace('refs/heads/', ''); return state.remote[ref] ? `${state.remote[ref]}\trefs/heads/${ref}\n` : ''; }
            if (cmd === 'push') { const [sha, ref] = rest[1].split(':'); const branch = ref.replace('refs/heads/', ''); state.remote[branch] = sha; for (const pr of state.prs) if (pr.head.ref === branch && pr.state === 'open') pr.head.sha = sha; return ''; }
            if (cmd === 'log') return 'fix(sources): restore release scans\n';
        }
        if (program === 'rm') return '';
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
        if (program === 'gh' && args[0] === 'api' && args[1] === '-X' && args[2] === 'DELETE' && /\/git\/refs\/heads\//.test(args[3])) { state.remote[args[3].split('/git/refs/heads/')[1]] = ''; return ''; }
        if (program === 'gh' && args[0] === 'api') {
            const path = args.find((arg, i) => i > 0 && !arg.startsWith('-') && !['-X', '-H', '--method', '-f'].includes(args[i - 1])) || args[1];
            if (path === 'user') return JSON.stringify({ login: state.user });
            const verb = method(args), f = fields(args);
            if (path === `repos/${REPOSITORY}`) return JSON.stringify(state.repo);
            const dispatch = path.match(/\/actions\/workflows\/([^/]+)\/dispatches$/);
            if (dispatch && verb === 'POST') {
                const id = 7000 + state.runs.length, inputs = Object.fromEntries(Object.entries(f).filter(([k]) => k.startsWith('inputs[')).map(([k, v]) => [k.slice(7, -1), v]));
                const run = { id, path: `.github/workflows/${dispatch[1]}`, event: 'workflow_dispatch', head_branch: f.ref, head_sha: state.targetTip, status: 'queued', conclusion: null, created_at: store.clock.now().toISOString(), updated_at: store.clock.now().toISOString(), html_url: `https://github.com/${REPOSITORY}/actions/runs/${id}`, repository: { full_name: REPOSITORY }, inputs };
                state.runs.push(run); state.onDispatch(dispatch[1], inputs, run);
                return JSON.stringify({ workflow_run_id: id, run_url: `https://api.github.com/repos/${REPOSITORY}/actions/runs/${id}`, html_url: run.html_url });
            }
            const runRead = path.match(/\/actions\/runs\/(\d+)$/);
            if (runRead) { const run = state.runs.find(r => r.id === Number(runRead[1])); if (!run) throw new Error('HTTP 404: Not Found'); return JSON.stringify(run); }
            const conversation = path.match(/\/issues\/(\d+)\/comments(?:\?|$)/);
            if (conversation && f.body !== undefined) {
                const number = Number(conversation[1]), pull = state.prs.some(pr => pr.number === number), id = 900 + state.comments.length;
                const comment = { id, html_url: number === issueNumber ? `${issueUrl}#issuecomment-${id}` : `https://github.com/${REPOSITORY}/${pull ? 'pull' : 'issues'}/${number}#issuecomment-${id}`, issue_url: `https://api.github.com/repos/${REPOSITORY}/issues/${number}`, user: { login: state.user }, body: f.body };
                state.comments.push(comment); return JSON.stringify(comment);
            }
            if (conversation) return JSON.stringify([state.comments.filter(c => c.issue_url ? c.issue_url.endsWith(`/issues/${conversation[1]}`) : number(conversation) === issueNumber)]);
            const events = path.match(/\/issues\/(\d+)\/events/);
            if (events) return JSON.stringify([state.events[Number(events[1])] || []]);
            const issuePatch = path.match(/\/issues\/(\d+)$/);
            if (issuePatch && verb === 'PATCH') { const issue = Number(issuePatch[1]) === issueNumber ? state.issue : state.issues[Number(issuePatch[1])]; Object.assign(issue, f); return JSON.stringify(issue); }
            if (issuePatch && state.issues[Number(issuePatch[1])]) return JSON.stringify(state.issues[Number(issuePatch[1])]);
            const mergePut = path.match(/\/pulls\/(\d+)\/merge$/);
            if (mergePut && verb === 'PUT') {
                const pr = state.prs.find(p => p.number === Number(mergePut[1]));
                if (!pr || pr.state !== 'open' || pr.head.sha !== f.sha) throw new Error('HTTP 409: Head branch was modified');
                Object.assign(pr, { state: 'closed', merged: true, merged_at: store.clock.now().toISOString(), merge_commit_sha: 'f'.repeat(40), merged_by: { login: 'JFusco' } });
                return JSON.stringify({ merged: true, sha: pr.merge_commit_sha });
            }
            if (/\/git\/ref\/heads\//.test(path)) return JSON.stringify({ ref: `refs/heads/${path.split('/git/ref/heads/')[1]}`, object: { sha: state.targetTip, type: 'commit' } });
            const trees = path.match(/\/git\/trees\/([a-f0-9]{40})/);
            if (trees) { const t = state.trees[trees[1]]; if (!t) throw new Error('HTTP 404: Not Found'); return JSON.stringify({ sha: trees[1], truncated: t.truncated ?? false, tree: t.tree }); }
            const checkRuns = path.match(/\/commits\/([a-f0-9]{40})\/check-runs/);
            if (checkRuns && state.checks[checkRuns[1]]) return JSON.stringify({ total_count: state.checks[checkRuns[1]].length, check_runs: state.checks[checkRuns[1]] });
            if (path === 'graphql') return JSON.stringify(graphql(JSON.parse(options.input)));
            if (path.includes('/comments') && args.includes('-f')) { const comment = { id: 900 + state.comments.length, html_url: `${issueUrl}#issuecomment-${900 + state.comments.length}`, user: { login: 'JFusco' }, body: args[args.indexOf('-f') + 1].slice(5) }; state.comments.push(comment); return JSON.stringify(comment); }
            if (path.includes('issues/comments/')) return JSON.stringify(state.comments.find(c => path.endsWith(`/${c.id}`)));
            if (path.includes(`/issues/${issueNumber}/comments`)) return JSON.stringify([state.comments]);
            if (path.endsWith(`/issues/${issueNumber}`)) return JSON.stringify(state.issue);
            if (path.includes('/pulls?state=open&base=')) return JSON.stringify([state.prs.filter(pr => pr.state === 'open' && pr.base.ref === decodeURIComponent(path.split('base=')[1].split('&')[0]))]);
            if (path.includes('/pulls?state=open')) return JSON.stringify([state.prs.filter(pr => pr.state === 'open')]);
            const files = path.match(/\/pulls\/(\d+)\/files/), commits = path.match(/\/pulls\/(\d+)\/commits/);
            if (files) return JSON.stringify([(state.prFiles[Number(files[1])] || []).map(file => typeof file === 'string' ? { filename: file } : file)]);
            if (commits) return JSON.stringify([(state.prCommits[Number(commits[1])] || []).map((login, i) => typeof login !== 'string' ? login : ({ sha: `${i}`.padStart(40, 'c'), author: { login }, committer: { login: login === 'dependabot[bot]' ? 'web-flow' : login }, commit: { verification: { verified: login === 'dependabot[bot]' } } }))]);
            if (path.endsWith('/issues') && args.includes('POST')) {
                const field = (name: string) => args.find((arg, i) => args[i - 1] === '-f' && arg.startsWith(`${name}=`))!.slice(name.length + 1);
                Object.assign(state.issue, { title: field('title'), body: field('body'), node_id: `issue-node-${issueNumber}`, user: { login: 'JFusco' }, assignees: [{ login: 'JFusco' }] });
                return JSON.stringify(state.issue);
            }
            if (path.includes('/issues?state=all')) return JSON.stringify([state.issue.body ? [state.issue] : []]);
            const patch = path.match(/\/pulls\/(\d+)$/);
            if (patch && args.includes('PATCH')) {
                const pr = state.prs.find(p => p.number === Number(patch[1])), f = fields(args);
                // GitHub derives closing links from an edited body again.
                if ('body' in f) { pr.body = f.body; delete state.nativeLinks[pr.number]; }
                if ('title' in f) pr.title = f.title;
                if (f.state) Object.assign(pr, { state: f.state, ...(f.state === 'closed' ? { closed_at: store.clock.now().toISOString() } : {}) });
                return JSON.stringify(pr);
            }
            if (path.includes('/pulls/')) return JSON.stringify(state.prs.find(pr => path.endsWith(`/pulls/${pr.number}`)));
            if (path.includes('actions/runs')) return JSON.stringify({ total_count: state.runs.length, workflow_runs: state.runs });
            if (path.endsWith('/branches/main')) return JSON.stringify({ name: 'main', protected: false });
            if (path.includes('/rulesets')) return JSON.stringify([[]]);
            if (path.includes('/check-runs')) return JSON.stringify({ total_count: 0, check_runs: [] });
            if (/\/commits\/[a-f0-9]{40}\/status$/.test(path)) return JSON.stringify({ sha: path.split('/commits/')[1].slice(0, 40), state: 'pending', total_count: 0, statuses: [] });
            if (path.endsWith('/commits/main')) return JSON.stringify({ sha: BASE });
        }
        throw new Error(`Unexpected synthetic command: ${line}`);
    };
    function graphql({ query, variables }: { query: string; variables: any }) {
        if (query.includes('mergeStateStatus')) { const pr = state.prs.find(p => p.number === variables.number); return { data: { repository: { pullRequest: pr && { headRefOid: pr.head.sha, baseRefName: pr.base.ref, mergeStateStatus: pr.mergeStateStatus ?? 'CLEAN', reviewDecision: null, reviewThreads: { nodes: pr.threads ?? [], pageInfo: { hasNextPage: false } } } } } }; }
        if (query.startsWith('mutation')) state.mutations.push({ method: 'GRAPHQL', target: 'project', args: [JSON.stringify(variables)] });
        // The description-history query also reads each edit's editor; the relink query is the one with a top-level editor.
        if (query.includes('editor{') && !query.includes('userContentEdits')) { const pr = state.prs.find(p => p.number === variables.number); return { data: { repository: { pullRequest: pr && { id: `PR_${pr.number}`, url: pr.html_url, state: pr.merged_at ? 'MERGED' : pr.state === 'open' ? 'OPEN' : 'CLOSED', headRefOid: pr.head.sha, body: pr.body, lastEditedAt: pr.lastEditedAt ?? '2026-11-25T00:00:00Z', editor: pr.editor ?? null, closingIssuesReferences: { nodes: linked(pr) ? [{ number: issueNumber, url: issueUrl }] : [], pageInfo: { hasNextPage: false } } } } } }; }
        if (query.includes('userContentEdits')) {
            const pr = state.prs.find(p => p.number === variables.number);
            return { data: { repository: { nameWithOwner: REPOSITORY, pullRequest: pr ? descriptionNode(pr) : null } } };
        }
        if (query.includes('addProjectV2ItemById')) { const id = `card-${variables.content}`; if (!state.cards.some(c => c.id === id)) state.cards.push({ id, kind: 'Issue', number: issueNumber, status: 'backlog' }); return { data: { addProjectV2ItemById: { item: { id } } } }; }
        if (query.startsWith('mutation')) { state.cards.find(c => c.id === variables.item)!.status = variables.option; return { data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: variables.item } } } }; }
        if (query.includes('fields(first')) return { data: { user: { projectV2: { id: 'project', fields: { nodes: [{ id: 'status', name: 'Status', options: state.lanes }], pageInfo: { hasNextPage: false } } } } } };
        if (query.includes('items(first')) return { data: { node: { items: { nodes: state.cards.map(card => ({ id: card.id, content: { __typename: card.kind, number: card.number, repository: { nameWithOwner: REPOSITORY } } })), pageInfo: { hasNextPage: false } } } } };
        const card = state.cards.find(c => c.id === variables.item)!;
        return { data: { node: { id: card.id, fieldValues: { nodes: [{ field: { id: 'status' }, optionId: card.status }], pageInfo: { hasNextPage: false } } } } };
    }
    let engine = new Engine(store);
    const board = async () => ({ title: 'CMS', url: 'https://github.com/users/JFusco/projects/6', description: '', readme: '', observedAt: '', error: '', lanes: state.lanes.map(l => l.name), items: state.cards.filter(c => c.kind === 'Issue').map(c => ({ id: c.id, number: c.number, title: '', url: issueUrl, repository: REPOSITORY, state: state.issue.state, status: state.lanes.find(l => l.id === c.status)!.name })) });
    engine.github.board = board;
    let delivery = new GitHubDelivery(store, engine, execute as any);
    /** An on-disk store closed and opened again against the same synthetic remote, as after a restart. */
    function reopen() {
        if (storePath === ':memory:') throw new Error('Only an on-disk fixture store can be reopened');
        store.close(); store = new Store(storePath, project, resolve(root, 'data'));
        engine = new Engine(store); engine.github.board = board; delivery = new GitHubDelivery(store, engine, execute as any);
        return { store, engine, delivery };
    }
    const root_ = (job: TicketJob) => { const dir = resolve(store.dataRoot, 'ticket-work', job.id); mkdirSync(dir, { recursive: true }); return dir; };
    /** A reviewed local candidate ready to publish. */
    function candidate(overrides: Partial<TicketJob> = {}): TicketJob {
        delivery.enqueue(`GH-${issueNumber}`, 0, 'Ready', { kind: 'pickup', reference: `fixture:GH-${issueNumber}:Ready` });
        const job = delivery.jobs.at(-1)!;
        const worktree = resolve(root, 'cms-field-vocabulary-worktrees', `${issueNumber}-restore-release-scans`);
        mkdirSync(worktree, { recursive: true });
        writeFileSync(resolve(worktree, 'package.json'), JSON.stringify({ scripts: { 'lint:pr': 'node scripts/validate_pr_body.cjs' } }));
        Object.assign(job, { head: HEAD, branch: `codex/${issueNumber}-restore-release-scans`, worktree, candidateBase: BASE, approach: { plan: 'none', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Synthetic' } }, overrides);
        Object.assign(state.local, { head: job.head, branch: job.branch, dirty: false });
        return job;
    }
    return { root, repo, store, engine, delivery, execute, state, issueUrl, artifactRoot: root_, candidate, reopen };
}
