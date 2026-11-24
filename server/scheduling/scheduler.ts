import { releaseOrRetain } from './stopping-claims';
import { randomUUID } from 'node:crypto';
import type { ProgressionItem, QueueTiming, ExecutionLane } from '../../src/shared';
import { withAssignment } from '../workers/assignment-context';
import { workKey } from '../../src/shared';
import type { Store } from '../store/store';
import type { OfficeCapacity } from '../office/projects';
import type { Clock } from '../office/clock';
import { systemClock } from '../office/clock';
import { admitsWork, canDispatch, foreignWork, type WorkSlot } from './slot-policy';
export interface ScheduledWork extends ProgressionItem {
    store: Store;
    allowPaused?: boolean;
    claimEligible?(): boolean;
    execute(): Promise<unknown>;
    timing?: QueueTiming[];
    saveTiming?(timing: QueueTiming): void;
    afterStage?(): void;
    identity(): string;
    /** Present when this delivery stage may overlap other projects' stages. */
    slot?: WorkSlot;
}
/** Selection is pure; provider observations never run while traversing a queue. */
export function selectWork(items: ScheduledWork[], noticesSince: number): ScheduledWork | undefined {
    const eligible = items.filter(item => item.eligibility.state === 'runnable');
    const notice = eligible.filter(item => item.rank === 4).sort(fifo)[0];
    return notice && noticesSince >= 3 ? notice : eligible.sort((a, b) => a.rank - b.rank || fifo(a, b))[0];
}
// Stable sort retains durable insertion order when enqueue timestamps tie.
const fifo = (a: ProgressionItem, b: ProgressionItem) => a.enqueuedAt.localeCompare(b.enqueuedAt);
/** Exclusive delivery starts in a row while a slotted head waits; the same three as the notice threshold. */
const EXCLUSIVE_BOUND = 3;
export class Scheduler {
    private owner = randomUUID();
    private running = false;
    /** Project rotation; on concurrent delivery, the rotation of exclusive heads only. */
    private cursor = 0;
    /** Concurrent delivery only: the rotation of slotted heads, apart from the exclusive one. */
    private slottedCursor = 0;
    /** Concurrent delivery only: exclusive starts since the last slotted start, at most EXCLUSIVE_BOUND. */
    private exclusiveStreak = 0;
    constructor(private capacity: OfficeCapacity, private clock: Clock = systemClock, private lane: ExecutionLane = 'delivery') { }
    private state(store: Store) {
        return this.lane === 'delivery' ? store.state.scheduler! : ((store.state.schedulerLanes ??= {})[this.lane] ??= { noticeClaims: 0, lastClaimAt: '', lastProgressAt: '', undispatchedCycles: 0 });
    }
    async pump(projects: {
        store: Store;
        items: ScheduledWork[];
    }[]): Promise<void> {
        for (const { store, items } of projects)
            for (const item of items)
                if (item.eligibility.state === 'runnable')
                    store.db.prepare('INSERT OR IGNORE INTO queue_observations VALUES(?,?,?,?)').run(workKey(item.work), item.stage, item.enqueuedAt, this.clock.now().toISOString());
        const concurrent = this.capacity.limit > 1;
        const heldElsewhere = concurrent ? !this.capacity.slots.size && foreignWork(this.capacity) : !this.running && !this.capacity.active.size && this.capacity.lane;
        if (heldElsewhere)
            for (const { store, items } of projects)
                if (items.some(item => item.eligibility.state === 'runnable')) {
                    const state = this.state(store);
                    state.undispatchedCycles++;
                    if (state.undispatchedCycles === 2)
                        store.emit('scheduler-stalled', 'Runnable work remained undispatched across two free-worker cycles; inspect the retained lane owner.', 'pm');
                    else
                        store.save();
                }
        if (concurrent)
            return this.pumpSlots(projects);
        if (this.running || this.capacity.active.size || this.capacity.lane || !projects.length)
            return;
        for (let offset = 0; offset < projects.length; offset++) {
            const index = (this.cursor + offset) % projects.length;
            const { store, items } = projects[index];
            const scheduling = this.state(store);
            const item = selectWork(items.filter(item => item.allowPaused || !store.state.paused && !store.state.draining), scheduling.noticeClaims);
            if (!item)
                continue;
            // Reserve synchronously before any await; duplicate ticks cannot claim.
            this.running = true;
            this.capacity.lane = store.project.id;
            return this.dispatch(store, items, item, () => {
                // Worker promises settle only after confirmed process termination.
                if (this.capacity.lane === store.project.id)
                    this.capacity.lane = '';
                this.running = false;
            }, () => { this.cursor = (index + 1) % projects.length; }) ?? undefined;
        }
    }
    /**
     * Concurrent stages: one claim per pump into a free slot; overlapping ticks fill the rest. On delivery, after
     * EXCLUSIVE_BOUND exclusive starts in a row a waiting slotted head goes first, so neither class starves the other.
     */
    private async pumpSlots(projects: {
        store: Store;
        items: ScheduledWork[];
    }[]): Promise<void> {
        if (!projects.length || !admitsWork(this.capacity))
            return;
        const selected = projects.map(({ store, items }) => selectWork(items.filter(item => item.allowPaused || !store.state.paused && !store.state.draining), this.state(store).noticeClaims));
        const exclusivePending = selected.some(item => item && !item.slot);
        if (this.lane !== 'delivery') {
            for (let offset = 0; offset < projects.length; offset++) {
                const index = (this.cursor + offset) % projects.length;
                const { store, items } = projects[index], item = selected[index];
                if (!item || !canDispatch({ projectId: store.project.id, slot: item.slot }, this.capacity, exclusivePending))
                    continue;
                // Reserve synchronously before any await; duplicate ticks cannot claim the same slot.
                this.capacity.slots.set(store.project.id, { role: item.slot?.role, exclusive: !item.slot });
                return this.dispatch(store, items, item, () => this.capacity.slots.delete(store.project.id), () => { this.cursor = (index + 1) % projects.length; }) ?? undefined;
            }
            return;
        }
        const slottedWaiting = selected.some(item => item?.slot);
        const classes = slottedWaiting && (!exclusivePending || this.exclusiveStreak >= EXCLUSIVE_BOUND) ? [true, false] : [false, true];
        for (const slotted of classes) {
            // The second class is tried only on a lane the first left empty: occupied slots still drain toward a waiting exclusive.
            if (slotted !== classes[0] && this.capacity.slots.size)
                return;
            const start = slotted ? this.slottedCursor : this.cursor;
            for (let offset = 0; offset < projects.length; offset++) {
                const index = (start + offset) % projects.length;
                const { store, items } = projects[index], item = selected[index];
                // A slotted head is tried here only on its turn, with no exclusive selected, or after every exclusive
                // declined on an empty lane, so none of them is pending against it.
                if (!item || Boolean(item.slot) !== slotted || !canDispatch({ projectId: store.project.id, slot: item.slot }, this.capacity, false))
                    continue;
                // Reserve synchronously before any await; duplicate ticks cannot claim the same slot.
                this.capacity.slots.set(store.project.id, { role: item.slot?.role, exclusive: !item.slot });
                const started = this.dispatch(store, items, item, () => this.capacity.slots.delete(store.project.id), () => {
                    if (slotted) {
                        this.slottedCursor = (index + 1) % projects.length;
                        this.exclusiveStreak = 0;
                    }
                    else {
                        this.cursor = (index + 1) % projects.length;
                        this.exclusiveStreak = Math.min(EXCLUSIVE_BOUND, this.exclusiveStreak + 1);
                    }
                });
                // A declined or interrupted claim has released its slot; the next head of the class is tried.
                if (started)
                    return started;
            }
        }
    }
    /**
     * Claims synchronously. Returns null when the claim is declined or interrupted, its reservation already released,
     * and otherwise the running stage. `committed` runs once the claim holds, before the stage starts.
     */
    private dispatch(store: Store, items: ScheduledWork[], item: ScheduledWork, release: () => void, committed: () => void): Promise<void> | null {
        const scheduling = this.state(store);
        let claim: ReturnType<Store['claimWork']> = null;
        try {
            const expected = item.identity();
            // One transaction: the claim, the check that it may still run, and its queue timing. A failure in any
            // of them leaves no claim behind; a claim that may not run is kept as interrupted and not executed.
            claim = store.transaction(() => {
                const made = item.claimEligible && !item.claimEligible() ? null : store.claimWork(item.work, this.owner, item.stage, this.lane);
                if (!made) {
                    scheduling.undispatchedCycles++;
                    return null;
                }
                if ((!item.allowPaused && (store.state.paused || store.state.draining)) || item.identity() !== expected) {
                    store.finishClaim(made.id, 'interrupted');
                    return null;
                }
                const at = this.clock.now().toISOString();
                const observed = store.db.prepare('SELECT enqueued_at,ready_at FROM queue_observations WHERE work_key=? AND stage=?').get(workKey(item.work), item.stage) as {
                    enqueued_at: string;
                    ready_at: string;
                } | undefined;
                const timing: QueueTiming = { stage: item.stage, enqueuedAt: observed?.enqueued_at || item.enqueuedAt, readyAt: observed?.ready_at || at, claimedAt: at, queueMs: Math.max(0, Date.parse(at) - Date.parse(observed?.ready_at || at)) };
                if (item.saveTiming)
                    item.saveTiming(timing);
                else
                    item.timing?.push(timing);
                store.db.prepare('INSERT INTO queue_timings VALUES(?,?,?)').run(made.id, workKey(item.work), JSON.stringify(timing));
                store.db.prepare('DELETE FROM queue_observations WHERE work_key=? AND stage=?').run(workKey(item.work), item.stage);
                scheduling.lastClaimAt = at;
                scheduling.undispatchedCycles = 0;
                scheduling.noticeClaims = item.rank === 4 ? 0 : items.some(candidate => candidate.rank === 4 && candidate.eligibility.state === 'runnable') ? scheduling.noticeClaims + 1 : 0;
                store.emit('work-claimed', `${item.stage} claimed by the scheduler.`, undefined, item.work.id);
                return made;
            });
        }
        finally {
            // A claim that does not hold, or a transaction that failed, frees its reservation before anything else runs.
            if (!claim)
                release();
        }
        if (!claim)
            return null;
        committed();
        const held = claim;
        return (async () => {
            try {
                try {
                    await withAssignment(held, this.lane, () => item.execute());
                }
                finally {
                    store.transaction(() => {
                        item.afterStage?.();
                        if (!store.activeClaims().some(c => c.id === held.id && c.status === 'stopping')) store.finishClaim(held.id, 'completed');
                        scheduling.lastProgressAt = this.clock.now().toISOString();
                        store.save();
                    });
                }
            }
            finally {
                releaseOrRetain(store, held.id, release);
            }
        })();
    }
}
