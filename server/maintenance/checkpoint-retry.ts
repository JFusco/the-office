import { completeNativeCheckpoint } from './brain/brain-checkpoint';
import { validateNativeContinuation } from './continuations';
import { maintenanceSuperseded } from './superseded';
import type { Coordinator } from '../scheduling/coordination';

export async function resumeRepairedMaintenance(this: Coordinator, now = new Date()) {
    if (this.store.project.id !== 'brain' || !this.state.enabled || this.store.state.paused || this.pickup.enabled === false)
        return;
    const maintenance = this.store.state.maintenance;
    if (maintenance?.runs.some(r => ['queued', 'working'].includes(r.status) || ['blocked', 'interrupted'].includes(r.status) && !maintenanceSuperseded({ maintenance }, r)))
        return;
    for (const checkpoint of this.state.checkpoints) {
        if (checkpoint.status !== 'blocked' || checkpoint.repairResume?.needsFollowup || checkpoint.repairResume?.nextCheckAt && Date.parse(checkpoint.repairResume.nextCheckAt) > now.getTime())
            continue;
        const original = this.store.state.maintenance?.runs.find(r => r.id === checkpoint.runId), followup = original?.blockerFollowup;
        if (original?.status !== 'reconciled' || followup?.status !== 'completed' || !followup.issue || !this.state.jobs?.some(j => j.key === `GH-${followup.issue}` && j.status === 'completed'))
            continue;
        const resume = checkpoint.repairResume ??= { issue: followup.issue, nextCheckAt: '', needsFollowup: false };
        try {
            const gate = await (this.engine.maintenance as import('./brain/brain-maintenance').BrainMaintenance).readStatus();
            if (typeof gate.attempts !== 'number' || gate.attempts < 0 || !Object.hasOwn(gate, 'active') || !Object.hasOwn(gate, 'completed'))
                throw new Error('Native Brain gate returned incomplete status');
            const continuation = this.state.continuations?.find(item => item.checkpointId === checkpoint.id);
            if (continuation && validateNativeContinuation(continuation, gate)) {
                continuation.status = 'completed';
                continuation.nativeSlot = gate.completed!.slotDate;
                continuation.detail = 'Existing continuation independently verified by the native completed run; no second writer dispatched.';
                checkpoint.status = 'completed';
                checkpoint.detail = continuation.detail;
                this.store.emit('continuation-completed', continuation.detail, 'pm', continuation.originalIssue);
                continue;
            }
            if (gate.active || gate.completed || gate.attempts >= 3) {
                resume.nextCheckAt = new Date(now.getTime() + 5 * 60000).toISOString();
                const detail = gate.active ? 'the current native run to finish' : gate.completed ? 'the next native daily slot' : 'the native daily retry allowance to reset';
                checkpoint.detail = `GH-${resume.issue} is completed. Refresh continuation waits for ${detail}; Morgan owns the next automatic gate check.`;
                this.store.save();
                continue;
            }
            // Only the native gate and verified persisted repair identity authorize
            // this handoff. No prompt, summary text, or model decision is consulted.
            this.queueCheckpointRetry(checkpoint, original, gate, now);
            return;
        }
        catch (error) {
            resume.needsFollowup = true;
            resume.nextCheckAt = '';
            checkpoint.detail = `Refresh continuation needs Morgan and Ellis: ${String(error)}. Original effects remain reconciled; no retry was dispatched.`;
            this.store.emit('maintenance-continuation-blocked', checkpoint.detail, 'pm');
        }
    }
}

export function queueCheckpointRetry(this: Coordinator, checkpoint: import('../../src/shared').DailyCheckpoint, original: import('../../src/shared').MaintenanceRun, gate: { retryAfter?: string | null }, now = new Date()) {
    checkpoint.retryAt = new Date(Math.max(now.getTime(), Date.parse(gate.retryAfter || '') || 0)).toISOString();
    checkpoint.status = 'queued';
    checkpoint.detail = `Original maintenance ${original.id} reconciled. Brain checkpoint will retry after ${checkpoint.retryAt}; the nightly gate remains authoritative.`;
    if (checkpoint.repairResume) {
        checkpoint.repairResume.needsFollowup = false;
        checkpoint.repairResume.nextCheckAt = '';
    }
    this.store.emit('checkpoint-retry-queued', checkpoint.detail, 'pm');
}

export async function readBackCheckpoint(this: Coordinator, id: string) {
    const checkpoint = this.state.checkpoints.find(checkpoint => checkpoint.id === id);
    const original = this.store.state.maintenance?.runs.find(run => run.id === checkpoint?.runId);
    if (!checkpoint || !original || this.store.project.id !== 'brain' || this.store.state.paused)
        throw new Error('A native Brain checkpoint and original run are required');
    if (checkpoint.status === 'completed' && original.steps.some(step => step.stage === 'checkpoint-native-readback')) return;
    const gate = await (this.engine.maintenance as import('./brain/brain-maintenance').BrainMaintenance).readStatus();
    if (!completeNativeCheckpoint(this.store, checkpoint, original, gate))
        throw new Error('Existing native completion does not resolve this checkpoint; no maintenance retry dispatched');
}

export async function retryCheckpoint(this: Coordinator, id: string, nativeReadback = true) {
    const checkpoint = this.state.checkpoints.find(c => c.id === id);
    if (!checkpoint || !['blocked', 'interrupted'].includes(checkpoint.status) || this.store.state.paused)
        throw new Error('An inactive blocked checkpoint is required');
    if (this.store.project.id !== 'brain')
        throw new Error('Checkpoint retry currently supports Brain only');
    const original = this.store.state.maintenance?.runs.find(r => r.id === checkpoint.runId);
    if (!original || original.status !== 'reconciled')
        throw new Error('Read back the original maintenance effects before retrying its checkpoint');
    const gate = await (this.engine.maintenance as import('./brain/brain-maintenance').BrainMaintenance).readStatus();
    if (nativeReadback && completeNativeCheckpoint(this.store, checkpoint, original, gate))
        return;
    if (gate.active || gate.completed || gate.attempts >= 3)
        throw new Error('Brain has active work, a completed date, or its daily retry limit');
    this.queueCheckpointRetry(checkpoint, original, gate);
}
