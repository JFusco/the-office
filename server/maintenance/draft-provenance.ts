import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { artifact, digest, readArtifact, rootArtifact } from '../store/readback-evidence';
import { completedExecution } from '../workers/worker-completion';
import { workerProfile } from '../workers/worker-profiles';
import { scanClaudeToolRecords } from '../workers/claude-tool-inventory';
import { latestProposalGroup, settledDraftStep } from './proposal-group';
import { recordedCreates, recordedViews } from './recorded-gh-command';
import type { Store } from '../store/store';
import type { MaintenanceRun, TicketJob, WorkTime } from '../../src/shared';
import type { DescriptionHistory } from '../delivery/publication/description-history';

/** A maintenance draft worker that created this pull request with its live description. */
export interface MaintenanceDraft { head: string; source: { kind: 'maintenance'; runId: string; step: number; workerId: string }; contentSha256: string }
export type DraftProvenance = { proven: true; draft: MaintenanceDraft } | { proven: false; reason: string };

/** The fields a draft worker's own read-back must hold to identify the pull request it created. */
const READ_BACK = ['number', 'url', 'state', 'isDraft', 'headRefName', 'headRefOid', 'baseRefName', 'title', 'body', 'closingIssuesReferences'];

class Unproven extends Error {}
function need(ok: unknown, reason: string): asserts ok { if (!ok) throw new Unproven(reason); }
/** GitHub reports creation in whole seconds. */
const second = (at: string) => Math.floor(Date.parse(at) / 1000) * 1000;

/** The completed passed draft step, in a run's latest proposal group for this branch, whose window spans the creation. */
function draftStep(store: Store, issue: number, pr: DescriptionHistory) {
    const created = Date.parse(pr.createdAt), found: { run: MaintenanceRun; proposal: number; draft: number }[] = [];
    for (const run of store.state.maintenance?.runs || []) {
        const group = run.status === 'completed' ? latestProposalGroup(run, issue) : undefined;
        if (!group || run.steps[group.proposal].result.candidates[0].branch !== pr.branch) continue;
        for (let draft = group.proposal + 1; draft < group.end; draft++) {
            const step = run.steps[draft];
            if (step.stage === 'draft-pr' && second(run.steps[draft - 1].at) <= created && created <= Date.parse(step.at)) found.push({ run, proposal: group.proposal, draft });
        }
    }
    need(found.length === 1, found.length ? 'more than one maintenance draft step spans the pull request creation' : 'no completed maintenance draft step spans the pull request creation');
    const { run, proposal, draft } = found[0], step = run.steps[draft], built = run.steps[proposal].result.candidates[0];
    need(step.role === 'developer' && settledDraftStep(step), 'the maintenance draft step did not pass with settled receipts');
    need(/^[a-f0-9]{40}$/.test(built.head), 'the maintenance proposal has no full head');
    return { run, draft, step, built, after: run.steps[draft - 1].at };
}

/** The one completed draft worker of that step, bound to its claim, assignment, provider and saved result. */
function draftWorker(store: Store, run: MaintenanceRun, step: MaintenanceRun['steps'][number], after: string, pr: DescriptionHistory): WorkTime {
    const created = Date.parse(pr.createdAt), project = store.project;
    const drafts = (store.state.workLog || []).filter(w => w.requestId === run.id && w.stage === step.stage);
    const spanning = drafts.filter(w => second(w.startedAt) <= created && !!w.endedAt && created <= Date.parse(w.endedAt));
    const inStep = drafts.filter(w => Date.parse(w.startedAt) > Date.parse(after) && !!w.endedAt && Date.parse(w.endedAt) <= Date.parse(step.at));
    need(spanning.length === 1 && inStep.length === 1 && spanning[0] === inStep[0], 'no single draft worker of that step spans the pull request creation');
    const w = spanning[0];
    need(w.role === step.role && w.status === 'completed' && !!w.claimId && !!w.sessionId && completedExecution(store, w), 'the draft worker did not complete');
    const claims = store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(w.claimId) as { body: string }[];
    need(claims.length === 1, 'the draft worker claim is missing');
    const claim = JSON.parse(claims[0].body), dir = resolve(store.dataRoot, 'sessions', w.id);
    need(claim.id === w.claimId && claim.status === 'completed' && claim.lane === w.lane && isDeepStrictEqual(claim.work, { projectId: project.id, kind: 'maintenance', id: run.id }),
        'the draft worker claim is not this maintenance run');
    const json = (name: string) => JSON.parse(readFileSync(artifact(store, resolve(dir, name)).path, 'utf8'));
    const assignment = json('assignment.json'), identity = json('assignment-identity.json'), provider = json('provider.json'), caps = json('capabilities.json'), saved = json('result.json');
    const profile = workerProfile(w.stage, provider.readOnly);
    need(assignment.id === w.id && assignment.claimId === w.claimId && assignment.lane === w.lane && assignment.stage === w.stage && assignment.role === w.role &&
        isDeepStrictEqual(assignment.work, claim.work) && assignment.scope?.repository === project.repository && assignment.scope?.worktree === project.repo &&
        assignment.scope?.artifacts === dir && assignment.profile === profile.name && isDeepStrictEqual(caps, profile) &&
        identity.attemptId === w.id && identity.requestId === run.id && identity.projectId === project.id && identity.repository === project.repository &&
        identity.threadId === w.sessionId && identity.role === w.role && provider.project === project.id && provider.repository === project.repository &&
        provider.provider === w.provider && provider.role === w.role && provider.readOnly === false,
        'the draft worker assignment, identity or provider differs');
    need(saved.session === w.sessionId && saved.provider === w.provider && isDeepStrictEqual(saved.result, step.result), 'the draft worker result is not the saved step');
    return w;
}

/** Paired native Bash calls of a Claude worker, each issued once with its genuine result. Other providers fail closed. */
function nativeBash(store: Store, w: WorkTime, root: string) {
    need(w.provider === 'claude' && w.sessionId === w.id, 'the draft worker provider has no supported native record');
    const path = resolve(root, store.project.repo.replace(/[^a-zA-Z0-9-]/g, '-'), `${w.sessionId}.jsonl`), file = rootArtifact(root, path), bytes = readFileSync(file.path);
    need(createHash('sha256').update(bytes).digest('hex') === file.sha256, 'the native record changed while it was read');
    const lines = bytes.toString('utf8').trim().split('\n');
    need(lines.length <= 10_000, 'the native record exceeds its bound');
    const inventory = scanClaudeToolRecords(lines.map(line => JSON.parse(line)), w.sessionId, cwd => cwd === store.project.repo);
    need(!inventory.missingResults.length && !inventory.orphanResults.length, 'the native record has an unpaired call');
    const calls = [...inventory.calls.values()].map(call => {
        const issued = inventory.issued.get(call.id), results = inventory.genuineResults.get(call.id) || [];
        need(issued?.length === 1 && results.length && results.every(r => r.index > issued[0].index && r.parentUuid === issued[0].uuid &&
            isDeepStrictEqual(r.value, inventory.outputs.get(call.id))), 'a native call lacks one paired original result');
        return { call, index: issued[0].index, value: inventory.outputs.get(call.id) as any };
    });
    return calls.filter(c => c.call.name === 'Bash').map(c => {
        need(!c.call.inputRepresentations?.some(r => r.namespace === 'wire') && typeof (c.call.input as any)?.command === 'string', 'a native Bash call ran a different input');
        return { ...c, command: (c.call.input as any).command as string };
    });
}

const output = (value: any): string => typeof value?.content === 'string' ? value.content :
    Array.isArray(value?.content) ? value.content.filter((part: any) => part?.type === 'text').map((part: any) => part.text).join('\n') : '';
const printed = (value: any, url: string) => output(value).split('\n').some(line => line.trim() === url);

/**
 * Proves that a completed maintenance run's draft worker created this pull request with the live description:
 * the run's latest passed proposal for the issue on this branch gives the head; one completed draft worker
 * of the draft step that follows it, bound to its claim, assignment and saved result, spans the creation time;
 * its one successful native `gh pr create` printed this pull request's URL, from a body file in the run's
 * directory; and its own read-back of the new pull request, the body file and the live description hold the
 * same bytes. Missing or ambiguous evidence declines; a model-written receipt or a later observation never
 * proves creation. The caller separately requires that the description was never edited.
 */
export function maintenanceDraftProvenance(store: Store, job: Pick<TicketJob, 'key' | 'branch'>, pr: DescriptionHistory, root = resolve(homedir(), '.claude', 'projects')): DraftProvenance {
    try {
        const issue = /^GH-\d+$/.test(job.key) ? Number(job.key.slice(3)) : 0, project = store.project;
        need(issue && pr.branch === job.branch && pr.repository === project.repository, 'the pull request is not this job\'s issue branch');
        const { run, draft, step, built, after } = draftStep(store, issue, pr), w = draftWorker(store, run, step, after, pr);
        const dir = resolve(store.dataRoot, 'runs', run.id);
        const inRun = (path: string) => { const rest = relative(dir, path); return isAbsolute(path) && path === resolve(path) && !!rest && !rest.startsWith(`..${sep}`) && rest !== '..' && !isAbsolute(rest); };
        const bash = nativeBash(store, w, root), creating = bash.filter(c => c.command.includes('gh pr create'));
        const parsed = creating.map(c => ({ ...c, creates: recordedCreates(c.command) }));
        need(parsed.every(c => c.creates), 'a recorded pull request create cannot be read');
        const returned = parsed.filter(c => printed(c.value, pr.url));
        need(returned.length === 1 && returned[0].value?.is_error === false && returned[0].creates!.length === 1, 'no single successful create printed this pull request');
        const created = returned[0], create = created.creates![0];
        need(create.repository === project.repository && create.base === project.target && create.head === built.branch && create.draft && inRun(create.bodyFile),
            'the create was not this proposal\'s draft from the run directory');
        const views = bash.filter(c => c.index > created.index && c.command.includes('gh pr view')).flatMap(c => recordedViews(c.command)
            .filter(v => v.number === pr.number && v.repository === project.repository && READ_BACK.every(field => v.fields.includes(field)) && inRun(v.stdout))
            .map(view => ({ ...c, view })));
        need(views.length === 1 && views[0].value?.is_error === false, 'no single read-back of the created pull request');
        const body = readArtifact(store, create.bodyFile).bytes, text = body.toString('utf8');
        need(Buffer.from(text, 'utf8').equals(body), 'the body file is not UTF-8 text');
        const read = JSON.parse(readArtifact(store, views[0].view.stdout).bytes.toString('utf8')), links = read?.closingIssuesReferences;
        const issueUrl = 'https://github.com/' + project.repository + '/issues/' + issue;
        need(read?.number === pr.number && read.url === pr.url && read.state === 'OPEN' && read.isDraft === true && read.headRefName === built.branch &&
            read.headRefOid === built.head && read.baseRefName === project.target && read.title === create.title && read.body === text &&
            Array.isArray(links) && links.length > 0 && links.every((link: any) => link?.number === issue && link.url === issueUrl), 'the worker read-back does not show this draft with the body file');
        need(pr.body === text && pr.title === create.title && pr.base === project.target, 'the live description is not the one the worker created');
        return { proven: true, draft: { head: built.head, source: { kind: 'maintenance', runId: run.id, step: draft, workerId: w.id }, contentSha256: digest({ title: pr.title, body: pr.body }) } };
    } catch (error) {
        if (error instanceof Unproven) return { proven: false, reason: error.message };
        return { proven: false, reason: `the original maintenance evidence is unavailable: ${error instanceof Error ? error.message : String(error)}` };
    }
}
