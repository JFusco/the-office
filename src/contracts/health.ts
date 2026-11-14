import type { BlockedCause, SchedulerState } from './work';
export interface ProjectReadiness {
    projectId: string;
    persistence: 'ready';
    ownershipObservedAt: string;
    ownershipFresh: boolean;
    providerAgeMs: number | null;
    runnable: number;
    blocked: number;
    /** `blocked` split by cause, so failed history never reads as work waiting on someone. */
    blockedCauses?: Record<BlockedCause, number>;
    waiting: number;
    running: number;
    stall: boolean;
    publishingBacklog: number;
    stopping: string[];
    scheduler?: SchedulerState;
    schedulerLanes?: Partial<Record<'cto' | 'it' | 'operations', SchedulerState>>;
}
