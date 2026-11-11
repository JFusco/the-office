import { assertDeliveryMayMutate } from '../harness/guards';
import { deliveryInputSha256 } from '../../github/github-context';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import { currentAssignment } from '../../workers/assignment-context';
import { harnessDelivers } from '../harness/scope';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import type { CIRepair } from '../../../src/contracts/ci-repair';

/** Recheck both scope and live ownership before local repair and every provider mutation. */
export async function guardCIRepair(delivery: GitHubDelivery, job: TicketJob, repair: CIRepair) {
    const { store } = delivery;
    const assertCurrent = () => {
        assertDeliveryMayMutate(store, delivery.jobs, job, repair.head);
        if (store.state.draining || job.stage !== 'lead-pr' || job.status !== 'working' || job.mergeAttempt ||
            job.ciRepairs?.at(-1) !== repair || job.prerequisites?.length ||
            deliveryInputSha256(store, job.key) !== repair.inputSha256 ||
            job.steps.some(s => hasUncertainEffects(s.stage, s.result)) ||
            store.activeClaims().some(c => c.work.kind === 'delivery' && c.work.id === job.id && c.id !== currentAssignment()?.claim.id))
            throw new Error('CI repair ownership, scope or delivery state changed');
        const merge = store.getEffect(job.mergeIntentId || `merge:${job.id}:${repair.head}`);
        if (merge && ['dispatching', 'uncertain', 'verified'].includes(merge.status)) throw new Error('Prior merge needs reconciliation before CI repair');
    };
    assertCurrent();
    const pr = await delivery.verifyPR(job, true), repo = store.project.repository;
    if (pr.head.sha !== repair.head || pr.head.ref !== repair.branch || pr.base.sha !== repair.base ||
        pr.head.repo?.full_name !== repo || pr.state !== 'open' || pr.merged_at || pr.head.ref === store.project.target)
        throw new Error('CI repair requires the unchanged same-repository PR and base');
    const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`);
    if (issue.state !== 'open' || issue.updated_at !== repair.issueUpdatedAt) throw new Error('CI repair issue scope changed');
    if (!harnessDelivers(store, job)) {
        const url = `http://127.0.0.1:${process.env.OFFICE_PORT || 4318}/api/sessions?project=${encodeURIComponent(store.project.id)}&ticket=${encodeURIComponent(job.key)}&requestId=${encodeURIComponent(job.id)}`;
        const ownership = JSON.parse(await delivery.execute('curl', ['--fail', '--silent', '--show-error', url], { readOnly: true, timeout: 60000 }));
        if (!ownership.complete || !ownership.fresh || ownership.project !== store.project.id || ownership.key !== job.key || ownership.ownership?.status !== 'clear')
            throw new Error('CI repair waits for fresh clear exact-issue session ownership');
    }
    assertCurrent();
    return pr;
}
