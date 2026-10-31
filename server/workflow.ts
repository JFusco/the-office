import { existsSync, realpathSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { CEC, HOLDS } from './config';
import { safeWebUrl } from './security';
import { plannedNext, unresolvedVerification } from './approach';
import { STAGES, type OfficeSnapshot, type Stage, type StageResult, type Ticket } from '../src/shared';
export function eligibility(t: Pick<Ticket, 'key' | 'assignee' | 'subtask' | 'boardMember' | 'status' | 'statusId'>, allowedStatus?: string): string {
    if (!/^CEC-\d+$/.test(t.key))
        return 'Outside CEC';
    if (t.assignee !== CEC.account)
        return 'Assigned to someone else';
    if (t.subtask)
        return 'Subtasks are excluded';
    if (!t.boardMember)
        return 'Not in CEC board 9121';
    if (allowedStatus) {
        if (t.status !== allowedStatus || !t.statusId)
            return 'Ticket left the authorized intake status';
        return HOLDS[t.key] || '';
    }
    if (!((t.status === 'To Do' && t.statusId === '10000') || (t.status === 'Open' && t.statusId === '1')))
        return 'Intake requires exact To Do or Open status';
    return HOLDS[t.key] || '';
}
export function ingest(state: OfficeSnapshot, incoming: Ticket[], now = new Date().toISOString()) {
    const keys = new Set<string>();
    for (const raw of incoming) {
        if (keys.has(raw.key))
            continue;
        keys.add(raw.key);
        const existing = state.tickets.find(t => t.key === raw.key);
        const reason = eligibility(raw);
        if (reason)
            continue;
        if (existing) {
            Object.assign(existing, { summary: raw.summary, status: raw.status, statusId: raw.statusId, assignee: raw.assignee, updated: raw.updated, observedAt: now });
            continue;
        }
        const epic = raw.type === 'Epic';
        state.tickets.push({ ...raw, stage: 'mailbox', activity: epic ? 'blocked' : 'waiting', blocker: epic ? 'Epic requires decomposition into development tickets.' : '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: now });
    }
    // Never delete active work simply because its PM-managed status left the intake query.
    for (const t of state.tickets)
        if (t.stage === 'mailbox' && !keys.has(t.key)) {
            t.activity = 'blocked';
            t.blocker = 'No longer present in the latest eligible intake. Recheck before starting.';
        }
}
export function nextStage(stage: Stage): Stage { return STAGES[Math.min(STAGES.indexOf(stage) + 1, STAGES.length - 1)]; }
export function containedFile(path: string, root: string) {
    if (!path || !existsSync(path) || !existsSync(root))
        return false;
    const p = realpathSync(path), r = realpathSync(root);
    return p.startsWith(r + sep);
}
export function resultGate(t: Ticket, stage: Stage, r: StageResult, artifactRoot: string): string {
    return stageResultGap(t, stage, r, artifactRoot, true);
}
/** Validate candidate and acceptance artifacts before publishing the QA outcome. */
export function qaEvidenceGap(t: Ticket, stage: Stage, r: StageResult, artifactRoot: string): string {
    if (!['qa', 'retest', 'staging-qa'].includes(stage))
        throw new Error('QA evidence validation requires a QA stage');
    return stageResultGap(t, stage, r, artifactRoot, false);
}
function stageResultGap(t: Ticket, stage: Stage, r: StageResult, artifactRoot: string, requireQAReceipt: boolean): string {
    if (r.outcome !== 'passed')
        return r.blocker || r.summary || 'Stage did not pass';
    if (stage === 'understand' && !t.approach && !r.approach)
        return 'The team must select an approach and explain its checks';
    if (stage === 'ci-diagnose')
        return 'Diagnosis cannot clear CI. Current policies must pass before readiness.';
    if (r.receipts.some(x => x.uncertain || !x.verified))
        return 'External action requires read-back reconciliation';
    if (stage === 'enhance' && !r.receipts.some(x => x.action === 'jira-update' && x.verified))
        return 'Lossless Jira update read-back is required';
    if (['implement', 'repair', 'code-review', 'repair-review', 'draft-pr', 'preview', 'qa', 'retest', 'publish', 'staging-qa'].includes(stage) && !/^[a-f0-9]{40}$/i.test(r.commit))
        return 'Exact candidate commit is missing';
    if (['code-review', 'repair-review', 'draft-pr', 'preview', 'qa', 'retest', 'publish'].includes(stage) && t.commit && r.commit !== t.commit)
        return 'Evidence does not match the current candidate commit';
    if (['plan-review', 'code-review', 'repair-review'].includes(stage) && !r.evidence.some(e => e.kind === 'review' && containedFile(e.path, artifactRoot)))
        return 'Independent saved review evidence is required';
    if (['plan-review', 'code-review', 'repair-review'].includes(stage) && r.findings.some(f => f.status === 'open'))
        return 'Independent review has unresolved findings';
    if (['implement', 'repair'].includes(stage) && !r.evidence.some(e => e.kind === 'checks' && e.commit === r.commit && containedFile(e.path, artifactRoot)))
        return 'Required saved repository check evidence is missing';
    if (stage === 'plan' && !r.evidence.some(e => containedFile(e.path, artifactRoot)))
        return 'Saved implementation plan is required';
    if (stage === 'plan-review' && t.findings.some(f => f.status !== 'verified' && !r.findings.some(current => current.id === f.id && current.status === 'verified')))
        return 'Every prior plan-review finding needs an explicit verified disposition';
    if (stage === 'draft-pr' && (!r.prId || !r.receipts.some(x => x.action === 'draft-pr' && x.verified)))
        return 'Verified draft PR receipt is missing';
    if (stage === 'preview' && (!safeWebUrl(r.previewUrl) || !r.evidence.some(e => e.kind === 'browser' && e.commit === r.commit)))
        return 'Exact candidate application readiness is unverified';
    if (['qa', 'retest', 'staging-qa'].includes(stage)) {
        if (r.paidRuns === null)
            return 'Provider run usage requires reconciliation';
        if (r.findings.some(f => f.status !== 'verified'))
            return 'QA has unresolved findings';
        if (stage === 'retest' && t.findings.some(f => !r.findings.some(current => current.id === f.id && current.status === 'verified')))
            return 'Every prior finding needs an explicit independent retest disposition';
        if (t.approach && t.approach.validation !== 'browser') {
            if (!r.evidence.some(e => e.kind === 'checks' && e.commit === r.commit && containedFile(e.path, artifactRoot)))
                return 'Saved focused check evidence for this commit is required';
            if (stage === 'staging-qa' && !r.evidence.some(e => e.kind === 'deployment' && e.commit === r.commit && containedFile(e.path, artifactRoot)))
                return 'Saved deployed version and acceptance evidence is required';
            if (requireQAReceipt && !r.receipts.some(x => x.action === 'jira-comment' && x.verified))
                return 'Focused QA update must be verified on the Jira ticket';
            return '';
        }
        if (!r.evidence.some(e => e.kind === 'browser' && e.commit === r.commit && safeWebUrl(e.url)))
            return 'Real browser evidence for this commit is required';
        if (!r.evidence.some(e => e.kind === 'screenshot' && e.commit === r.commit && containedFile(e.path, artifactRoot)))
            return 'Saved browser screenshot evidence is required';
        const report = resolve(r.qaRunDir, 'report.json'), final = resolve(r.qaRunDir, 'final.md');
        if (!containedFile(report, artifactRoot) || !containedFile(final, artifactRoot))
            return 'QA harness report.json and final.md are required';
        // Require the harness final handoff to expose failure/blocked coverage instead of accepting a prose claim.
        const handoff = readFileSync(final, 'utf8');
        if (!handoff.includes('Coverage') || !handoff.includes('Ticket delivery'))
            return 'QA harness handoff is incomplete';
        try {
            const reportBody = JSON.parse(readFileSync(report, 'utf8'));
            const coverage = reportBody.result_handoff?.coverage;
            if (reportBody.product_verdict !== 'pass' || reportBody.completion_status !== 'complete' || !coverage || coverage.tested < 1 || coverage.failed > 0 || coverage.blocked > 0)
                return 'QA harness has failing, blocked, incomplete or untested coverage';
        }
        catch {
            return 'QA harness report is unreadable';
        }
        if (requireQAReceipt && !r.receipts.some(x => x.action === 'jira-comment' && x.verified))
            return 'Focused QA update must be verified on the Jira ticket';
    }
    if (stage === 'publish') {
        const gap = publicationEvidenceGap(t, artifactRoot);
        if (gap)
            return gap;
    }
    if (stage === 'publish' && !r.receipts.some(x => x.action === 'publish-pr' && x.verified))
        return 'Published PR read-back is missing';
    if (stage === 'ready-for-staging' && !r.receipts.some(x => x.action === 'jira-transition' && x.verified))
        return 'Ready for Staging transition read-back is missing';
    return '';
}
export function publicationEvidenceGap(t: Ticket, artifactRoot: string): string {
    if (!t.approach)
        return t.prId ? '' : 'Verified draft PR read-back identity is required before publication';
    if (Object.values(t.results).some(r => r && (r.paidRuns === null || r.receipts.some(x => x.uncertain || !x.verified))))
        return 'Prior provider usage or external effects require read-back reconciliation';
    const a = t.approach;
    if (t.findings.some(f => f.status !== 'verified'))
        return 'Resolve existing findings before publication';
    if (unresolvedVerification(t))
        return 'Resolve failed or blocked verification before publication';
    if (a.plan !== 'none' && t.results.plan?.outcome !== 'passed')
        return 'Selected implementation plan is missing';
    if (a.plan === 'reviewed' && t.results['plan-review']?.outcome !== 'passed')
        return 'Selected independent plan review is missing';
    const checks = t.results.repair || t.results.implement;
    if (!checks || checks.outcome !== 'passed' || checks.commit !== t.commit || !checks.evidence.some(e => e.kind === 'checks' && e.commit === t.commit && containedFile(e.path, artifactRoot)))
        return 'Current implementation check evidence is required before publication';
    const draft = t.results['draft-pr'];
    if (!t.prId || !draft || draft.outcome !== 'passed' || draft.prId !== t.prId || !draft.receipts.some(r => r.action === 'draft-pr' && r.verified && !r.uncertain))
        return 'Verified draft PR read-back identity is required before publication';
    const review = t.results['repair-review'] || t.results['code-review'];
    if ((a.review !== 'none' || ['failed', 'blocked'].includes(t.results['code-review']?.outcome || '')) && (!review || review.outcome !== 'passed' || review.commit !== t.commit || resultGate(t, t.results['repair-review'] ? 'repair-review' : 'code-review', review, artifactRoot)))
        return 'Selected current-head code review is missing';
    const qa = t.results.retest || t.results.qa;
    if ((a.validation !== 'developer-checks' || ['failed', 'blocked'].includes(t.results.qa?.outcome || '')) && (!qa || qa.commit !== t.commit || resultGate(t, t.results.retest ? 'retest' : 'qa', qa, artifactRoot)))
        return 'Selected current-head QA evidence is missing';
    return '';
}
export function ciMatches(head: string, mergeCommit: string, build: {
    commit: string;
    status: string;
    result: string;
}, policyBuildId: number, buildId: number) {
    return !!head && !!mergeCommit && mergeCommit === build.commit && policyBuildId === buildId && build.status === 'completed' && build.result === 'succeeded';
}
export function advance(t: Ticket, stage: Stage, r: StageResult) {
    if (t.skippedStages)
        delete t.skippedStages[stage];
    t.results[stage] = r;
    t.evidence.push(...r.evidence);
    t.findings = r.findings.length ? r.findings : t.findings;
    if (r.commit)
        t.commit = r.commit;
    if (r.branch)
        t.branch = r.branch;
    if (r.worktree)
        t.worktree = r.worktree;
    if (r.previewUrl)
        t.previewUrl = r.previewUrl;
    if (r.prId)
        t.prId = r.prId;
    t.blocker = '';
    t.activity = 'waiting';
    const routed = plannedNext(t, stage);
    if (routed) {
        t.stage = routed;
        if (routed === t.approachReturnStage)
            delete t.approachReturnStage;
    }
    else if (stage === 'qa' || stage === 'retest')
        t.stage = 'publish';
    else if (stage === 'repair-review')
        t.stage = 'retest';
    else if (stage === 'ready-for-staging')
        t.stage = 'ready-for-staging';
    else
        t.stage = nextStage(stage);
}
