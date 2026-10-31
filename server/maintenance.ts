import {prepareMaintenanceReadback,maintenanceCoverageSchema,maintenanceCoveragePassed,MAINTENANCE_NATIVE_GUIDANCE} from './maintenance-readback';
import { z } from 'zod';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { command } from './process';
import { ApproachSchema, APPROACH_GUIDANCE, reviewInstructions } from './approach';
import { containedFile } from './workflow';
import type { Store } from './store';
import type { Agents } from './agents';
import type { MaintenanceRun, MaintenanceResult, Role, WorkApproach } from '../src/shared';
import { maintenancePolicies, GITHUB_ISSUE_SKILL } from './github-context';
export const MaintenanceSchema = z.object({ outcome: z.enum(['passed', 'blocked', 'reroute']), approach: ApproachSchema.nullable(), checks: z.array(z.object({ path: z.string(), commit: z.string(), summary: z.string(), kind: z.enum(['checks', 'browser', 'screenshot']), url: z.string() }).strict()), summary: z.string(), ledger: z.string(), blocker: z.string(), receipts: z.array(z.object({ id: z.string(), action: z.string(), target: z.string(), verified: z.boolean(), uncertain: z.boolean(), detail: z.string() }).strict()), candidates: z.array(z.object({ issue: z.number().int().min(0), worktree: z.string(), branch: z.string(), head: z.string(), summary: z.string(), approach: ApproachSchema.nullable() }).strict()) }).strict();
export function easternDate(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
export function weeklyDue(lastWeekly: string, date = new Date()) {
    // Missed Mondays coalesce into the first later wake; a daily poll cannot
    // claim the weekly review before Monday's existing 3 PM review time.
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: '2-digit', hourCycle: 'h23' }).formatToParts(date);
    const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.find(p => p.type === 'weekday')!.value);
    const today = easternDate(date), utc = new Date(`${today}T12:00:00Z`);
    utc.setUTCDate(utc.getUTCDate() - day);
    if (day === 0 && Number(parts.find(p => p.type === 'hour')!.value) < 15)
        utc.setUTCDate(utc.getUTCDate() - 7);
    return !lastWeekly || lastWeekly < utc.toISOString().slice(0, 10);
}
class StageYield extends Error {
}
export class GitHubMaintenance {
    constructor(public store: Store, public agents: Agents, private execute: typeof command = command) { }
    async verifyCandidate(candidate: MaintenanceResult['candidates'][number]) {
        const root = realpathSync((await this.execute('git', ['rev-parse', '--show-toplevel'], { cwd: candidate.worktree })).trim());
        const primary = realpathSync((await this.execute('git', ['rev-parse', '--show-toplevel'], { cwd: this.store.project.repo })).trim());
        if (root === primary)
            throw new Error('A proposal must use an isolated owned worktree');
        candidate.worktree = root;
        for (const [args, expected] of [[['rev-parse', 'HEAD'], candidate.head], [['branch', '--show-current'], candidate.branch], [['status', '--porcelain=v1', '--untracked-files=all'], '']] as [
            string[],
            string
        ][]) {
            const actual = (await this.execute('git', args, { cwd: candidate.worktree })).trim();
            if (actual !== expected)
                throw new Error('Proposal worktree, head or clean state changed; obtain fresh review before publication');
        }
        const origin = (await this.execute('git', ['remote', 'get-url', 'origin'], { cwd: candidate.worktree })).trim().replace(/\.git$/, '');
        if (![`https://github.com/${this.store.project.repository}`, `git@github.com:${this.store.project.repository}`].includes(origin))
            throw new Error('Proposal origin does not match the CMS project');
        const issue = JSON.parse(await this.execute('gh', ['issue', 'view', String(candidate.issue), '--repo', this.store.project.repository, '--json', 'number,state,url'], { cwd: this.store.project.repo }));
        if (issue.number !== candidate.issue || issue.state !== 'OPEN' || issue.url !== `https://github.com/${this.store.project.repository}/issues/${candidate.issue}`)
            throw new Error('Proposal issue identity or state changed');
    }
    async verifyDraft(candidate: MaintenanceResult['candidates'][number]) {
        const prs = JSON.parse(await command('gh', ['pr', 'list', '--repo', this.store.project.repository, '--head', candidate.branch, '--state', 'open', '--json', 'url,headRefOid,isDraft,closingIssuesReferences', '--limit', '100'], { cwd: this.store.project.repo }));
        if (prs.length !== 1 || !prs[0].isDraft || prs[0].headRefOid !== candidate.head || !prs[0].closingIssuesReferences.some((i: any) => i.number === candidate.issue))
            throw new Error('Draft PR identity, exact reviewed head or linked closing issue could not be independently verified');
    }
    async reconcile(id: string) {
        const run = this.store.state.maintenance?.runs.find(r => r.id === id);
        if (!run || !['blocked', 'interrupted'].includes(run.status))
            throw new Error('No interrupted maintenance run matches this request');
        const original = prepareMaintenanceReadback(this.store, run);
        original.assertClaimed();
        const schema = MaintenanceSchema.extend({ coverage: maintenanceCoverageSchema(original.packet) }).strict();
        const result = await this.agents.run('pm', `Read back ${this.store.project.name} maintenance ${id}. READ ONLY. Never repeat a write or stage. ${MAINTENANCE_NATIVE_GUIDANCE}
Original input: ${JSON.stringify(original.packet)}
Original run: ${JSON.stringify(run)}
Return a compact completed/STILL UNFINISHED ledger and candidates=[].`, schema, { readOnly: true, stage: 'maintenance-readback', requestId: run.id });
        original.assertClaimed();
        run.steps.push({ role: 'pm', stage: 'maintenance-readback', result, at: new Date().toISOString() });
        if (result.outcome === 'passed' && maintenanceCoveragePassed(original.packet, result.coverage) && !result.receipts.some(r => !r.verified || r.uncertain)) {
            run.status = 'reconciled';
            run.error = '';
            if (result.ledger)
                this.store.state.maintenance!.ledger = result.ledger;
            this.store.emit('maintenance-reconciled', 'Original effects read back. Unfinished maintenance remains in the ledger; a new deliberate run can continue from current evidence.', 'pm');
        }
        else {
            run.error = result.blocker || 'Original effects remain uncertain';
            this.store.emit('maintenance-blocked', run.error, 'pm');
        }
        this.store.save();
        return run;
    }
    request(scheduled = false, now = new Date()) {
        if (this.store.state.paused)
            throw new Error('This project is paused');
        const state = this.store.state.maintenance ??= { runs: [], lastDaily: '', lastWeekly: '', ledger: '' };
        const existing = state.runs.find(r => r.status === 'queued' || r.status === 'working');
        if (existing)
            return existing;
        if (state.runs.some(r => r.status === 'interrupted' || r.status === 'blocked'))
            throw new Error('Prior CMS maintenance needs read-back reconciliation in the outbox; it will not be replayed.');
        if (scheduled && state.lastDaily === easternDate(now) && !weeklyDue(state.lastWeekly, now))
            return state.runs.at(-1)!;
        maintenancePolicies(this.store);
        const run: MaintenanceRun = { id: crypto.randomUUID(), requestedAt: now.toISOString(), startedAt: '', endedAt: '', status: 'queued', weekly: weeklyDue(state.lastWeekly, now), stage: 'follow-up', error: '', steps: [] };
        state.runs.push(run);
        this.store.emit('maintenance-queued', `CMS maintenance queued${run.weekly ? ' with the weekly vendor review' : ''}.`, 'pm');
        return run;
    }
    async pump(selectedId?: string) {
        const state = this.store.state.maintenance, run = state?.runs.find(r => r.status === 'queued' && (!selectedId || r.id === selectedId));
        if (!state || !run || this.store.state.paused || this.agents.active.size)
            return;
        run.status = 'working';
        run.startedAt ||= new Date().toISOString();
        this.store.save();
        const root = resolve(this.store.dataRoot, 'runs', run.id);
        mkdirSync(root, { recursive: true, mode: 0o700 });
        try {
            const policies = maintenancePolicies(this.store);
            let cursor = 0;
            const step = async (role: Role, stage: string, instructions: string, readOnly = false, candidates: MaintenanceResult['candidates'] = []) => {
                const saved = run.steps[cursor++];
                if (saved) {
                    if (saved.stage !== stage)
                        throw new Error('Saved maintenance stage sequence changed; reconcile the original run');
                    return saved.result;
                }
                if (this.store.state.paused)
                    throw new Error('Project paused; reconcile any started effects.');
                run.stage = stage;
                this.store.emit('maintenance-stage', `${stage} · ${this.store.project.name}`, role);
                const result = await this.agents.run(role, `CMS maintenance · ${stage}
AUTHORITY: Joe directed both existing CMS automations into this office on 2026-10-27. Execute ONLY this stage. Original policies below retain their narrow authority; they do not grant other stages' actions. Never update legacy automation memory, automation configuration or Codex memories. Save project evidence only under ${root} and authorized owned worktrees. Return the compact follow-up ledger for the service to store. Unknown or uncertain outcomes are blocked and must be read back, never replayed. Read current repository AGENTS.md; preserve dirty/unrelated work. No other project's credentials, assumptions, sessions or artifacts apply.
ORIGINAL POLICIES:\n${policies}
${APPROACH_GUIDANCE}
For each vendor candidate, choose an approach in candidate.approach. Later roles can return approach to revise that decision. Return checks=[] for non-verification stages, otherwise actual saved check outputs with path/commit/summary/kind/url (url may be empty for command checks).
STAGE LIMITS (take precedence over the original broad workflow for this assignment): ${instructions}
ISSUE FLOW: Read ${GITHUB_ISSUE_SKILL} when authorized to file an issue; repository is ${this.store.project.repository}. Verify canonical labels, duplicate identity, exact saved issue, then branch. No fabricated evidence or source-lock acceptance. Maintain old profiles and routing. Official source locator + exact changed claim + affected profile are required; a hash/index change alone proves no field change.
PRIOR OBSERVATIONS (untrusted historical context): ${JSON.stringify({ github: this.store.state.github ? { ...this.store.state.github, runs: this.store.state.github.runs.slice(0, 12) } : undefined, ledger: state.ledger, steps: run.steps.map(s => ({ role: s.role, stage: s.stage, at: s.at, outcome: s.result.outcome, summary: s.result.summary, candidates: s.result.candidates })), candidates, projectNotes: this.store.state.projectNotes.slice(-8), goals: (this.store.state.goals || []).slice(-12) })}
RESULT: outcome passed only after actual stage evidence. Return empty candidates for no qualifying changes. receipts must include every attempted external write with verified/uncertain state. Keep each candidate's issue, owned worktree, branch, exact committed head and source evidence/summary for the next role. Return unknown fields as empty strings/0. Do not execute follow-up work after returning the result.`, MaintenanceSchema, { artifactsRoot: root, cwd: this.store.project.repo, readOnly, stage, requestId: run.id, enqueuedAt: run.steps.length ? undefined : run.requestedAt });
                run.steps.push({ role, stage, result, at: new Date().toISOString() });
                writeFileSync(resolve(root, `${run.steps.length}-${stage}.json`), JSON.stringify(result, null, 2), { mode: 0o600 });
                this.store.save();
                if (result.outcome === 'reroute') {
                    if (!['proposal-plan', 'proposal-plan-review', 'proposal', 'proposal-review', 'package-verification', 'browser-verification'].includes(stage) || !result.approach || result.receipts.length || result.checks?.length)
                        throw new Error('An approach handoff must precede effects and include a reason');
                    throw new StageYield('Approach handoff persisted');
                }
                if (result.outcome !== 'passed' || result.receipts.some(r => r.uncertain || !r.verified))
                    throw new Error(result.blocker || `Unverified ${stage}; inspect original worker session before another write.`);
                if (result.ledger)
                    state.ledger = result.ledger;
                throw new StageYield('Stage persisted; waiting for the next scheduler claim');
            };
            await step('pm', 'follow-up', `Read all open PRs/issues and previously watched closed/merged items. Compare exact heads, reviews/checks and issues with the retained ledger. Apply ONLY the existing Dependabot merge rule after verifying bot identity, dependency-only exact diff, current head and mergeability; use matching-head merge and conventional subject. Non-Dependabot PRs remain read-only. Verify post-merge Quality/Release, tag, GitHub release, npm version/provenance as applicable, without retrying side effects. Retain missing verification as blockers in the ledger, not invented acceptance. Never edit source code or non-Dependabot PRs. No pipeline reruns/dispatches, manual version/tag/publish or issue closure. Return candidates=[].
GITHUB PROJECT COORDINATION (Joe authorized 2026-10-28): Use ONLY ${this.store.project.githubProject?.url} and issues in ${this.store.project.repository}. Read current board Status options/cards, relevant issue bodies/comments, actual work evidence and current PR heads/checks. Update existing cards when evidence supports Backlog (unassessed/future/deferred or waiting on prerequisites), Ready (actionable unblocked scope), In progress (work actually started), In review (actual proposal awaiting applicable review/checks), or Done (verified acceptance after maintainer merge or documented completed no-impact disposition). Use actual lane names; report a blocker rather than inventing a lane. Preserve human holds and version prerequisites; SDK prereleases never prove a stable contract. A queued run, hash change, passing local check or open PR alone cannot establish completion. For each substantive change leave one focused issue comment with evidence, blocker if any and next step; read existing comments first to avoid repetition and read back both saved lane and comment. Record every attempted board/comment write in receipts; uncertain effects block and must not be replayed. This stage alone permits these board updates/comments; non-Dependabot PRs remain read-only, and no issue closure, source edits, profile/lock acceptance, merge or release is authorized by a board move. Report unchanged cards without heartbeat comments.`);
            if (run.weekly) {
                const triage = await step('pm', 'vendor-review', 'READ ONLY. Review the latest completed weekly full Vendor documentation freshness Actions run and accumulated daily observations since the last completed review. Inspect uploaded index/full JSON, summary and logs (stream/download in memory when filesystem is read-only). Compare source IDs/fingerprints to source lock and prior dispositions; verify exact official locators and affected profiles. Return one candidate summary per EVIDENCED surface needing a proposal, including source IDs, fingerprints, exact claims and verification requirements. issue may be 0 before creation, worktree/branch/head empty. No issue/PR/source writes, merge or acceptance. No new evidence is a valid unchanged outcome. Missing scan evidence is blocked.', true);
                for (const candidate of triage.candidates) {
                    let approach: WorkApproach = candidate.approach || { plan: 'none', review: 'focused', validation: 'independent-checks', checks: ['Repository-required package checks'], reason: 'Retained CMS workflow until the team supplies an explicit new decision.' };
                    const decide = (next: WorkApproach, role: Role, stage: string) => {
                        approach = ApproachSchema.parse(next);
                        run.decisions ??= [];
                        if (!run.decisions.some(d => d.stage === stage && d.role === role && JSON.stringify(d.approach) === JSON.stringify(approach)))
                            run.decisions.push({ role, stage, at: new Date().toISOString(), approach });
                        this.store.emit('approach-selected', `${role}: ${approach.reason}`, role);
                    };
                    decide(approach, 'pm', 'vendor-review');
                    let planDone = false, planReviewDone = false, changes = 0, built: MaintenanceResult;
                    const revise = (result: MaintenanceResult, role: Role, stage: string) => {
                        if (++changes > 3)
                            throw new Error('Team approach remains unsettled after three changes');
                        decide(result.approach!, role, stage);
                    };
                    while (true) {
                        if (approach.plan !== 'none' && !planDone) {
                            const plan = await step('developer', 'proposal-plan', `Write only the selected ${approach.plan} plan for this surface, naming exact files/functions, focused checks, evidence and unresolved questions. Save it in the stage summary/artifact root. No issue, branch, source or remote changes. If inspection changes the approach, use reroute before implementation. Selected approach: ${JSON.stringify(approach)}. Surface: ${JSON.stringify(candidate)}`, true, [candidate]);
                            if (plan.outcome === 'reroute') {
                                revise(plan, 'developer', 'proposal-plan');
                                continue;
                            }
                            planDone = true;
                        }
                        if (approach.plan === 'reviewed' && !planReviewDone) {
                            const review = await step('lead', 'proposal-plan-review', 'Independently review the saved plan for this surface. No code or remote changes. Return blocked with concrete unresolved concerns, passed when ready, or reroute with reason if a different approach is appropriate before implementation.', true, [candidate]);
                            if (review.outcome === 'reroute') {
                                revise(review, 'lead', 'proposal-plan-review');
                                continue;
                            }
                            planReviewDone = true;
                        }
                        built = await step('developer', 'proposal', `Implement ONLY this evidenced surface as ONE focused proposal. Use the selected approach; no separate plan/review is required unless selected. Inspect source first and use reroute BEFORE any issue creation, branch or code changes if a different route is needed. Read repository instructions and skill, create/reuse one verified issue first, then create/reuse an owned isolated worktree from freshly fetched origin/main. Preserve the primary checkout. Follow canonical issue/branch/wiki requirements and required release:preflight, verify:ci, test:packed and npm pack --dry-run --ignore-scripts checks. Save actual check outputs under the artifact root and return checks tied to the committed head. Lock observations remain proposals. No pushes, PR creation, merge/acceptance/publish yet. Return exactly one candidate with issue and full head. Selected approach: ${JSON.stringify(approach)}. Surface: ${JSON.stringify(candidate)}`, false, [candidate]);
                        if (built.outcome === 'reroute') {
                            revise(built, 'developer', 'proposal');
                            continue;
                        }
                        if (built.approach) {
                            if ((built.approach.plan !== 'none' && !planDone) || (built.approach.plan === 'reviewed' && !planReviewDone))
                                throw new Error('Planning requirements changed after implementation; reconcile before continuing');
                            decide(built.approach, 'developer', 'proposal');
                        }
                        break;
                    }
                    if (built.candidates.length !== 1)
                        throw new Error('Proposal did not return exactly one verified candidate');
                    const proposal = built.candidates[0];
                    if (!proposal.issue || !proposal.worktree || !proposal.branch || !/^[a-f0-9]{40}$/.test(proposal.head))
                        throw new Error('Proposal is missing its issue, owned worktree, branch or immutable head');
                    if (!built.checks?.some(c => (!c.kind || c.kind === 'checks') && c.commit === proposal.head && containedFile(c.path, root)))
                        throw new Error('Actual saved implementation check evidence for this head is missing');
                    await this.verifyCandidate(proposal);
                    let reviewDone = false, qaDone: WorkApproach['validation'] | null = null;
                    while (true) {
                        proposal.approach = approach;
                        if (approach.plan !== 'none' && !planDone) {
                            const plan = await step('developer', 'proposal-plan', 'Document the newly selected plan against the already committed candidate. No source/remote changes and no repeat implementation. Save exact scope, unresolved questions and selected checks.', true, [proposal]);
                            if (plan.outcome === 'reroute') {
                                revise(plan, 'developer', 'proposal-plan');
                                continue;
                            }
                            planDone = true;
                        }
                        if (approach.plan === 'reviewed' && !planReviewDone) {
                            const review = await step('lead', 'proposal-plan-review', 'Review the newly requested plan against the existing immutable candidate. No source edits, writer replays or remote writes. Block on concrete unresolved concerns; reroute only for an approach correction before effects.', true, [proposal]);
                            if (review.outcome === 'reroute') {
                                revise(review, 'lead', 'proposal-plan-review');
                                continue;
                            }
                            planReviewDone = true;
                        }
                        if (approach.review !== 'none' && !reviewDone) {
                            const review = await step('lead', 'proposal-review', `${reviewInstructions(approach.review)} READ ONLY independent review of the exact candidate head/diff, official evidence and applicability, older profiles/routing, proposed lock state and checks. Do not edit or accept source-lock changes. Block with concrete findings when necessary. If this review is unnecessary or a different verification approach is needed, return reroute before effects with the reason.`, true, [proposal]);
                            if (review.outcome === 'reroute') {
                                revise(review, 'lead', 'proposal-review');
                                continue;
                            }
                            reviewDone = true;
                            if (review.approach)
                                decide(review.approach, 'lead', 'proposal-review');
                            await this.verifyCandidate(proposal);
                        }
                        if (approach.validation !== 'developer-checks' && qaDone !== approach.validation) {
                            const qa = await step('qa', approach.validation === 'browser' ? 'browser-verification' : 'package-verification', `Independently verify the exact candidate worktree/head using the selected checks: ${JSON.stringify(approach)}. Use package/CLI/API checks for check-based validation, without launching a browser. If browser validation was selected, use actual candidate browser evidence and save browser plus screenshot artifacts with commit and URL; do not invent a deployed application. Return actual saved check outputs with kind/path/commit/summary/url. Missing access or failing checks are blocked, not a reason to silently downgrade. No source edits, remote writes, releases or paid provider actions. Return reroute only for a reasoned scope correction BEFORE executing verification.`, false, [proposal]);
                            if (qa.outcome === 'reroute') {
                                revise(qa, 'qa', 'verification');
                                continue;
                            }
                            if (!qa.checks?.some(c => (!c.kind || c.kind === 'checks') && c.commit === proposal.head && containedFile(c.path, root)))
                                throw new Error('Independent verification is missing actual saved checks for this head');
                            const verifiedApproach = qa.approach || approach;
                            if (verifiedApproach.validation === 'browser' && !['browser', 'screenshot'].every(kind => qa.checks?.some(c => c.kind === kind && c.commit === proposal.head && containedFile(c.path, root) && !!c.url)))
                                throw new Error('Selected browser verification needs real current-head browser and screenshot evidence');
                            if (qa.approach)
                                decide(qa.approach, 'qa', 'verification');
                            qaDone = approach.validation;
                            await this.verifyCandidate(proposal);
                        }
                        if (approach.plan !== 'none' && !planDone || approach.plan === 'reviewed' && !planReviewDone || approach.review !== 'none' && !reviewDone || approach.validation !== 'developer-checks' && qaDone !== approach.validation)
                            continue;
                        break;
                    }
                    if ((approach.plan !== 'none' && !planDone) || (approach.plan === 'reviewed' && !planReviewDone))
                        throw new Error('New planning requirements need reconciliation before publication');
                    proposal.approach = approach;
                    await this.verifyCandidate(proposal);
                    const published = await step('developer', 'draft-pr', `Verify the same issue/worktree/branch/head, saved implementation checks and the review/QA evidence required by this selected approach: ${JSON.stringify(approach)}. Skipped steps are not passed steps. Re-read origin/main and candidate. Push normally and open ONE canonical issue-linked DRAFT GitHub PR, with official source evidence, applicability, generated output, actual checks, omitted-step rationale, risks and lock-review requirement. Run lint:pr as required and read back exact saved PR/head/draft/body. Add its URL to the linked issue without changing unrelated content and read back. No duplicate PR, non-draft publication, merge, acceptance, tag or release. Return actual receipts and candidate identity.`, false, [proposal]);
                    if (published.outcome === 'reroute')
                        throw new Error('Draft publication must reconcile effects before changing its route');
                    await this.verifyDraft(proposal);
                }
                state.lastWeekly = easternDate();
            }
            state.lastDaily = easternDate();
            run.status = 'completed';
            run.stage = 'complete';
            this.store.emit('maintenance-completed', 'CMS follow-up completed; pending maintainer decisions remain in the saved ledger.', 'pm');
        }
        catch (e) {
            if (e instanceof StageYield) {
                run.status = 'queued';
                return;
            }
            run.status = this.store.state.paused ? 'interrupted' : 'blocked';
            run.error = String(e);
            this.store.emit('maintenance-blocked', run.error, 'pm');
        }
        finally {
            if (run.status !== 'queued')
                run.endedAt = new Date().toISOString();
            this.store.save();
        }
    }
}
