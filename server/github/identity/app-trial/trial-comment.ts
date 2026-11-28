import { z } from 'zod';
import type { Execute } from '../../../delivery/board/project-graphql';
import { findProofComment, readCommentId, readProofComment, sendProofComment, type CommentReceipt } from '../../../delivery/closeout/proof-comment';
import { proofCommentQualification } from '../../../delivery/closeout/proof-comment-qualification';
import { sanitize } from '../../../office/security';
import { EffectUncertainError, type EffectOperation } from '../../../store/effects';
import type { Store } from '../../../store/store';
import { sendPrComment } from '../../pr-conversation-comment';
import { executeGitHubWrite, reconcileGitHubWrite, selectGitHubWriter, type GitHubWriteOptions } from '../write-boundary';
import { assertSavedTrial, isTrialWriter, TRIAL_AUTHORIZATION, trialExpectedState, trialWork } from './saved-trial';
import { admitTrial } from './trial-admission';
import { AppTrialPacket, bindPacket, isSuccessorOf, type BoundTrial } from './trial-packet';
import { refuse } from './trial-refusal';
import { trialResult, type AppTrialResult } from './trial-result';
import { observeTarget } from './trial-target';

/** `check` reads and binds only; `run` sends the one approved comment, or reads back the Effect already attempted. */
export const AppTrialRequest = z.strictObject({ mode: z.enum(['check', 'run']), packet: AppTrialPacket });

/** Trial ids in progress, per open project store: a second invocation of the same trial is refused, never queued. */
const inProgress = new WeakMap<Store, Set<string>>();

/**
 * Read-only, under the saved writer: the saved POST receipt by its ID, or a lost response by its unique marker in a
 * listing whose every body is readable. Never a POST.
 */
async function reconcile(store: Store, execute: Execute, trial: BoundTrial): Promise<void> {
    const { comment, packet } = trial;
    await reconcileGitHubWrite<CommentReceipt | null>(store, packet.effectId, async sent => {
        const found = await readProofComment(store, execute, comment, sent, true, trial.operation);
        const qualification = found ? await proofCommentQualification(store, execute, comment, packet.effectId, found) : undefined;
        return { verified: found !== null, receipt: found, qualification };
    });
}

/**
 * Sends the trial once through the write boundary and Effects: a fresh intent, or the same prepared one that was never
 * claimed. The selected writer must be the trial's App writer. The target is read again as the boundary's credential
 * check, under that App token, after the marker re-read and with no awaited step between it and the synchronous claim:
 * a closed, locked, moved or replaced issue then rejects the same intent unsent. Selection is constrained to this trial:
 * no route transition, the admission again after the marker read, and a token for the packet's own installation and
 * repository ids.
 */
async function dispatch(store: Store, execute: Execute, trial: BoundTrial): Promise<void> {
    const { comment, packet, payload, target } = trial, author = packet.botLogin;
    const options: GitHubWriteOptions = {
        preState: () => findProofComment(store, execute, comment, author, true), credentialCheck: () => observeTarget(store, execute, trial),
        trial: { installationId: packet.installationId, repositoryId: packet.repositoryId, admit: () => { admitTrial(store, packet); } },
    };
    const operation: EffectOperation<BoundTrial['payload'], CommentReceipt> = {
        id: packet.effectId, work: trialWork(trial), attemptId: packet.effectId,
        operation: trial.operation, target, authorization: TRIAL_AUTHORIZATION, payload, expectedState: trialExpectedState(trial),
        // A config, hold, pause or drain change while the intent waits withdraws the approval: the intent is rejected unsent.
        preflight: async () => { admitTrial(store, packet); },
        // The same local admission, synchronous inside the claim transaction after the boundary's writer checks: a
        // change during the preflight's last provider read cannot reach the POST.
        claim: () => {
            try { admitTrial(store, packet); }
            catch (error) { return error instanceof Error ? error.message : String(error); }
        },
        // A PR conversation comment goes through the shared PR comment adapter Dependabot redo also sends with.
        dispatch: () => comment.kind === 'pull' ? sendPrComment(store, execute, comment.number, comment.body) : sendProofComment(store, execute, comment),
        verify: async receipt => {
            if (!await readCommentId(store, execute, comment, author, receipt)) return false;
            return { verified: true, qualification: await proofCommentQualification(store, execute, comment, packet.effectId, receipt) };
        },
    };
    const selected = await selectGitHubWriter(store, operation, options);
    if (!isTrialWriter(selected?.writer, trial)) refuse('the write boundary did not select the approved App trial writer');
    // The token wait is asynchronous: a fresh intent is created only if the trial is still admitted after it.
    if (!store.getEffect(packet.effectId)) admitTrial(store, packet);
    try { await executeGitHubWrite(store, operation, options, selected); }
    catch (error) {
        // An attempted POST stays for read-back. An intent its preflight or claim rejected is spent and is answered as
        // that rejected trial; anything else, such as a refusal before an intent exists, is thrown as it is.
        if (error instanceof EffectUncertainError || store.getEffect(packet.effectId)?.status === 'rejected') return;
        throw error;
    }
}

async function invoke(store: Store, execute: Execute, mode: AppTrialResult['mode'], packet: AppTrialPacket): Promise<AppTrialResult> {
    const shape = bindPacket(store.project, packet), id = packet.effectId, saved = store.getEffect(id);
    const prefixed = store.db.prepare('SELECT id FROM effects WHERE substr(id, 1, ?) = ?').all(id.length + 1, `${id}:`) as { id: string }[];
    if (prefixed.some(row => isSuccessorOf(id, row.id)))
        refuse('an Effect derived from this trial id exists; reconcile it separately');
    if (saved) {
        assertSavedTrial(saved, shape);
        if (saved.status === 'rejected') refuse('the approved trial Effect was already refused or rejected; it is never sent again or replaced');
        if (saved.status === 'verified' || mode === 'check' && saved.status !== 'prepared') return trialResult(saved, shape, mode);
        // An attempted trial is read back under its pinned writer, whatever the pending entry says now. A read-back that
        // fails leaves the attempt and its receipt as they are; the answer still says what was attempted and what next.
        if (saved.status === 'dispatching' || saved.status === 'uncertain') {
            try { await reconcile(store, execute, shape); }
            catch (error) { return trialResult(store.getEffect(id), shape, mode, sanitize(error instanceof Error ? error.message : String(error))); }
            return trialResult(store.getEffect(id), shape, mode);
        }
    }
    const trial = admitTrial(store, packet);
    await observeTarget(store, execute, trial);
    if (mode === 'check') {
        if (await findProofComment(store, execute, trial.comment, packet.botLogin, true) !== null) refuse('the conversation already shows the marker');
        // The bound answer holds only if local policy still admits the trial after the last provider read.
        admitTrial(store, packet);
        return trialResult(store.getEffect(id), trial, mode);
    }
    // A saved prepared intent requests its App token before it reaches the boundary's checks: policy that changed
    // during the target read refuses here, with no token, no POST and the prepared row as it was.
    if (saved?.status === 'prepared') admitTrial(store, packet);
    await dispatch(store, execute, trial);
    return trialResult(store.getEffect(id), trial, mode);
}

/**
 * `pnpm office app-trial`: one approved GitHub App issue-comment trial on its configured project. The packet must equal
 * the pending `qualify` entry, the store and GitHub; then the trial is sent once through Effects as the App, or the Effect
 * already attempted under this id is read back under its saved writer. A rejected trial is spent: no retry or writer
 * successor is ever created, and no undesignated id can reach the operator through this command.
 */
export async function appTrialComment(store: Store, execute: Execute, input: unknown): Promise<AppTrialResult> {
    const { mode, packet } = AppTrialRequest.parse(input);
    const running = inProgress.get(store) ?? new Set<string>();
    inProgress.set(store, running);
    if (running.has(packet.effectId)) refuse('another invocation of this trial is in progress');
    running.add(packet.effectId);
    try { return await invoke(store, execute, mode, packet); }
    finally { running.delete(packet.effectId); }
}
