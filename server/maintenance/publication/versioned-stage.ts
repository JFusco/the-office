import { z } from 'zod';
import { versionedAssignment } from './versioned-assignment';
import { assertInterval, observeTargets, type IntervalTargets } from './worker-interval';
import { MaintenanceStop } from './maintenance-stop';
import { maintenancePolicyEvidence } from '../../github/github-context';
import type { VersionedLaunch } from './versioned-launch';
import type { Agents } from '../../workers/agents';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenancePublicationCandidate, MaintenanceResult, MaintenanceRun, Role } from '../../../src/shared';

/** What a versioned weekly step adds to an ordinary one: its launch policy, evidence, and the targets it must not move. */
export interface VersionedSpec {
    /** Allocated only when the step actually launches, never on replay. */
    launch: () => VersionedLaunch;
    schema?: z.ZodType<MaintenanceResult>;
    packet?: unknown;
    /** The owned branch, its PRs and the keyed issue, observed before and after the worker. */
    observe?: { targets: IntervalTargets; progress: MaintenancePublicationCandidate };
    /** Before the step yields: retain the reported check outputs from the worker's scratch (`retain-evidence.ts`). */
    retain?: (result: MaintenanceResult, position: number, workerId: string, scratch: string) => void;
    /** A result the harness already holds for this position (a reroute before any write); nothing launches. */
    precomputed?: MaintenanceResult;
    /** Stage wording the versioned contract adds to the ordinary instructions. */
    instructionsSuffix?: string;
}
export interface VersionedLaunched { result: MaintenanceResult; scratch?: string }

/**
 * An unstarted position may take the #612 contract only when no worker already ran there without a saved step: a
 * spawned attempt after the last saved step is ambiguous and goes to its original read-back. A worker whose result
 * the harness saved outside the steps (another candidate's issue decision, by its worker id) is accounted for.
 */
export function assertNoAmbiguousAttempt(store: Pick<Store, 'state'>, run: MaintenanceRun, stage: string, accounted: ReadonlySet<string> = new Set()): void {
    const since = Date.parse(run.steps.at(-1)?.at || run.requestedAt);
    if ((store.state.workLog || []).some(work => work.requestId === run.id && work.stage === stage && !!work.processId && Date.parse(work.startedAt) >= since && !accounted.has(work.id)))
        throw new MaintenanceStop('authority', `An earlier ${stage} worker ran without a saved result; read back its original session before continuing`);
}

/**
 * Launches one versioned weekly worker under its explicit policy with the final assignment built from the stage
 * contract and harness-selected evidence, and observes its owned targets around it. Saving and yielding stay with the
 * caller's ordinary step.
 */
export async function launchVersionedStep(store: Store, agents: Pick<Agents, 'run'>, execute: typeof command, run: MaintenanceRun,
    input: { role: Role; stage: string; instructions: string; candidates: MaintenanceResult['candidates']; requestedAt?: string },
    spec: VersionedSpec, schema: z.ZodType<MaintenanceResult>): Promise<VersionedLaunched> {
    const launch = spec.launch();
    const before = spec.observe ? await observeTargets(store, execute, spec.observe.targets) : undefined;
    const task = versionedAssignment(store, { run, stage: input.stage, instructions: `${input.instructions}${spec.instructionsSuffix ?? ''}`, candidates: input.candidates, policies: maintenancePolicyEvidence(store), packet: spec.packet, scratch: launch.scratch });
    const result = await agents.run(input.role, task, spec.schema ?? schema, { cwd: launch.policy.cwd, readOnly: launch.readOnly, stage: input.stage, requestId: run.id,
        enqueuedAt: input.requestedAt, maintenance: { policy: launch.policy, scratch: launch.scratch } });
    if (spec.observe && before) assertInterval(store, run, spec.observe.progress, input.stage, before, await observeTargets(store, execute, spec.observe.targets));
    return { result, scratch: launch.scratch };
}

/** The worker the runtime recorded for the step that just returned. */
export const latestWorker = (store: Pick<Store, 'state'>, run: MaintenanceRun, stage: string) =>
    (store.state.workLog || []).filter(work => work.requestId === run.id && work.stage === stage).at(-1)?.id || '';

/**
 * The versioned half of an ordinary maintenance step: a precomputed result, or a launch after the history check.
 * The caller saves the result as usual and calls `retain` with its position before the step yields.
 */
export async function runVersionedStep(store: Store, agents: Pick<Agents, 'run'>, execute: typeof command, run: MaintenanceRun,
    input: { role: Role; stage: string; instructions: string; candidates: MaintenanceResult['candidates']; requestedAt?: string },
    spec: VersionedSpec, schema: z.ZodType<MaintenanceResult>): Promise<{ result: MaintenanceResult; retain: (result: MaintenanceResult, position: number) => void }> {
    if (spec.precomputed) return { result: spec.precomputed, retain: () => {} };
    assertNoAmbiguousAttempt(store, run, input.stage);
    const launched = await launchVersionedStep(store, agents, execute, run, input, spec, schema);
    return { result: launched.result, retain: (result, position) => {
        if (spec.retain && launched.scratch && result.outcome === 'passed') spec.retain(result, position, latestWorker(store, run, input.stage), launched.scratch);
    } };
}
