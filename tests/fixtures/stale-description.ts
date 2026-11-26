import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { metadataFixture } from './pr-metadata';
import { REPOSITORY } from '../unit/delivery/support/fake-github';
import { CommandFailure, workerFailure } from '../../server/workers/process';
import { workerProfile } from '../../server/workers/worker-profiles';
import { workKey, type Finding, type MaintenanceResult, type MaintenanceRun, type StageResult, type WorkTime } from '../../src/shared';

/**
 * CMS GH-193 and GH-195 as their saved records stood on 2026-11-24: maintenance run df64b208 built and published
 * both drafts, a later delivery merged main into each, and the readiness review blocked only on the stale
 * description the run wrote. Facts copied from the saved job, maintenance, work-log and native records; the
 * provider, Git and model are synthetic.
 */
export const RUN = 'df64b208-1627-4ef8-835b-703dce71952b';
const BASE_MAIN = '198aa90781e1f082ab015a92b66f8428a6a58009';

export const INCIDENTS = {
    'GH-193': {
        issue: 193, pr: 194, branch: 'codex/193-document-saas-string-and-nesting-limits', title: 'feat(optimizely): document SaaS field limits',
        published: '8cab9165f1c7c7d400a7fa103e14814b9b0fccd4', head: '074eedf132bfffe9eed338791acdc19355f66b6c', createdAt: '2026-11-23T20:56:27Z',
        bodyFile: 'pr/body.md', readBackFile: 'pr/readback.json', assignees: [] as { login: string }[],
        proposal: { at: '2026-11-23T20:48:01.700Z', worker: '508518b2-adda-4180-aa65-723e88a9d272', startedAt: '2026-11-23T20:26:28.172Z', endedAt: '2026-11-23T20:48:00.256Z' },
        review: { at: '2026-11-23T20:52:24.500Z', worker: '21dc1918-df6d-4d21-a508-80657784c434', startedAt: '2026-11-23T20:48:14.939Z', endedAt: '2026-11-23T20:52:21.745Z' },
        draft: { at: '2026-11-23T20:57:35.217Z', worker: 'e0cdcae2-2882-45b7-b350-4df30e83aa60', claim: 'f9247626-51da-46dd-abbd-334e297dc742', startedAt: '2026-11-23T20:52:37.278Z', endedAt: '2026-11-23T20:57:34.297Z' },
        tools: { body: 'toolu_01YFgw5LYCf7CgUV9QgbaduG', create: 'toolu_01VYbQQthbXkm34Qs18EHtTm', view: 'toolu_013rufVkSsH57wTf1pCdkUHh', result: 'toolu_01KLxhhw12Tc82WzXVnKKDe5' },
        advisory: 'pr-verification-refresh', conflict: 'target-integration-conflict',
    },
    'GH-195': {
        issue: 195, pr: 196, branch: 'codex/195-qualify-cms13-xhtml-editor-media', title: 'feat(optimizely): qualify CMS 13 XHTML editor media',
        published: 'bc8800c4ff93376bc7c7776209ec331e08bc64b7', head: '774257b3df6fbf1280f91a5cacacac9b72d3e22c', createdAt: '2026-11-23T21:34:30Z',
        bodyFile: 'pr/195/body.md', readBackFile: 'pr/195/pr-readback.json', assignees: [{ login: 'JFusco' }],
        proposal: { at: '2026-11-23T21:25:38.551Z', worker: '002c4b4b-b8c2-4320-86f1-ca4206c413c4', startedAt: '2026-11-23T21:02:30.517Z', endedAt: '2026-11-23T21:25:37.225Z' },
        review: { at: '2026-11-23T21:30:18.005Z', worker: 'a296fe79-352d-4d19-b350-8bf80996d67a', startedAt: '2026-11-23T21:26:02.784Z', endedAt: '2026-11-23T21:30:15.665Z' },
        draft: { at: '2026-11-23T21:35:42.021Z', worker: '44361e64-f29a-42c7-8336-53ed150dc7ad', claim: '72966b7a-998a-40fe-aeb9-51fc9d33175a', startedAt: '2026-11-23T21:30:29.811Z', endedAt: '2026-11-23T21:35:40.977Z' },
        tools: { body: 'toolu_011TT4YPJx7RUABQHX1AD4Us', create: 'toolu_017njdAPySnmpYrg16k579Q3', view: 'toolu_014nYRdhHYqfRpjpYDFs4wog', result: 'toolu_01Pu159A6SfH8cdZr1QXmYUU' },
        advisory: 'refresh-pr-description', conflict: 'integrate-current-main',
    },
} as const;
export type IncidentKey = keyof typeof INCIDENTS;

/** The live description each PR still showed: the body the draft worker created, never edited. */
export const liveBody = (key: IncidentKey) => readFileSync(resolve(__dirname, 'stale-description', `pr-${INCIDENTS[key].pr}-body.md`), 'utf8');

const finding = (id: string, status: Finding['status'], summary: string, attempts = 0): Finding => ({ id, status, summary, expected: summary, actual: summary, attempts });
function result(f: { job: { head: string; branch: string; worktree: string; pr: number } }, stage: string, outcome: StageResult['outcome'], commit: string, findings: Finding[] = [], changes: Partial<StageResult> = {}): StageResult {
    return { outcome, commit, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree, summary: `Saved ${stage}`, blocker: outcome === 'passed' ? '' : `Saved ${stage} blocked`,
        evidence: [], findings, receipts: [], paidRuns: 0, previewUrl: '', qaRunDir: '', approach: null, prerequisites: null, resolution: null, ...changes };
}

/** The saved delivery steps, then the final blocked readiness review that left only `pr-metadata` (and GH-195's carried advisory) open. */
function incidentSteps(key: IncidentKey, f: Parameters<typeof result>[0]) {
    const i = INCIDENTS[key], old = i.published, now = i.head;
    const steps = [
        { stage: 'prepare-pr', result: result(f, 'prepare-pr', 'passed', old) },
        { stage: 'prepare-pr', result: result(f, 'prepare-pr', 'passed', old) },
        { stage: 'lead-pr', result: result(f, 'lead-pr', 'blocked', old, [finding(i.conflict, 'open', `PR #${i.pr} conflicts with current main ${BASE_MAIN.slice(0, 7)}.`)],
            { resolution: { kind: 'conflict-repair', findingIds: [i.conflict], evidenceIds: [], release: null } }) },
        { stage: 'update-base', result: result(f, 'update-base', 'passed', now, [finding(i.conflict, 'fixed', `Main ${BASE_MAIN.slice(0, 7)} merged as ${now.slice(0, 7)}.`, 1)]) },
        { stage: 'review', result: result(f, 'review', 'passed', now, [finding(i.conflict, 'verified', 'The integration repair is verified.', 1),
            finding(i.advisory, 'open', 'Advisory: refresh the PR description when publishing the repaired candidate.')]) },
        { stage: 'validate', result: result(f, 'validate', 'passed', now, [finding(i.conflict, 'verified', 'The integration repair is verified.', 1),
            finding(i.advisory, key === 'GH-193' ? 'verified' : 'open', 'The description refresh belongs to publication.')]) },
        { stage: 'draft', result: result(f, 'draft', 'passed', now) },
        { stage: 'prepare-pr', result: result(f, 'prepare-pr', 'passed', now) },
    ];
    const review = result(f, 'lead-pr', 'blocked', now, [finding(i.conflict, 'verified', 'The prior integration conflict is resolved.', 1),
        key === 'GH-193' ? finding(i.advisory, 'verified', 'Tracked as the blocking pr-metadata finding.') : finding(i.advisory, 'open', 'Retained publication advisory remains unresolved.'),
        finding('pr-metadata', 'open', key === 'GH-193' ? 'PR Verification describes the superseded candidate.' : 'The live PR description misrepresents the published candidate.')],
        { blocker: 'Only pr-metadata blocks readiness: refresh the live description for the current head.' });
    return { steps, review };
}

const maintenanceResult = (changes: Partial<MaintenanceResult>): MaintenanceResult => ({ outcome: 'passed', summary: 'Saved maintenance step', ledger: '', receipts: [], candidates: [], blocker: '', ...changes });

/** Run df64b208's steps through both proposals, each grouped with its review and draft, as saved. */
export function maintenanceRun(repo: string): MaintenanceRun {
    const steps: MaintenanceRun['steps'] = [
        { role: 'pm', stage: 'follow-up', at: '2026-11-23T20:09:56.942Z', result: maintenanceResult({}) },
        { role: 'pm', stage: 'vendor-review', at: '2026-11-23T20:23:04.172Z', result: maintenanceResult({ outcome: 'blocked' }) },
    ];
    for (const key of ['GH-193', 'GH-195'] as const) {
        const i = INCIDENTS[key], candidate = { issue: i.issue, worktree: resolve(repo, '..', `cms-field-vocabulary-worktrees`, i.branch.slice(6)), branch: i.branch, head: i.published, summary: `Proposal for #${i.issue}` };
        const pr = `https://github.com/${REPOSITORY}/pull/${i.pr}`;
        steps.push(
            { role: 'developer', stage: 'proposal-plan', at: key === 'GH-193' ? '2026-11-23T20:26:26.392Z' : '2026-11-23T21:02:03.507Z', result: maintenanceResult({ candidates: [{ ...candidate, issue: 0, branch: '', head: '' }] }) },
            { role: 'developer', stage: 'proposal', at: i.proposal.at, result: maintenanceResult({ candidates: [candidate],
                receipts: [{ id: `commit-${i.issue}`, action: 'git commit (local only)', target: i.published, verified: true, uncertain: false, detail: '' }] }) },
            { role: 'lead', stage: 'proposal-review', at: i.review.at, result: maintenanceResult({ candidates: [{ ...candidate }] }) },
            { role: 'developer', stage: 'draft-pr', at: i.draft.at, result: maintenanceResult({ candidates: [{ ...candidate }], receipts: [
                { id: `push-${i.issue}`, action: 'git push -u origin', target: `refs/heads/${i.branch}`, verified: true, uncertain: false, detail: '' },
                { id: `pr-${i.pr}`, action: 'gh pr create --draft', target: pr, verified: true, uncertain: false, detail: '' }] }) });
    }
    return { id: RUN, requestedAt: '2026-11-23T20:00:00.000Z', startedAt: '2026-11-23T20:00:39.708Z', endedAt: '2026-11-23T23:01:33.718Z', status: 'completed', weekly: true, stage: 'complete', error: '', steps };
}

let uuid = 0;
const id = () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, '0')}`;

/** One Claude Bash call and its genuine result, as the native session records them. */
function bash(sessionId: string, cwd: string, parent: string, tool: string, command: string, output: string, failed = false) {
    const asked = id(), answered = id();
    return { last: answered, records: [
        { type: 'assistant', sessionId, cwd, uuid: asked, parentUuid: parent, message: { id: `msg_${asked}`, role: 'assistant', content: [{ type: 'tool_use', id: tool, name: 'Bash', input: { command } }] } },
        { type: 'user', sessionId, cwd, uuid: answered, parentUuid: asked, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: tool, content: output, is_error: failed }] } },
    ] };
}

/** The draft worker's native session: it writes the body file, creates the draft, reads it back into a file, then returns. */
export function draftSession(key: IncidentKey, repo: string, runDir: string, saved: MaintenanceResult, change: { createOutput?: string; createFailed?: boolean; bodyFile?: string; skipView?: boolean } = {}) {
    const i = INCIDENTS[key], session = i.draft.worker, url = `https://github.com/${REPOSITORY}/pull/${i.pr}`, body = change.bodyFile ?? resolve(runDir, i.bodyFile);
    const worktree = resolve(repo, '..', 'cms-field-vocabulary-worktrees', i.branch.slice(6));
    const writeBody = `mkdir -p ${resolve(runDir, i.bodyFile, '..')}; B=${body}; cat > $B <<'EOF'\n${liveBody(key)}EOF`;
    const create = key === 'GH-193'
        ? `R=${runDir}; gh pr create -R ${REPOSITORY} --draft --base main --head ${i.branch} --title "${i.title}" --body-file ${change.bodyFile ?? `$R/${i.bodyFile}`} 2>&1`
        : `cd ${worktree}; [ "$(gh pr list -R ${REPOSITORY} --state all --head ${i.branch} --json number -q length)" = 0 ] && gh pr create -R ${REPOSITORY} --draft --base main --head ${i.branch} --title "${i.title}" --body-file ${body}`;
    const view = key === 'GH-193'
        ? `R=${runDir}; gh pr view ${i.pr} -R ${REPOSITORY} --json number,url,state,isDraft,headRefName,headRefOid,baseRefName,title,author,closingIssuesReferences,body > $R/${i.readBackFile}; python3 -c "\nimport json;d=json.load(open('$R/${i.readBackFile}'));b=open('$R/${i.bodyFile}').read()\nprint('body match',d['body'].strip()==b.strip())"; gh pr list -R ${REPOSITORY} --state all --head ${i.branch} --json number`
        : `R=${resolve(runDir, 'pr', '195')}; gh pr view ${i.pr} -R ${REPOSITORY} --json number,state,isDraft,headRefName,headRefOid,baseRefName,title,author,body,closingIssuesReferences,url > $R/pr-readback.json; python3 -I -c "\nimport json;d=json.load(open('$R/pr-readback.json'));b=open('$R/body.md').read()\nprint('body match', d['body'].strip()==b.strip())"; jq -r .body $R/pr-readback.json | (cd ${worktree} && node scripts/validate_pr_body.cjs)`;
    const start = id(), records: any[] = [{ type: 'user', sessionId: session, cwd: repo, uuid: start, parentUuid: null, message: { role: 'user', content: 'CMS maintenance · draft-pr' } }];
    let parent = start;
    const calls: [string, string, string, boolean][] = [[i.tools.body, writeBody, '', false],
        [i.tools.create, create, change.createOutput ?? (key === 'GH-193' ? url : `${url}\nShell cwd was reset to ${repo}`), !!change.createFailed],
        ...(change.skipView ? [] : [[i.tools.view, view, `${i.pr} OPEN True ${i.branch} ${i.published} main ${i.title} JFusco [${i.issue}]\nbody match True`, false] as [string, string, string, boolean]])];
    for (const [tool, command, output, failed] of calls) {
        const call = bash(session, repo, parent, tool, command, output, failed); records.push(...call.records); parent = call.last;
    }
    const done = id();
    records.push({ type: 'assistant', sessionId: session, cwd: repo, uuid: done, parentUuid: parent, message: { id: `msg_${done}`, role: 'assistant', content: [{ type: 'tool_use', id: i.tools.result, name: 'StructuredOutput', input: saved }] } },
        { type: 'user', sessionId: session, cwd: repo, uuid: id(), parentUuid: done, message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: i.tools.result, content: 'Structured output provided successfully', is_error: false }] } });
    return records;
}

export interface StaleFixtureOptions {
    ancestry?: 'ancestor' | 'not-ancestor' | 'missing'; refreshed?: string;
    /** GH-193's saved draft step reported no candidates; the head still comes from its proposal. */
    emptyDraftCandidates?: boolean;
}

/**
 * A fake-provider delivery job in the incident's shape: the adopted PR at its merged head with the run's untouched
 * description, the completed maintenance run, its draft workers' claims, session artifacts and native records under
 * a synthetic home, the body and read-back files, and a Git ancestry answer.
 */
export function staleFixture(key: IncidentKey, options: StaleFixtureOptions = {}) {
    const i = INCIDENTS[key], body = liveBody(key);
    const f = metadataFixture(false, { issue: i.issue, pr: i.pr, head: i.head, branch: i.branch, title: i.title, body,
        refreshed: options.refreshed ?? body.replace(i.published, i.head).replace(i.published.slice(0, 7), i.head.slice(0, 7)) + `\nRefreshed for ${i.head.slice(0, 7)}.\n` });
    delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed');
    const { store, job } = f, project = store.project, home = resolve(f.root, 'home');
    const native = resolve(home, '.claude', 'projects', project.repo.replace(/[^a-zA-Z0-9-]/g, '-'));
    // The adopted repair checkout the delivery owns.
    job.worktree = resolve(store.dataRoot, 'ticket-work', job.id, 'ci-review-fixture', 'candidate');
    mkdirSync(resolve(job.worktree, 'node_modules'), { recursive: true });
    writeFileSync(resolve(job.worktree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@11.1.1', scripts: { 'lint:pr': 'node scripts/validate_pr_body.cjs' } }));
    Object.assign(job, { stage: 'lead-pr', status: 'working', existingPR: true,
        admission: { kind: 'linked-pr', reference: job.prUrl, projectId: project.id, jobId: job.id, key: job.key, at: '2026-11-23T21:35:14.913Z' },
        repairCycle: { owner: 'developer', findingAttempts: { [i.conflict]: 1 }, attempts: 1, pendingFindingIds: [], sourceStage: 'lead-pr', sourceHead: i.published, phase: 'verify', publishedHead: i.head },
        draftPromotionHead: i.published });
    const delivered = incidentSteps(key, f);
    job.steps = delivered.steps;
    Object.assign(f.pr, { created_at: i.createdAt });
    f.state.issue.assignees = [...i.assignees];
    // The maintenance run, its workers and the draft workers' original evidence.
    const run = maintenanceRun(project.repo), runDir = resolve(store.dataRoot, 'runs', RUN);
    if (options.emptyDraftCandidates) for (const step of run.steps.filter(s => s.stage === 'draft-pr')) step.result.candidates = [];
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    const session = (k: IncidentKey, change: Parameters<typeof draftSession>[4] = {}) => {
        const saved = run.steps.filter(s => s.stage === 'draft-pr')[k === 'GH-193' ? 0 : 1].result;
        mkdirSync(native, { recursive: true });
        writeFileSync(resolve(native, `${INCIDENTS[k].draft.worker}.jsonl`), draftSession(k, project.repo, runDir, saved, change).map(r => JSON.stringify(r)).join('\n') + '\n');
    };
    const workers: WorkTime[] = [];
    for (const k of ['GH-193', 'GH-195'] as const) {
        const n = INCIDENTS[k], draftIndex = run.steps.filter(s => s.stage === 'draft-pr').map(s => run.steps.indexOf(s))[k === 'GH-193' ? 0 : 1];
        for (const [stage, role, w, provider] of [['proposal', 'developer', n.proposal, 'claude'], ['proposal-review', 'lead', n.review, 'codex'], ['draft-pr', 'developer', n.draft, 'claude']] as const) {
            const worker = 'worker' in w ? w.worker : '', claimId = 'claim' in w ? w.claim : id();
            workers.push({ id: worker, role, task: 'CMS field vocabulary maintenance', ticket: '', stage, requestId: RUN, sessionId: provider === 'claude' ? worker : id(), provider,
                lane: 'delivery', claimId, model: 'fixture', effort: 'fixture', status: 'completed', executionStatus: 'completed', startedAt: w.startedAt, lastHeartbeatAt: w.endedAt,
                endedAt: w.endedAt, elapsedMs: 1, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: w.endedAt, processId: 2147483646 });
        }
        const draft = workers.at(-1)!, saved = run.steps[draftIndex].result, dir = resolve(store.dataRoot, 'sessions', draft.id);
        const claim = { id: draft.claimId!, work: { projectId: project.id, kind: 'maintenance', id: RUN }, owner: 'maintenance', stage: 'draft-pr', lane: 'delivery', status: 'completed', claimedAt: n.draft.startedAt, endedAt: n.draft.endedAt };
        store.db.prepare('INSERT INTO work_claims VALUES(?,?,?,?)').run(claim.id, workKey(claim.work as any), claim.status, JSON.stringify(claim));
        mkdirSync(dir, { recursive: true });
        const profile = workerProfile('draft-pr', false), raw = JSON.stringify({ session: draft.id, provider: 'claude', model: 'fixture', result: saved }, null, 2);
        writeFileSync(resolve(dir, 'assignment.json'), JSON.stringify({ id: draft.id, work: claim.work, claimId: claim.id, lane: 'delivery', stage: 'draft-pr', role: 'developer',
            scope: { repository: project.repository, worktree: project.repo, artifacts: dir }, profile: profile.name }));
        writeFileSync(resolve(dir, 'assignment-identity.json'), JSON.stringify({ attemptId: draft.id, requestId: RUN, projectId: project.id, repository: project.repository, role: 'developer', threadId: draft.id }));
        writeFileSync(resolve(dir, 'provider.json'), JSON.stringify({ project: project.id, repository: project.repository, provider: 'claude', model: 'fixture', effort: 'fixture', session: draft.id, role: 'developer', readOnly: false }));
        writeFileSync(resolve(dir, 'capabilities.json'), JSON.stringify(profile));
        writeFileSync(resolve(dir, 'result.json'), raw);
        writeFileSync(resolve(dir, 'execution-completion.json'), JSON.stringify({ workerId: draft.id, session: draft.id, provider: 'claude', resultSha256: createHash('sha256').update(raw).digest('hex') }));
        session(k);
        const text = liveBody(k), url = `https://github.com/${REPOSITORY}/pull/${n.pr}`;
        mkdirSync(resolve(runDir, n.bodyFile, '..'), { recursive: true });
        writeFileSync(resolve(runDir, n.bodyFile), text);
        writeFileSync(resolve(runDir, n.readBackFile), JSON.stringify({ number: n.pr, url, state: 'OPEN', isDraft: true, headRefName: n.branch, headRefOid: n.published,
            baseRefName: 'main', title: n.title, author: { login: 'JFusco' }, closingIssuesReferences: [{ id: `I_${n.issue}`, number: n.issue, repository: { name: 'cms-field-vocabulary', owner: { login: 'JFusco' } }, url: `https://github.com/${REPOSITORY}/issues/${n.issue}` }], body: text }));
    }
    (store.state.workLog ??= []).push(...workers);
    // Git answers ancestry the way the runner reports it.
    const ancestry = { calls: [] as string[][], mode: options.ancestry ?? 'ancestor' };
    const execute = f.delivery.execute;
    f.delivery.execute = (async (program, args, opts) => {
        if (program === 'git' && args[0] === 'merge-base' && args[1] === '--is-ancestor') {
            ancestry.calls.push(args);
            if (ancestry.mode === 'not-ancestor') throw new CommandFailure(workerFailure('git', 1, '', ''), 'other', true);
            if (ancestry.mode === 'missing') throw new CommandFailure(workerFailure('git', 128, '', `fatal: Not a valid commit name ${args[2]}`), 'other', true);
            return '';
        }
        return execute(program, args, opts);
    }) as typeof execute;
    const leadClaim = () => store.claimWork({ projectId: project.id, kind: 'delivery', id: job.id }, 'stale-lead', 'lead-pr')!;
    return { ...f, incident: i, runDir, maintenance: run, review: delivered.review, ancestry, leadClaim, home, nativeRoot: resolve(home, '.claude', 'projects'), session,
        draftWorker: (k: IncidentKey = key) => workers.find(w => w.id === INCIDENTS[k].draft.worker)! };
}
