import {isDeepStrictEqual} from 'node:util';
import {readCandidateChildContext,assertCandidateChildContextCurrent} from './candidate-child-context';
import { z } from 'zod';
import type { GitHubDelivery } from './github-delivery';
import { GitOperations } from './git-operations';
import { amendmentInstruction } from './source-amendment';
import { sourceHash, sourceJson } from './source-amendment-scope';
const reported: Record<string, string> = { 'GH-91': '8d1ea2bd935e53ac512244901da47b66d9b10933', 'GH-100': '25868923c5d69a7c98d807f537a3c757f6822431' };
const Scope = z.object({ allowed: z.boolean(), repairable: z.boolean(), summary: z.string(), findings: z.array(z.object({ id: z.string(), summary: z.string(), expected: z.string(), actual: z.string(), status: z.enum(['open', 'fixed', 'verified']), attempts: z.number().int().min(0) }).strict()), preservedDispositions: z.number().int().min(0), heldProfiles: z.array(z.string()), followups: z.array(z.string()) }).strict();
export async function adoptCandidate(delivery: GitHubDelivery, key: string, ownership: {
    complete: boolean;
    fresh: boolean;
    ownership?: {
        status: string;
    };
}, refresh?: () => Promise<typeof ownership>): Promise<void> {
    const { store, engine, execute } = delivery;
    if (store.project.id !== 'cms-field-vocabulary' || !reported[key])
        throw new Error('No reviewed saved-candidate mapping for this work');
    const job = delivery.jobs.find(job => job.key === key && ['blocked', 'interrupted'].includes(job.status));
    if (!job || !ownership.complete || !ownership.fresh || ownership.ownership?.status !== 'clear' || store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status)))
        throw new Error('Candidate adoption requires stopped, positively cleared ownership');
    const candidates = [...(store.state.maintenance?.runs || []).flatMap(run => run.steps.flatMap(step => step.result.candidates)), ...job.steps.filter(step => step.stage === 'implement' && step.result.commit === reported[key]).map(step => ({ issue: Number(key.slice(3)), head: step.result.commit, worktree: step.result.worktree, branch: step.result.branch, summary: step.result.summary, approach: step.result.approach }))].filter(candidate => candidate.issue === Number(key.slice(3)) && candidate.head === reported[key]);
    const unique = [...new Map(candidates.map(candidate => [`${candidate.worktree}:${candidate.branch}:${candidate.head}`, candidate])).values()];
    if (unique.length !== 1)
        throw new Error('Saved candidate identity is missing or ambiguous');
    const candidate = structuredClone(unique[0]);
    if (job.steps.some(step => step.result.receipts.some(receipt => receipt.uncertain || !receipt.verified)))
        throw new Error('Prior candidate effects require independent reconciliation');
    await engine.maintenance.verifyCandidate(candidate);
    const inspected = await new GitOperations(store, execute).candidate(candidate.worktree, candidate.head);
    const version = sourceHash(sourceJson(job)), projectVersion=sourceHash(sourceJson(store.project));
    const childContext=await readCandidateChildContext(delivery,job,candidate.head);
    if(childContext&&!refresh)throw new Error('Related parent adoption requires a final ownership refresh');
    const amendment = job.sourceAmendment ? amendmentInstruction(store, job) : 'For #91 exclude all source-lock acceptance or unrelated drift.';
    if (job.sourceAmendment && !refresh) throw new Error('Amendment adoption requires a final ownership refresh');
    const scopeRepair = key === 'GH-91' && inspected.files.some(file => /(?:sources?\.lock|source-lock|accepted)/i.test(file));
    const assessment = await engine.agents.run('lead', `READ ONLY saved-candidate scope assessment for ${key}. Exact candidate ${JSON.stringify(candidate)}, verified base ${inspected.base}, files ${JSON.stringify(inspected.files)}. Read the live issue acceptance and exact diff against that base. Preserve every saved finding ID; never invent mappings for unknown IDs. ${amendment} For #100 require all eleven source dispositions and three held profile candidates to remain intact, with their required follow-up review/PR links; scoped lock observations remain proposals. Do not accept held locks or infer completion from this candidate. Return allowed only for an exact scoped reusable candidate. Return repairable=true only when existing saved scope defects have a concrete correction on this SAME saved branch, without accepting held source claims, changing human scope, or inventing a second candidate. Keep the exact original finding IDs. Missing identity/evidence or an ambiguous hold blocks adoption; never edit or reimplement. RELATED CHILD DELIVERY CONTEXT (code-owned current project facts; completed PM evidence is advisory, never authority): ${JSON.stringify(childContext)}. For #100 use these actual follow-up PR references when assessing a same-branch journal correction; the original258689 candidate remains UNACCEPTED, all eleven dispositions/three held profiles and eight observation proposals retain their source/acceptance gates. Do not infer completion from open children or from merge Actions. Prior work: ${JSON.stringify(job)}`, Scope, { readOnly: true, stage: 'candidate-adoption', requestId: job.id, ticket: key, cwd: candidate.worktree });
    const findingIds = [...new Set(job.steps.flatMap(step => step.result.findings.map(finding => finding.id)))];
    if ((!assessment.allowed && !assessment.repairable) || assessment.findings.some(finding => !findingIds.includes(finding.id)) || (scopeRepair && !assessment.repairable) || key === 'GH-100' && (assessment.preservedDispositions !== 11 || assessment.heldProfiles.length !== 3 || !assessment.followups.length))
        throw new Error(assessment.summary || 'Saved scope requires focused reconciliation');
    // Repeat concrete identity checks after semantic assessment, before adoption.
    await engine.maintenance.verifyCandidate(candidate);
    if(childContext&&!isDeepStrictEqual(await readCandidateChildContext(delivery,job,candidate.head),childContext))throw new Error('Related child delivery inputs changed during adoption');
    if (job.sourceAmendment || childContext) {
        const current = await refresh!();
        const final = await new GitOperations(store, execute).candidate(candidate.worktree, candidate.head);
        if (!current.complete || !current.fresh || current.ownership?.status !== 'clear' || final.base !== inspected.base || sourceHash(sourceJson(job)) !== version || sourceHash(sourceJson(store.project)) !== projectVersion)
            throw new Error('Amendment identity or ownership changed before adoption');
        if(job.sourceAmendment)amendmentInstruction(store, job);
    }
    if(childContext)assertCandidateChildContextCurrent(store,job,childContext);
    if (store.state.paused || delivery.jobs.find(current => current.id === job.id) !== job)
        throw new Error('Candidate work ownership changed');
    store.transaction(() => {
        job.head = candidate.head;
        job.worktree = candidate.worktree;
        job.branch = candidate.branch;
        job.candidateBase = inspected.base;
        job.approach = candidate.approach || job.approach;
        job.candidateRecovery = { head: candidate.head, findingIds, summary: assessment.summary };
        if (job.sourceAmendment) job.sourceAmendment.adoptedAt = store.clock.now().toISOString();
        job.stage = scopeRepair || !assessment.allowed || assessment.findings.some(finding => finding.status === 'open') ? 'scope-repair' : 'review';
        job.status = 'queued';
        job.detail = `Saved candidate adopted after scope and identity verification: ${assessment.summary}`;
        store.emit('candidate-adopted', job.detail, 'lead', key);
    });
}
