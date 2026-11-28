import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { activeEffectId } from '../../delivery/harness/effect';
import { retryRead } from '../../delivery/harness/read-retry';
import { recordedPush } from '../../delivery/publication/record-push';
import { admitMarkedPush } from '../../delivery/publication/marker-publication';
import { exactRemoteHead } from '../../delivery/publication/remote-head';
import { assertPushCredential } from '../../github/identity/push-credentials';
import { assertPushHooksUnchanged } from './hook-baseline';
import { maintenanceEffect, maintenanceEffectBase, ownershipRefusal, type MaintenanceOwner } from './maintenance-effect';
import { MaintenanceStop } from './maintenance-stop';
import { maintenancePushHold } from './push-hold';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { PushHookBaseline } from '../../../src/shared';

type Execute = typeof command;
export interface PushInput { branch: string; worktree: string; head: string; base: string; hooks: PushHookBaseline }
export interface PushOutcome { effectId: string; observed?: 'already-at-head' }

/** Repository pre-push hooks may run full verification. */
const PUSH_TIMEOUT_MS = 15 * 60 * 1000;

/**
 * Pushes the reviewed head of a maintenance candidate once, to its own branch, through Effects (#612). An existing
 * intent for this head is handled first and must be bound to this branch: a verified push is honored from its
 * receipt, with no further lookup or hook check, and an attempted one is read back under its saved writer, its remote
 * lookup inside that reconciliation, never resent. Only an unsent push goes on: a held project (`push-hold.ts`, CMS)
 * refuses a fresh or prepared push before any remote lookup, marker admission, intent or dispatch, and a prepared
 * intent stays unsent. A remote already at the head is recorded as an observation; any other remote tip stops.
 * Before dispatch, on the operator and App routes alike, the destination, hook path and delegate chain must equal the
 * baseline read from the fetched target, and an opted-in project's release-marker check runs on this push's own
 * Effect. Hooks stay enabled; the push is never forced.
 */
export async function pushMaintenanceCandidate(store: Store, execute: Execute, owner: MaintenanceOwner, input: PushInput, assertCandidate: () => Promise<void>): Promise<PushOutcome> {
    if (!/^[a-f0-9]{40}$/.test(input.head)) throw new Error('A maintenance push needs the exact reviewed head');
    const candidate = { head: input.head, branch: input.branch, worktree: input.worktree };
    const base = maintenanceEffectBase(owner.run.id, owner.subject, `push:${input.head}`), effectId = activeEffectId(store, base), prior = store.getEffect(effectId);
    const target = `${store.project.repository}:${input.branch}`, payload = { head: input.head, branch: input.branch };
    const atHead = async () => await exactRemoteHead(execute, candidate) === input.head ? { head: input.head } : null;
    const root = resolve(store.dataRoot, 'runs', owner.run.id, 'push', owner.subject);
    const push = (guard: () => Promise<void>) => maintenanceEffect(store, owner, {
        key: `push:${input.head}`, operation: 'git-push', target, payload,
        guard,
        // An App push proves its destination, helper and hooks before the claim, so a refusal is never sent.
        credentialCheck: () => assertPushCredential(store, execute, input.worktree),
        dispatch: async () => {
            mkdirSync(root, { recursive: true, mode: 0o700 });
            const id = activeEffectId(store, base);
            await recordedPush(store, execute, { id: owner.run.id }, candidate, () => { const refusal = ownershipRefusal(store, owner); if (refusal) throw new Error(refusal); }, PUSH_TIMEOUT_MS,
                { effectId: id, work: { projectId: store.project.id, kind: 'maintenance', id: owner.run.id }, attemptId: owner.run.id, root });
            return retryRead(atHead);
        },
        readBack: atHead,
    });
    if (prior && ['dispatching', 'uncertain', 'verified'].includes(prior.status)) {
        if (prior.target !== target || JSON.stringify(prior.payload) !== JSON.stringify(payload))
            throw new Error(`The recorded push of ${input.head.slice(0, 7)} is bound to another branch or target; reconcile it before publication`);
        if (prior.status === 'verified') return { effectId };
        // Attempted: settled only by its own read-back under the saved writer; nothing fresh is checked or sent.
        await push(async () => { throw new Error('An attempted maintenance push is only read back, never resent'); });
        return { effectId: activeEffectId(store, base) };
    }
    const held = maintenancePushHold(store.project);
    if (held) throw new MaintenanceStop('authority', held);
    const remote = await exactRemoteHead(execute, candidate);
    if (remote && remote !== input.head) throw new Error(`Remote ${input.branch} is at ${remote.slice(0, 7)}, not the reviewed head; reconcile before publication`);
    if (remote === input.head) return { effectId: '', observed: 'already-at-head' };
    const marked = await admitMarkedPush(store, execute, { id: owner.run.id, candidateBase: input.base }, candidate, undefined,
        () => { const refusal = owner.current(); if (refusal) throw new Error(refusal); }, undefined, effectId);
    await push(async () => {
        await assertCandidate();
        await assertPushHooksUnchanged(execute, input.worktree, input.hooks);
        if (marked) await marked();
    });
    return { effectId: activeEffectId(store, base) };
}
