import type { SchedulerState } from './work';
export interface ProjectReadiness {
    projectId: string;
    persistence: 'ready';
    ownershipObservedAt: string;
    ownershipFresh: boolean;
    providerAgeMs: number | null;
    runnable: number;
    blocked: number;
    waiting: number;
    running: number;
    stall: boolean;
    publishingBacklog: number;
    stopping: string[];
    scheduler?: SchedulerState;
    schedulerLanes?: Partial<Record<'cto' | 'it' | 'operations', SchedulerState>>;
}
