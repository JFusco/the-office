import { isDeepStrictEqual } from 'node:util';
import { workKey, type TicketJob } from '../../../src/shared';
import { digest } from '../../store/readback-evidence';
import { activeEffectId, harnessEffect } from '../harness/effect';
import { assertMetadataBinding } from './metadata-context';
import { metadataProvider, metadataOwnership } from './metadata-provider';
import { metadataWorkspace } from './metadata-workspace';
import { savedMetadataAssessment } from './metadata-assessment';
import { lintPRContent } from './pr-body';
import { metadataClaim } from './metadata-claim';
import { certifyDescriptionWrite, historyBeforeWrite } from './description-continuity';
import type { DescriptionHistory } from './description-history';
import type { GitHubDelivery } from '../pipeline/github-delivery';

/**
 * One metadata PATCH on an unchanged head. Uncertain dispatches are read back, never resent. The original dispatch
 * also records the description revision it produced when the edit history proves it; a read-back records none.
 */
export async function publishMetadata(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    const claim = structuredClone(metadataClaim(delivery, job));
    assertMetadataBinding(delivery, job);
    const { store, execute } = delivery, r = job.prMetadataRepair!, b = r.binding;
    if (!['publish', 'review', 'done'].includes(r.phase)) throw new Error('Validated saved metadata assessment is required before publication');
    const recordId = r.id, assessment = structuredClone(savedMetadataAssessment(delivery, job)), selected = structuredClone(assessment.selected!);
    const cwd = await metadataWorkspace(delivery, job);
    await lintPRContent(execute, cwd, { ...selected, source: 'developer' }, Number(job.key.slice(3)));
    const key = `pr-metadata:${r.id}`, id = activeEffectId(store, `harness:${job.id}:${key}`);
    const original = r.original ? { workerId: r.original.workerId, parkAt: r.original.parkAt, parkSha256: r.original.parkSha256,
        proposal: structuredClone(r.original.proposal), authorization: structuredClone(r.original.authorization),
        requestId: r.original.requestId, historySha256: r.original.historySha256 } : null;
    const payload = { binding: structuredClone(b), origin: r.origin, original,
        workerId: assessment.workerId, resultSha256: assessment.resultSha256, proposalSha256: assessment.proposalSha256, selected };
    const prior = store.getEffect(id);
    if (prior && (prior.operation !== 'github-pr-metadata' || prior.target !== b.url || prior.work.projectId !== b.projectId ||
        prior.work.kind !== 'delivery' || prior.work.id !== job.id || prior.attemptId !== job.id || !isDeepStrictEqual(prior.payload, payload)))
        throw new Error('Saved metadata intent differs from the bound proposal; preserve it for readback');
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
    if (effects.some(e => e.id !== id && e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt)))
        throw new Error('An earlier original delivery write still needs independent readback');
    let before: DescriptionHistory | undefined;
    const guard = async () => {
        metadataClaim(delivery, job, claim);
        assertMetadataBinding(delivery, job);
        if (job.prMetadataRepair !== r || r.id !== recordId || !isDeepStrictEqual(savedMetadataAssessment(delivery, job), assessment)) throw new Error('Metadata assessment changed before publication');
        await metadataWorkspace(delivery, job);
        const p = await metadataProvider(delivery, job);
        if (digest({ title: p.title, body: p.body }) !== b.beforeSha256) throw new Error('Human or provider metadata changed before publication');
        await metadataOwnership(delivery, job);
        before = await historyBeforeWrite(store, execute, b);
        metadataClaim(delivery, job, claim); assertMetadataBinding(delivery, job);
    };
    const readBack = async () => {
        metadataClaim(delivery, job, claim);
        if (job.prMetadataRepair !== r || r.id !== recordId || !isDeepStrictEqual(savedMetadataAssessment(delivery, job), assessment)) throw new Error('Original metadata publication identity changed');
        const p = await metadataProvider(delivery, job);
        if (p.title !== selected.title || p.body !== selected.body) return null;
        const [owner, name] = b.repository.split('/');
        const query = 'query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){number headRefOid closingIssuesReferences(first:100){nodes{url}pageInfo{hasNextPage}}}}}';
        const response = JSON.parse(await execute('gh', ['api', 'graphql', '--input', '-'], {
            cwd: store.project.repo, input: JSON.stringify({ query, variables: { owner, name, number: b.pr } }), readOnly: true, timeout: 60000,
        }));
        assertMetadataBinding(delivery, job);
        const native = response.data?.repository?.pullRequest, links = native?.closingIssuesReferences;
        const issueUrl = `https://github.com/${b.repository}/issues/${Number(b.key.slice(3))}`;
        if (response.errors?.length || native?.number !== b.pr || native.headRefOid !== b.head || !Array.isArray(links?.nodes) ||
            links.pageInfo?.hasNextPage !== false || links.nodes.length !== 1 || links.nodes[0]?.url !== issueUrl) return null;
        return { head: b.head, title: selected.title, body: selected.body, issueUrl };
    };
    // An already valid captured body needs no provider mutation or synthetic dispatch receipt.
    if (!prior && isDeepStrictEqual(selected, b.before)) {
        await guard();
        if (!await readBack()) throw new Error('Unchanged valid metadata or native closing link is unverified');
    } else if (prior?.status === 'verified') {
        if (!await readBack()) throw new Error('Previously verified metadata changed; preserve its receipt');
    } else {
        await harnessEffect(store, job, { key, operation: 'github-pr-metadata', target: b.url, payload, guard, readBack,
            dispatch: async () => {
                // A stale-description refresh writes the body alone; the title stays the one the proof bound.
                const response = await execute('gh', ['api', `repos/${b.repository}/pulls/${b.pr}`, '--method', 'PATCH', '--input', '-'], {
                    cwd: store.project.repo, input: JSON.stringify(b.staleDescription ? { body: selected.body } : selected), timeout: 60000,
                });
                const receipt = await readBack();
                const revision = receipt && await certifyDescriptionWrite(store, execute, before, { head: b.head, ...selected }, response);
                return receipt && revision ? { ...receipt, revision } : receipt;
            },
        });
    }
    await metadataWorkspace(delivery, job); await metadataOwnership(delivery, job, false);
    metadataClaim(delivery, job, claim);
    if (!await readBack()) throw new Error('Metadata changed before fresh review could be queued');
    r.phase = 'review'; r.publishedAfterStep ??= job.steps.length;
    delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
    store.save();
}
