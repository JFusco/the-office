import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import type { LedgerOptions } from './budget-ledger';
import { AttributedFailure, NotDispatched, runBudgeted, type InvocationResult } from './budgeted-run';
import { readClaudeSignIn } from './provider-auth/claude-handoff';
import { codexCanDispatch, finishCodex, groupState, markCodexPhase, recoverCodexHandoff, retireStaged, stageCodex, type GroupState, type RotationEvidence, type StagedCodex } from './provider-auth/codex-handoff';
import { isStopped, provesOwnership, readStatus, stopGeneration, type PassProof } from './provider-auth/profile-status';
import { prepareReaderInput } from './reader-input';
import type { ReaderSelection } from './reader-profiles';
import { claudeOutcome, codexOutcome, containsCredential, ReaderStream } from './reader-result';
import { checkRunDirectories, createRunDirectories, type RunDirectories } from './run-directories';
import { physicalPath, within, type ValidatedRunnerPaths } from './runner-root';
import { modelDispatchGate, profileEligibility, type HostFacts, type InnerReceipt, type OuterReceipt } from './sandbox-qualification';
import type { Budgeted, GateRefusalReason, ProviderAnswer, ProviderCall, ProviderInvoke } from './stages/triage';
import type { ProtectedRoots } from './worker-sandbox-policy';
import { preparePolicy, runSandboxed, type Executor, type PreparedPolicy } from './worker-sandbox-run';
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

type Prepared =
    | { ok: true; run: RunDirectories; prepared: PreparedPolicy; selection: ReaderSelection; runtime: SandboxRuntime; signIn: { provider: 'claude'; token: string; generation: string } | { provider: 'codex'; staged: StagedCodex } }
    | { ok: false; reason: GateRefusalReason; run?: RunDirectories };

function storageOverlaps(setup: ReaderSetup): boolean {
    const { paths } = setup, storage = [paths.runs, paths.wrapperTmp, paths.providers, paths.state];
    return storage.map(physicalPath).some(store => setup.interactiveRoots.some(root => within(store, root) || within(root, store)));
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
    try {
        if (storageOverlaps(setup)) return { ok: false, reason: 'storage-overlap' };
    } catch { return { ok: false, reason: 'storage-overlap' }; }
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
    // Recovery first proves the caller's hold on the pass lock, then resolves an earlier pass's hand-off.
    // This pass's own one in progress excludes only another Codex copy.
    try {
        const recovery = recoverCodexHandoff(setup.paths, setup.proof, setup.groupState ?? groupState);
        if (!recovery.ok && (provider === 'codex' || recovery.refusal !== 'handoff-active')) return { ok: false, reason: recovery.refusal, run };
        if (provider === 'claude') {
            const status = readStatus(setup.paths);
            if (!status.ok) return { ok: false, reason: 'handoff-unrecoverable', run };
            let signIn: ReturnType<typeof readClaudeSignIn>;
            try { signIn = readClaudeSignIn(setup.paths); }
            catch { return { ok: false, reason: 'sign-in-invalid', run }; }
            if (!signIn.ok) return { ok: false, reason: 'sign-in-invalid', run };
            if (isStopped(status.status, 'claude', signIn.generation)) return { ok: false, reason: 'profile-stopped', run };
            return { ok: true, run, prepared, selection, runtime, signIn: { provider: 'claude', token: signIn.token, generation: signIn.generation } };
        }
        const staged = stageCodex(setup.paths, setup.proof, run);
        if (!staged.ok) return { ok: false, reason: staged.refusal, run };
        return { ok: true, run, prepared, selection, runtime, signIn: { provider: 'codex', staged: staged.staged } };
    } catch { return { ok: false, reason: 'handoff-unrecoverable', run }; }
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

/** Whether the executor positively reported a pre-spawn refusal. */
const reportedNonDispatch = (error: unknown) =>
    !!error && typeof error === 'object' && (error as { dispatched?: unknown }).dispatched === false;

function failWith(reason: string, receipt: InvocationResult | null): never {
    throw receipt ? new AttributedFailure(reason, receipt) : new Error(reason);
}

function recheck(setup: ReaderSetup, ready: Extract<Prepared, { ok: true }>, call: ProviderCall): string | null {
    const { run, prepared, selection, signIn } = ready, provider = selection.profile.provider;
    if (!(setup.gate ?? modelDispatchGate)().open) return 'the dispatch gate closed';
    if (call.provider !== provider || call.reservation !== run.id) return "the call is not this allocation's";
    if (!provesOwnership(setup.paths, setup.proof)) return 'the caller no longer holds the pass lock';
    const outer = setup.receipts.outer[selection.profile.id] ?? null, inner = setup.receipts.inner[selection.profile.id] ?? null;
    if (!profileEligibility(selection, setup.facts, prepared, outer, inner).eligible) return 'the profile is no longer eligible';
    if (signIn.provider === 'claude') {
        const status = readStatus(setup.paths), current = readClaudeSignIn(setup.paths);
        if (!status.ok || !current.ok || current.generation !== signIn.generation || isStopped(status.status, 'claude', signIn.generation))
            return 'the Claude sign-in is no longer eligible';
    } else if (!codexCanDispatch(setup.paths, setup.proof, signIn.staged)) return 'the Codex sign-in is no longer eligible';
    return null;
}

async function confirmGroupExit(setup: ReaderSetup, group: number): Promise<boolean> {
    const inspect = setup.groupState ?? groupState;
    for (;;) {
        let state: GroupState;
        try { state = inspect(group); } catch { state = 'uncertain'; }
        if (state === 'absent') return true;
        if (!provesOwnership(setup.paths, setup.proof)) return false;
        await delay(50);
    }
}

function modelInvoke(setup: ReaderSetup, ready: Extract<Prepared, { ok: true }>): ProviderInvoke {
    const { run, prepared, selection, runtime, signIn } = ready, provider = selection.profile.provider, evidence = setup.evidence ?? NO_PROVIDER_EVIDENCE;
    const codex = signIn.provider === 'codex' ? signIn.staged : null;
    const generation = signIn.provider === 'codex' ? signIn.staged.generation : signIn.generation;
    const credentials = signIn.provider === 'codex' ? signIn.staged.secrets : [signIn.token];
    const refuseDispatch = (reason: string): never => {
        if (codex) retireStaged(setup.paths, setup.proof, run);
        throw new NotDispatched(reason);
    };
    return async (call: ProviderCall): Promise<ProviderAnswer> => {
        let fault: string | null;
        try { fault = recheck(setup, ready, call); }
        catch { fault = 'the dispatch requirements could not be rechecked'; }
        if (fault) refuseDispatch(fault);
        if (codex) {
            try { markCodexPhase(setup.paths, setup.proof, run.id, 'launching'); }
            catch { refuseDispatch('the launch intent could not be recorded'); }
        }

        let entered = false, spawned = false, group: number | null = null;
        let rejected = false, preSpawnRefusal = false, stdout = '';
        const stream = new ReaderStream(provider, session => call.onSession(session), call.activity, credentials);
        try {
            stdout = await runSandboxed({
                executor: (...args) => { entered = true; return setup.executor(...args); },
                runtime, prepared, selection: selection.profile.id, args: selection.argv,
                timeout: call.totalTimeoutMs, inactivityTimeout: call.inactivityTimeoutMs, signal: call.signal, input: call.prompt,
                ...(signIn.provider === 'claude' ? { claudeOAuthToken: signIn.token } : {}),
                onSpawn: pid => {
                    spawned = true;
                    if (Number.isSafeInteger(pid) && pid > 0) group = pid;
                    if (codex && group !== null) {
                        try { markCodexPhase(setup.paths, setup.proof, run.id, 'launched', group); }
                        catch { stream.fault ??= 'the launch could not be recorded'; }
                    }
                },
                onOutput: (channel, chunk) => { if (channel === 'stdout') stream.push(chunk); },
            });
        } catch (error) {
            rejected = true;
            preSpawnRefusal = !entered || reportedNonDispatch(error);
        }
        stream.flush();
        if (preSpawnRefusal && !spawned && !stream.sawSession) refuseDispatch('the executor refused before spawning');
        if (group === null || !await confirmGroupExit(setup, group))
            failWith('the reader process group could not be confirmed exited', null);

        let directoriesValid = true;
        try { checkRunDirectories(setup.paths, run); }
        catch { directoriesValid = false; stream.fault ??= 'the run folders changed during the run'; }

        let authenticationRejected = false;
        let rotation: RotationEvidence | null = null;
        try {
            const kind = provider === 'claude' ? 'claude-unauthorized' : 'codex-invalid-grant';
            authenticationRejected = evidence.authentication(run.id).some(seen =>
                seen.provider === provider && seen.run === run.id && seen.generation === generation && seen.kind === kind);
            if (codex && directoriesValid && !authenticationRejected) rotation = evidence.rotation(run.id);
            if (authenticationRejected && !codex)
                stopGeneration(setup.paths, setup.proof, provider, generation, 'sign-in-rejected');
        } catch { stream.fault ??= 'the reader authentication evidence could not be recorded'; }

        const handoff = codex && finishCodex(setup.paths, setup.proof, run, codex, rotation, { authenticationRejected, directoriesValid });
        const bound = stream.session;
        const outcome = bound === null ? null
            : provider === 'codex' ? directoriesValid ? codexOutcome(stdout, bound, run, selection) : null
            : rejected ? null : claudeOutcome(stdout, bound, selection);
        const receipt = outcome?.receipt ?? (rejected ? stream.failureReceipt() : null);
        if (authenticationRejected) failWith('the provider rejected the enrolled sign-in', receipt);
        if (stream.fault) failWith(stream.fault, receipt);
        if (handoff && (handoff.outcome === 'stopped' || handoff.outcome === 'ownership-lost' || handoff.outcome === 'cleanup-pending'))
            failWith('the Codex hand-off could not be completed safely', receipt);
        if (rejected) failWith('the reader executor failed', receipt);
        if (!outcome || bound === null) return failWith('the reader reported no session', receipt);
        if (!outcome.ok) return failWith(outcome.reason, receipt);
        if (containsCredential(outcome.output, credentials)) failWith('the reader output contained sign-in material', receipt);
        return { provider, model: outcome.model, session: bound, output: outcome.output, receipt: outcome.receipt };
    };
}
