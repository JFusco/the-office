import { randomUUID } from 'node:crypto';
import type { ProgressionItem, QueueTiming, ExecutionLane } from '../../src/shared';
import { withAssignment } from '../workers/assignment-context';
import { workKey } from '../../src/shared';
import type { Store } from '../store/store';
import type { OfficeCapacity } from '../office/projects';
import type { Clock } from '../office/clock';
import { systemClock } from '../office/clock';
export interface ScheduledWork extends ProgressionItem {
    store: Store;
    allowPaused?: boolean;
    execute(): Promise<unknown>;
    timing?: QueueTiming[];
    saveTiming?(timing: QueueTiming): void;
    afterStage?(): void;
    identity(): string;
}
/** Selection is pure; provider observations never run while traversing a queue. */
export function selectWork(items: ScheduledWork[], noticesSince: number): ScheduledWork | undefined {
    const eligible = items.filter(item => item.eligibility.state === 'runnable');
    const notice = eligible.filter(item => item.rank === 4).sort(fifo)[0];
    return notice && noticesSince >= 3 ? notice : eligible.sort((a, b) => a.rank - b.rank || fifo(a, b))[0];
}
// Stable sort retains durable insertion order when enqueue timestamps tie.
const fifo = (a: ProgressionItem, b: ProgressionItem) => a.enqueuedAt.localeCompare(b.enqueuedAt);
export class Scheduler {
    private owner = randomUUID();
    private running = false;
    private cursor = 0;
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
        if (!this.running && !this.capacity.active.size && this.capacity.lane)
            for (const { store, items } of projects)
                if (items.some(item => item.eligibility.state === 'runnable')) {
                    const state = this.state(store);
                    state.undispatchedCycles++;
                    if (state.undispatchedCycles === 2)
                        store.emit('scheduler-stalled', 'Runnable work remained undispatched across two free-worker cycles; inspect the retained lane owner.', 'pm');
                    else
                        store.save();
                }
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
            let claim: ReturnType<Store['claimWork']>;
            try {
                const expected = item.identity();
                claim = store.claimWork(item.work, this.owner, item.stage, this.lane);
                if (!claim) {
                    scheduling.undispatchedCycles++;
                    store.save();
                    return;
                }
                if ((!item.allowPaused && (store.state.paused || store.state.draining)) || item.identity() !== expected) {
                    store.finishClaim(claim.id, 'interrupted');
                    return;
                }
                const at = this.clock.now().toISOString();
                store.transaction(() => {
                    const observed = store.db.prepare('SELECT enqueued_at,ready_at FROM queue_observations WHERE work_key=? AND stage=?').get(workKey(item.work), item.stage) as {
                        enqueued_at: string;
                        ready_at: string;
                    } | undefined;
                    const timing: QueueTiming = { stage: item.stage, enqueuedAt: observed?.enqueued_at || item.enqueuedAt, readyAt: observed?.ready_at || at, claimedAt: at, queueMs: Math.max(0, Date.parse(at) - Date.parse(observed?.ready_at || at)) };
                    if (item.saveTiming)
                        item.saveTiming(timing);
                    else
                        item.timing?.push(timing);
                    store.db.prepare('INSERT INTO queue_timings VALUES(?,?,?)').run(claim!.id, workKey(item.work), JSON.stringify(timing));
                    store.db.prepare('DELETE FROM queue_observations WHERE work_key=? AND stage=?').run(workKey(item.work), item.stage);
                    scheduling.lastClaimAt = at;
                    scheduling.undispatchedCycles = 0;
                    scheduling.noticeClaims = item.rank === 4 ? 0 : items.some(candidate => candidate.rank === 4 && candidate.eligibility.state === 'runnable') ? scheduling.noticeClaims + 1 : 0;
                    store.emit('work-claimed', `${item.stage} claimed by the scheduler.`, undefined, item.work.id);
                });
                this.cursor = (index + 1) % projects.length;
                try {
                    await withAssignment(claim, this.lane, () => item.execute());
                }
                finally {
                    store.transaction(() => {
                        item.afterStage?.();
                        store.finishClaim(claim!.id, 'completed');
                        scheduling.lastProgressAt = this.clock.now().toISOString();
                        store.save();
                    });
                }
            }
            finally {
                // Worker promises settle only after confirmed process termination.
                if (this.capacity.lane === store.project.id)
                    this.capacity.lane = '';
                this.running = false;
            }
            return;
        }
    }
}
