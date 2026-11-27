import { randomUUID } from 'node:crypto';
import type { LedgerOptions } from './budget-ledger';
import { AttributedFailure, NotDispatched, runBudgeted, type InvocationResult } from './budgeted-run';
import { readClaudeSignIn } from './provider-auth/claude-handoff';
import { finishCodex, groupState, markCodexPhase, readCanonicalCodex, recoverCodexHandoff, retireStaged, stageCodex, type GroupState, type RotationEvidence, type StagedCodex } from './provider-auth/codex-handoff';
import { isStopped, provesOwnership, readStatus, stopGeneration, type PassProof } from './provider-auth/profile-status';
import { prepareReaderInput } from './reader-input';
import type { ReaderSelection } from './reader-profiles';
import { claudeOutcome, codexOutcome, ReaderStream } from './reader-result';
import { createRunDirectories, type RunDirectories } from './run-directories';
import { within, type ValidatedRunnerPaths } from './runner-root';
import { modelDispatchGate, profileEligibility, type HostFacts, type InnerReceipt, type OuterReceipt } from './sandbox-qualification';
import type { Budgeted, GateRefusalReason, ProviderAnswer, ProviderCall, ProviderInvoke } from './stages/triage';
import type { ProtectedRoots } from './worker-sandbox-policy';
import { preparePolicy, runSandboxed, SandboxRefusal, type Executor, type PreparedPolicy } from './worker-sandbox-run';
import type { SandboxRuntime } from './worker-sandbox-runtime';

/**
 * One reader call, gate by gate. Before admission, so a refusal spends nothing: the dispatch gate,
 * the pinned runtime, trusted receipts, the storage overlap check, the run's own folders and policy
 * with full eligibility, the caller's pass lock with any earlier hand-off resolved, the profile's
 * stop state, then the sign-in. Inside the admitted call everything that matters is checked again
 * immediately before dispatch, and a refusal there is proven non-dispatch, so the hold is released.
 * Once dispatched, the call's completion includes the group's exit, the Codex write-back or stop
 * and the retirement of the run's credential copy. A timed-out call's completion is handed to the
 * caller that holds the pass lock, which drains it before releasing the lock.
 *
 * Nothing here acquires or releases the pass lock, reads `process.env` or touches an interactive
 * provider folder, Keychain item or session store.
 */

/** Trusted observations from the provider's side, bound to a run and a sign-in generation. None exist outside fixtures. */
export interface ProviderEvidence {
    authentication(run: string): readonly { provider: 'claude' | 'codex'; run: string; generation: string; kind: 'claude-unauthorized' | 'codex-invalid-grant' }[];
    rotation(run: string): RotationEvidence | null;
}
export const NO_PROVIDER_EVIDENCE: ProviderEvidence = { authentication: () => [], rotation: () => null };

export interface ReaderSetup {
    paths: ValidatedRunnerPaths;
    /** The acquiring caller's own pass-lock record; the gate rereads the lock to prove it. */
    proof: PassProof;
    /** Takes a timed-out call's completion; the caller drains these before `lock.release()`. */
    retainLate: (completion: Promise<unknown>) => void;
    selections: { claude: ReaderSelection; codex: ReaderSelection };
    /** Per profile: the outer battery binds rules that include the profile's program, and the inner its invocation. */
    receipts: { outer: Readonly<Record<string, OuterReceipt | null>>; inner: Readonly<Record<string, InnerReceipt | null>> };
    facts: HostFacts;
    runtime: () => SandboxRuntime;
    protectedRoots: ProtectedRoots;
    /** Physical interactive provider configuration and session roots; no runner storage may overlap one. */
    interactiveRoots: readonly string[];
    runtimeReads: readonly string[];
    executor: Executor;
    evidence?: ProviderEvidence;
    /** The shipped gate unless a test replaces it. */
    gate?: () => { open: boolean; reason: string };
    groupState?: (group: number) => GroupState;
    ledger?: LedgerOptions;
    newId?: () => string;
}

const refused = (reason: GateRefusalReason) => ({ status: 'gate-refused' as const, reason });
const errorText = (error: unknown) => String(error instanceof Error ? error.message : error).slice(0, 300);

type Prepared =
    | { ok: true; run: RunDirectories; prepared: PreparedPolicy; selection: ReaderSelection; runtime: SandboxRuntime; signIn: { provider: 'claude'; token: string; generation: string } | { provider: 'codex'; staged: StagedCodex } }
    | { ok: false; reason: GateRefusalReason; run?: RunDirectories };

function storageOverlaps(setup: ReaderSetup): boolean {
    const { paths } = setup, storage = [paths.runs, paths.wrapperTmp, paths.providers, paths.state];
    return storage.some(store => setup.interactiveRoots.some(root => within(store, root) || within(root, store)));
}

/** Gates one through five, in order; the first that fails is the refusal. */
function prepare(setup: ReaderSetup, provider: 'claude' | 'codex', input: Parameters<typeof prepareReaderInput>[1]): Prepared {
    if (!(setup.gate ?? modelDispatchGate)().open) return { ok: false, reason: 'dispatch-gate-closed' };
    let runtime: SandboxRuntime;
    try { runtime = setup.runtime(); } catch { return { ok: false, reason: 'runtime-unavailable' }; }
    if (runtime.status !== 'available') return { ok: false, reason: 'runtime-unavailable' };
    const selection = setup.selections[provider], outer = setup.receipts.outer[selection.profile.id] ?? null, inner = setup.receipts.inner[selection.profile.id] ?? null;
    if (selection.profile.provider !== provider || !outer || outer.qualification.status !== 'qualified' || !inner || inner.battery.status !== 'qualified')
        return { ok: false, reason: 'receipts-unqualified' };
    if (storageOverlaps(setup)) return { ok: false, reason: 'storage-overlap' };
    let run: RunDirectories, prepared: PreparedPolicy;
    try {
        run = createRunDirectories(setup.paths, (setup.newId ?? randomUUID)());
    } catch { return { ok: false, reason: 'preparation-failed' }; }
    try {
        prepareReaderInput(run, input);
        prepared = preparePolicy({
            paths: setup.paths, run, protectedRoots: setup.protectedRoots, executables: [selection.program.path], runtimeReads: setup.runtimeReads,
            runtime, provider, programs: { [selection.profile.id]: selection.program.path },
        });
    } catch { return { ok: false, reason: 'preparation-failed', run }; }
    if (!profileEligibility(selection, setup.facts, prepared, outer, inner).eligible) return { ok: false, reason: 'profile-ineligible', run };
    if (!provesOwnership(setup.paths, setup.proof)) return { ok: false, reason: 'ownership-unproven', run };
    // An earlier pass's hand-off is resolved first. This pass's own one in progress excludes only another Codex copy.
    const recovery = recoverCodexHandoff(setup.paths, setup.proof, setup.groupState ?? groupState);
    if (!recovery.ok && (provider === 'codex' || recovery.refusal !== 'handoff-active')) return { ok: false, reason: recovery.refusal, run };
    const status = readStatus(setup.paths);
    if (!status.ok) return { ok: false, reason: 'handoff-unrecoverable', run };
    if (provider === 'claude') {
        const signIn = readClaudeSignIn(setup.paths);
        if (!signIn.ok) return { ok: false, reason: 'sign-in-invalid', run };
        if (isStopped(status.status, 'claude', signIn.generation)) return { ok: false, reason: 'profile-stopped', run };
        return { ok: true, run, prepared, selection, runtime, signIn: { provider: 'claude', token: signIn.token, generation: signIn.generation } };
    }
    const canonical = readCanonicalCodex(setup.paths);
    if (!canonical.ok) return { ok: false, reason: 'sign-in-invalid', run };
    if (isStopped(status.status, 'codex', canonical.generation)) return { ok: false, reason: 'profile-stopped', run };
    const staged = stageCodex(setup.paths, setup.proof, run);
    if (!staged.ok) return { ok: false, reason: staged.refusal, run };
    return { ok: true, run, prepared, selection, runtime, signIn: { provider: 'codex', staged: staged.staged } };
}

/**
 * The `Budgeted` a stage is given: prepares the call, admits it under the allocation's own ID and hands
 * the stage the invocation prepared for that allocation.
 */
export function gatedBudgeted(setup: ReaderSetup): Budgeted {
    return async (call, use) => {
        const ready = prepare(setup, call.provider, call.input);
        if (!ready.ok) return refused(ready.reason);
        const invoke = modelInvoke(setup, ready);
        const outcome = await runBudgeted(setup.paths, call.request, run => use(run, invoke), { ...setup.ledger, reservationId: ready.run.id });
        // Retained before the outcome returns, so the pass cannot release its lock ahead of the credential's retirement.
        if (outcome.status === 'timed-out') setup.retainLate(outcome.late);
        if ((outcome.status === 'refused' || outcome.status === 'ledger-error') && ready.signIn.provider === 'codex') retireStaged(setup.paths, setup.proof, ready.run);
        return outcome;
    };
}

/** Whether an executor rejection proves the command never spawned: the shared runner says so, and nothing was seen. */
const neverSpawned = (error: unknown, spawned: boolean, session: string | null) =>
    !spawned && session === null && !!error && typeof error === 'object' && (error as { dispatched?: unknown }).dispatched === false;

function modelInvoke(setup: ReaderSetup, ready: Extract<Prepared, { ok: true }>): ProviderInvoke {
    const { run, prepared, selection, runtime, signIn } = ready, provider = selection.profile.provider, evidence = setup.evidence ?? NO_PROVIDER_EVIDENCE;
    const codex = signIn.provider === 'codex' ? signIn.staged : null;
    const generation = signIn.provider === 'codex' ? signIn.staged.generation : signIn.generation;
    // Run once per invocation; a later failure never resurrects a finished hand-off.
    let finished = false;
    const finish = (spawnedGroup: number | null) => {
        if (finished || !codex) return;
        finished = true;
        if (spawnedGroup !== null && (setup.groupState ?? groupState)(spawnedGroup) !== 'absent') return; // The next owner recovers it once the group is gone.
        finishCodex(setup.paths, setup.proof, run, codex, evidence.rotation(run.id));
    };
    const stopOnRejection = () => {
        for (const seen of evidence.authentication(run.id)) {
            if (seen.provider !== provider || seen.run !== run.id || seen.generation !== generation) continue;
            stopGeneration(setup.paths, setup.proof, provider, generation, seen.kind === 'claude-unauthorized' ? 'sign-in-rejected' : 'refresh-rejected');
        }
    };
    return async (call: ProviderCall): Promise<ProviderAnswer> => {
        // Immediately before dispatch, everything that admitted this call is checked again for this allocation.
        const recheck = (): string | null => {
            if (!(setup.gate ?? modelDispatchGate)().open) return 'the dispatch gate closed';
            if (call.signal.aborted) return 'the call was cancelled before dispatch';
            if (call.provider !== provider || call.reservation !== run.id) return 'the call is not this allocation\'s';
            if (!provesOwnership(setup.paths, setup.proof)) return 'the caller no longer holds the pass lock';
            const outer = setup.receipts.outer[selection.profile.id] ?? null, inner = setup.receipts.inner[selection.profile.id] ?? null;
            if (!profileEligibility(selection, setup.facts, prepared, outer, inner).eligible) return 'the profile is no longer eligible';
            if (signIn.provider === 'claude') {
                const current = readClaudeSignIn(setup.paths);
                if (!current.ok || current.generation !== signIn.generation) return 'the Claude sign-in changed';
            } else {
                const status = readStatus(setup.paths);
                if (!status.ok || status.status.active?.run !== run.id) return 'the Codex hand-off is no longer this run\'s';
            }
            return null;
        };
        const fault = recheck();
        if (fault) {
            if (codex) retireStaged(setup.paths, setup.proof, run);
            throw new NotDispatched(fault);
        }
        let spawned = false, group: number | null = null;
        const stream = new ReaderStream(provider, session => call.onSession(session), call.activity);
        if (codex) markCodexPhase(setup.paths, setup.proof, run.id, 'launching');
        let stdout: string;
        try {
            stdout = await runSandboxed({
                executor: setup.executor, runtime, prepared, selection: selection.profile.id, args: selection.argv,
                timeout: call.totalTimeoutMs, inactivityTimeout: call.inactivityTimeoutMs, signal: call.signal, input: call.prompt,
                ...(signIn.provider === 'claude' ? { claudeOAuthToken: signIn.token } : {}),
                onSpawn: pid => {
                    spawned = true;
                    group = pid;
                    if (codex) try { markCodexPhase(setup.paths, setup.proof, run.id, 'launched', pid); } catch { stream.fault ??= 'the launch could not be recorded'; }
                },
                onOutput: (channel, chunk) => { if (channel === 'stdout') stream.push(chunk); },
            });
        } catch (error) {
            if (error instanceof SandboxRefusal || neverSpawned(error, spawned, stream.session)) {
                if (codex) retireStaged(setup.paths, setup.proof, run);
                throw new NotDispatched(errorText(error));
            }
            finish(group);
            stopOnRejection();
            throw error instanceof Error ? error : new Error(errorText(error));
        }
        finish(group);
        stopOnRejection();
        const bound = stream.session;
        if (bound === null) throw new Error('the reader reported no session');
        const outcome = provider === 'claude' ? claudeOutcome(stdout, bound, selection) : codexOutcome(stdout, bound, run, selection);
        const failWith = (reason: string, receipt: InvocationResult | null): never => {
            throw receipt ? new AttributedFailure(reason, receipt) : new Error(reason);
        };
        if (stream.fault) failWith(stream.fault, outcome.receipt);
        if (!outcome.ok) failWith(outcome.reason, outcome.receipt);
        const answered = outcome as Extract<typeof outcome, { ok: true }>;
        return { provider, model: answered.model, session: bound, output: answered.output, receipt: answered.receipt };
    };
}
