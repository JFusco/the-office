import { cardStatus, projectCards, setCardStatus, statusField } from '../board/project-graphql';
import { resolveLane } from '../board/move-lane';
import { activeEffectId, harnessEffect } from '../harness/effect';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

/** Only the two exact cards positively parked by Office may leave Block in this recovery. */
export async function metadataPark(delivery: GitHubDelivery, job: TicketJob, guard: () => Promise<void>) {
    const { store, execute } = delivery, r = job.prMetadataRepair!, park = structuredClone(job.parked!);
    const field = await statusField(store, execute), block = resolveLane(field, 'Block'), review = resolveLane(field, 'In review');
    const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: Number(job.key.slice(3)) }, { kind: 'PullRequest', number: job.pr }]);
    if (cards.length !== 2 || cards.filter(c => c.kind === 'Issue').length !== 1 || cards.filter(c => c.kind === 'PullRequest').length !== 1)
        throw new Error('Both exact original metadata park cards are required');
    const prefix = `metadata-park:${r.id}:`, payload = (item: string) => ({ item, field: field.fieldId, option: review.id, head: job.head, park });
    const key = (item: string) => `${prefix}${item}`;
    const lanes = async () => {
        for (const card of cards) {
            const latest = job.boardUpdates?.filter(u => u.item === card.id).at(-1);
            if (!latest || latest.stage !== park.stage || latest.status !== 'verified' || latest.head !== r.binding.head || latest.project !== field.projectId || latest.field !== field.fieldId ||
                latest.option !== block.id || latest.detail === `${block.name} already verified.` || !Number.isFinite(Date.parse(latest.at)) || Date.parse(latest.at) < Date.parse(park.at))
                throw new Error('Latest Block transition is not the original Office-owned metadata park');
            const prior = store.getEffect<Record<string, unknown>>(activeEffectId(store, `harness:${job.id}:${key(card.id)}`));
            if (prior && (prior.operation !== 'github-project-status' || prior.target !== `${field.projectId}:${card.id}` || JSON.stringify(prior.payload) !== JSON.stringify(payload(card.id))))
                throw new Error('Original metadata return intent changed');
            const lane = await cardStatus(store, execute, card.id, field.fieldId);
            if (lane === block.id && (!prior || prior.status === 'prepared' || prior.status === 'rejected' && !prior.dispatchedAt)) continue;
            if (lane === review.id && prior && ['dispatching', 'uncertain', 'verified'].includes(prior.status)) continue;
            throw new Error('Original metadata park changed or return needs readback; no move will be repeated');
        }
    };
    await guard(); await lanes(); await guard();
    return {
        async restore() {
            for (const card of cards) {
                const readBack = async () => { await guard(); return await cardStatus(store, execute, card.id, field.fieldId) === review.id ? { head: r.binding.head, item: card.id, option: review.id } : null; };
                await harnessEffect(store, job, { key: key(card.id), operation: 'github-project-status', target: `${field.projectId}:${card.id}`, payload: payload(card.id),
                    guard: async () => { await guard(); await lanes(); await guard(); },
                    dispatch: async () => { await setCardStatus(store, execute, field.projectId, card.id, field.fieldId, review.id); return readBack(); }, readBack });
            }
            await guard(); await lanes();
            for (const card of cards) {
                if (await cardStatus(store, execute, card.id, field.fieldId) !== review.id || store.getEffect(activeEffectId(store, `harness:${job.id}:${key(card.id)}`))?.status !== 'verified')
                    throw new Error('Both metadata park returns must be verified before queueing');
            }
            await guard();
            return cards.map(card => ({ stage: park.stage, head: r.binding.head, project: field.projectId, item: card.id, field: field.fieldId, option: review.id,
                target: review.name, at: store.clock.now().toISOString(), status: 'verified' as const, detail: `Original metadata park at ${park.at} returned after single metadata publication.` }));
        },
    };
}
