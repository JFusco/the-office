import { expect, test, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { addMetadataHumanInput, originalMetadataFixture as original } from '../../../fixtures/pr-metadata';
import { enqueueMetadataRecovery } from '../../../../server/delivery/recovery/pr-metadata-intent';
import { reconcilePRMetadata, metadataRequestResolved } from '../../../../server/delivery/recovery/pr-metadata-recovery';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { harnessPrepare } from '../../../../server/delivery/publication/prepare-stage';
import { requireMetadataReview } from '../../../../server/delivery/publication/metadata-review';
import { deliveryInputSha256 } from '../../../../server/github/github-context';


test('an exact original permission park completes one metadata assessment/PATCH and two verified returns without replaying source or resetting budgets', async () => {
    const f = original(), cycle = structuredClone(f.job.repairCycle), steps = structuredClone(f.job.steps);
    await f.run();
    expect(f.job).toMatchObject({ stage: 'prepare-pr', status: 'queued', head: f.intent.head }); expect(f.job.parked).toBeUndefined();
    expect(f.model).toHaveBeenCalledTimes(1); expect(f.writes.patches).toBe(1); expect(f.state.cards.map(c => c.status)).toEqual(['review', 'review']);
    expect(f.job.repairCycle).toEqual(cycle); expect(f.job.steps).toEqual(steps);
    expect(metadataRequestResolved(f.store, f.request)).toBe(true);
    expect(enqueueMetadataRecovery(f.store, f.job.key, f.intent).id).toBe(f.request.id);
    const r = f.job.prMetadataRepair!, effectId = `harness:${f.job.id}:pr-metadata:${r.id}`;
    const effect = structuredClone(f.store.getEffect(effectId)), returns = structuredClone(r.original!.returnedEffects);
    expect((effect?.payload as any).original.returnedEffects).toBeUndefined(); expect(returns).toHaveLength(2);
    expect(returns!.map(id => f.store.getEffect(id)?.status)).toEqual(['verified', 'verified']);
    f.store.finishClaim(f.claim.id, 'completed'); f.request.status = 'completed'; f.job.status = 'working';
    f.state.comments.push({ id: 501, user: { login: 'JFusco' }, body: 'Review the published metadata in the current context.' });
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'recovered-prepare', 'prepare-pr')!;
    const prepared = await withAssignment(claim, 'delivery', () => harnessPrepare(f.delivery, f.job, f.root, true));
    expect(prepared?.outcome).toBe('passed'); expect(f.model).toHaveBeenCalledTimes(1); expect(f.writes.patches).toBe(1);
    expect(f.store.getEffect(effectId)).toEqual(effect); expect(r.original!.returnedEffects).toEqual(returns);
    expect(f.job.repairCycle).toEqual(cycle); expect(f.job.steps).toEqual(steps); expect(r.review).toBeUndefined();
    await expect(withAssignment(claim, 'delivery', () => requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
});

test.each([true, false])('a rejected preflight retry with a lost metadata response landed=%s reconciles without resending', async landed => {
    const f = original(), execute = f.delivery.execute; let rejected = false;
    f.delivery.execute = (async (program, args, options) => {
        const r = f.job.prMetadataRepair, id = r && `harness:${f.job.id}:pr-metadata:${r.id}`;
        if (program === 'curl' && id && f.store.getEffect(id)?.status === 'prepared' && !rejected) {
            rejected = true; throw new Error('Synthetic metadata preflight rejection');
        }
        return execute(program, args, options);
    }) as typeof execute;
    await expect(f.run()).rejects.toThrow('preflight rejection');
    const base = `harness:${f.job.id}:pr-metadata:${f.job.prMetadataRepair!.id}`, prior = structuredClone(f.store.getEffect(base));
    expect(prior).toMatchObject({ status: 'rejected', dispatchedAt: '' }); expect(f.writes.patches).toBe(0);
    f.writes.loseResponse = true; f.writes.land = landed;
    await expect(f.run()).rejects.toThrow('499');
    expect(f.store.getEffect(`${base}:retry-1`)?.status).toBe('uncertain'); expect(f.job.parked).toBeDefined();
    const r = f.job.prMetadataRepair!, binding = structuredClone(r.binding), history = r.original!.historySha256;
    const cycle = structuredClone(f.job.repairCycle), steps = structuredClone(f.job.steps);
    expect(r.phase).toBe('publish');
    addMetadataHumanInput(f);
    expect(deliveryInputSha256(f.store, f.job.key)).not.toBe(binding.inputSha256);
    f.store.finishClaim(f.claim.id, 'interrupted');
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'reconciliation', id: f.request.id }, 'fresh-readback', 'reconcile-pr-metadata')!;
    const resume = () => withAssignment(claim, 'delivery', () => reconcilePRMetadata(f.delivery, f.request));
    if (landed) await resume();
    else await expect(resume()).rejects.toThrow('will not be resent');
    expect(f.store.getEffect(base)).toEqual(prior); expect(f.writes.patches).toBe(1); expect(f.model).toHaveBeenCalledTimes(1);
    expect(f.store.getEffect(`${base}:retry-1`)?.status).toBe(landed ? 'verified' : 'uncertain');
    expect(f.state.cards.map(c => c.status)).toEqual(landed ? ['review', 'review'] : ['block', 'block']);
    expect(!!f.job.parked).toBe(!landed); expect(metadataRequestResolved(f.store, f.request)).toBe(landed);
    expect(r.binding).toEqual(binding); expect(r.original!.historySha256).toBe(history);
    expect(f.job.steps).toEqual(steps); expect(f.job.repairCycle).toEqual(cycle);
    if (landed) {
        expect(f.job).toMatchObject({ stage: 'prepare-pr', status: 'queued' });
        await expect(withAssignment(claim, 'delivery', () => requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
    }
});

test('a current human lane prevents the model, metadata write and any return', async () => {
    const f = original(); f.state.cards[0].status = 'backlog';
    await expect(f.run()).rejects.toThrow('park changed');
    expect(f.model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(0); expect(f.job.parked).toBeDefined();
});

test('lost metadata response is read back under the same original request without a second assessment/PATCH', async () => {
    const f = original(); f.writes.loseResponse = true;
    await expect(f.run()).rejects.toThrow('499'); expect(f.job.parked).toBeDefined();
    f.state.comments.push({ id: 500, user: { login: 'JFusco' }, body: 'New context after the dispatched metadata write.' });
    await f.run();
    expect(f.model).toHaveBeenCalledTimes(1); expect(f.writes.patches).toBe(1); expect(f.job.stage).toBe('prepare-pr');
    expect(f.job.status).toBe('queued'); expect(f.state.cards.map(c => c.status)).toEqual(['review', 'review']);
    expect(f.store.getEffect(`harness:${f.job.id}:pr-metadata:${f.job.prMetadataRepair!.id}`)?.status).toBe('verified');
});

test('an authenticated note after a rejected never-dispatched preflight still prevents publication', async () => {
    const f = original(), execute = f.delivery.execute;
    f.delivery.execute = (async (program, args, options) => {
        const r = f.job.prMetadataRepair;
        if (program === 'curl' && r && f.store.getEffect(`harness:${f.job.id}:pr-metadata:${r.id}`)?.status === 'prepared')
            throw new Error('Synthetic preflight rejection');
        return execute(program, args, options);
    }) as typeof execute;
    await expect(f.run()).rejects.toThrow('preflight rejection');
    const r = f.job.prMetadataRepair!;
    addMetadataHumanInput(f);
    expect(deliveryInputSha256(f.store, f.job.key)).not.toBe(r.binding.inputSha256);
    await expect(f.run()).rejects.toThrow('inputs or controls changed');
    expect(f.writes.patches).toBe(0); expect(f.model).toHaveBeenCalledTimes(1);
    expect(f.state.cards.map(c => c.status)).toEqual(['block', 'block']);
});

test.each([true, false])('a partial original card return landed=%s never repeats the uncertain mutation', async landed => {
    const f = original(), execute = f.delivery.execute; let returns = 0, failed = false;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args[1] === 'graphql') {
            const input = JSON.parse(options!.input!);
            if (input.query.startsWith('mutation') && input.variables.option === 'review') {
                returns++;
                if (!failed) { failed = true; if (landed) await execute(program, args, options); throw new Error('HTTP 499 after original card return'); }
            }
        }
        return execute(program, args, options);
    }) as typeof execute;
    await expect(f.run()).rejects.toThrow('499');
    expect(f.job.parked).toBeDefined(); expect(f.writes.patches).toBe(1); expect(f.model).toHaveBeenCalledTimes(1);
    if (landed) await f.run();
    else await expect(f.run()).rejects.toThrow('no move will be repeated');
    expect(returns).toBe(landed ? 2 : 1); expect(f.writes.patches).toBe(1); expect(f.model).toHaveBeenCalledTimes(1);
    expect(metadataRequestResolved(f.store, f.request)).toBe(landed);
});

test.each(['worker', 'proposal', 'head', 'park', 'claim', 'ownership'])('original recovery preserves identity and live gates: %s', async change => {
    const f = original();
    if (change === 'worker') f.source.worker.claimId = 'other';
    if (change === 'proposal') writeFileSync(f.intent.proposal.path, 'Unapproved changed proposal');
    if (change === 'head') f.job.head = 'f'.repeat(40);
    if (change === 'park') f.job.parked!.reason = 'A new human hold';
    if (change === 'claim') f.store.finishClaim(f.claim.id, 'interrupted');
    if (change === 'ownership') f.ownership.complete = false;
    await expect(f.run()).rejects.toThrow();
    expect(f.model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(0); expect(f.job.parked).toBeDefined();
    expect(f.state.cards.map(c => c.status)).toEqual(['block', 'block']);
});
