import { afterEach, expect, test, vi } from 'vitest';
import { packed165Fixture, repairedHead } from '../support/packed165';
import { cleanupFakes } from '../support/fake-github';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { routeAutomationMerge, observeAutomationMerge } from '../../../../server/delivery/readiness/automation-merge';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';
import { harnessPrepare } from '../../../../server/delivery/publication/prepare-stage';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { PACKED165 } from '../../../../server/delivery/recovery/packed165-policy';
import { enqueueRequest } from '../../../../server/scheduling/requests';

afterEach(cleanupFakes);
async function admitted() {
    const f = packed165Fixture(); await f.run();
    f.request.status = 'completed'; f.store.finishClaim(f.claim.id, 'completed');
    const model = vi.spyOn(f.engine.agents, 'run').mockRejectedValue(Error('No model cycle allowed'));
    return { ...f, model };
}
test('fresh publication, ready promotion and exact-head hosted-check merge use normal Effects with zero models', async () => {
    const f = await admitted(), originalSteps = structuredClone(f.job.steps);
    const published = await claimedDelivery(f.store, f.job, () => publishCandidate(f.store, f.delivery.execute, f.delivery.jobs, f.job, f.job.packedPublicationRepair!.contentRoot));
    f.job.pr = published.pr; f.job.prUrl = published.url;
    f.job.stage = 'prepare-pr';
    await claimedDelivery(f.store, f.job, () => harnessPrepare(f.delivery, f.job, f.artifactRoot(f.job), true));
    f.job.stage = 'lead-pr';
    expect(await claimedDelivery(f.store, f.job, () => routeAutomationMerge(f.delivery, f.job))).toBe(true);
    expect(f.job.stage).toBe('merge');
    const pr = f.state.prs[0], execute = f.delivery.execute.bind(f.delivery); pr.mergeable = true; let merges = 0;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args[0] === 'api') {
            if (args[1] === 'graphql') return JSON.stringify({ data: { repository: { pullRequest: { headRefOid: repairedHead, baseRefName: 'main', mergeStateStatus: 'CLEAN', reviewDecision: null, reviewThreads: { nodes: [], pageInfo: { hasNextPage: false } } } } } });
            if (args[1] === `repos/${PACKED165.repository}/commits/${repairedHead}/status`) return JSON.stringify({ sha: repairedHead, state: 'success', total_count: 1, statuses: [{ state: 'success' }] });
            if (args[1] === `repos/${PACKED165.repository}`) return JSON.stringify({ allow_merge_commit: true });
            if (args[1].endsWith('/merge') && args.includes('PUT')) { merges++; pr.merged_at = 'synthetic'; pr.merge_commit_sha = 'e'.repeat(40); return JSON.stringify({ merged: true, sha: pr.merge_commit_sha }); }
        }
        return execute(program, args, options);
    }) as typeof f.delivery.execute;
    await claimedDelivery(f.store, f.job, () => f.delivery.merge(f.job));
    expect(merges).toBe(1); expect(f.job.status).toBe('watching');
    expect(f.store.getEffect(f.effect.id)).toEqual(f.effect); expect(f.job.steps).toEqual(originalSteps);
    expect(f.model).not.toHaveBeenCalled();
    expect(f.store.getEffect(f.job.mergeIntentId!)?.status).toBe('verified');
    await expect(claimedDelivery(f.store, f.job, () => f.delivery.merge(f.job))).rejects.toThrow(); expect(merges).toBe(1);
});
test('pending hosted checks wait, a changed head or unsupported preparation stays blocked with no model fallback', async () => {
    const f = await admitted(), p = { number: 200, html_url: `https://github.com/${PACKED165.repository}/pull/200`, state: 'open', draft: false,
        mergeable: true, body: 'Closes #165', head: { sha: repairedHead, ref: f.job.branch }, base: { ref: 'main', repo: { full_name: PACKED165.repository } } };
    f.state.prs.push(p); f.job.pr = 200; f.job.stage = 'merge';
    await expect(observeAutomationMerge(f.delivery, f.job, p)).rejects.toThrow();
    p.head.sha = 'd'.repeat(40);
    await expect(observeAutomationMerge(f.delivery, f.job, p)).rejects.toThrow('changed head');
    f.job.stage = 'prepare-pr'; p.base.ref = 'other';
    await expect(harnessPrepare(f.delivery, f.job, f.artifactRoot(f.job), true)).rejects.toThrow('unsupported preparation worker');
    expect(f.model).not.toHaveBeenCalled();
});
test('a generic request cannot dispatch the exact recovery under a different intent or action', async () => {
    const f = await admitted();
    expect(() => enqueueRequest(f.store, 'authorize-packed-repair-165', f.job.key, PACKED165.head)).toThrow('Unknown harness operation');
    f.job.stage = 'lead-pr'; f.job.head = 'd'.repeat(40);
    await expect(claimedDelivery(f.store, f.job, () => routeAutomationMerge(f.delivery, f.job))).rejects.toThrow('approval changed');
});
