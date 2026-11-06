import { randomUUID } from 'node:crypto';
import { currentAssignment } from '../../workers/assignment-context';
import { CommandFailure } from '../../workers/process';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Role, TicketJob } from '../../../src/shared';

export interface HarnessControl { signal: AbortSignal; onSpawn: (pid: number) => void }

/**
 * Gives a deterministic harness command the lifecycle a model worker has: the role is reserved
 * in the shared worker map, Office pause aborts it and waits for termination, and a work record
 * keeps its process group visible. The record is administrative so it never counts as ticket effort.
 */
export async function withHarnessWork<T>(delivery: GitHubDelivery, job: TicketJob, role: Role, stage: string, run: (control: HarnessControl) => Promise<T>): Promise<T> {
    const { store } = delivery, agents = delivery.engine.agents;
    if (store.state.paused)
        throw new CommandFailure('Worker cancelled before dispatch: Office paused', 'cancelled', false);
    if (agents.active.has(role) || agents.active.size >= 3)
        throw new Error('Agent capacity is occupied');
    const controller = new AbortController();
    agents.active.set(role, controller);
    const id = randomUUID(), started = store.clock.monotonic(), startedAt = store.clock.now().toISOString(), assignment = currentAssignment();
    const elapsed = () => store.clock.monotonic() - started;
    let status: 'completed' | 'failed' | 'interrupted' = 'failed', heartbeat: ReturnType<typeof setInterval> | undefined;
    try {
        store.beginWork({ id, effortKind: 'administrative', requestedModel: null, requestedEffort: null, observedModel: null, observedEffort: null, claimId: assignment?.claim.id, lane: assignment?.lane,
            role, task: `${job.key} · Office harness ${stage}`, ticket: job.key, stage, requestId: job.id, sessionId: '', provider: 'harness', model: '', effort: '', status: 'running',
            startedAt, lastHeartbeatAt: startedAt, endedAt: '', elapsedMs: 0, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: '' });
        heartbeat = setInterval(() => store.checkpointWork(id, elapsed()), 5000);
        agents.timing.set(role, { id, started, timer: heartbeat });
        const value = await run({ signal: controller.signal, onSpawn: pid => store.checkpointWork(id, elapsed(), { processId: pid }) });
        if (controller.signal.aborted) throw new CommandFailure('Worker paused; reconcile any external effects before resuming', 'cancelled', true);
        status = 'completed';
        return value;
    }
    catch (error) {
        status = controller.signal.aborted ? 'interrupted' : 'failed';
        throw error;
    }
    finally {
        clearInterval(heartbeat);
        agents.timing.delete(role);
        store.finishWork(id, status, elapsed());
        agents.active.delete(role);
    }
}
