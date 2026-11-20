import type { command } from '../workers/process';
import type { StoreDatabase } from './backup-stores';
import type { ControllerEffects } from './controller-effects';
import type { OfficeClient } from './service-http';

export interface DeployTimings {
    /** How long already-owned work may take to settle once the fence is held. */
    idleDeadlineMs: number; idleIntervalMs: number;
    /** How long the stopped service's process may take to exit. */
    stopDeadlineMs: number;
    /** How long a started release may take to answer `/api/health`. */
    startDeadlineMs: number;
    pollMs: number;
}
export const DEFAULT_TIMINGS: DeployTimings = { idleDeadlineMs: 5 * 60_000, idleIntervalMs: 5_000, stopDeadlineMs: 60_000, startDeadlineMs: 3 * 60_000, pollMs: 2_000 };

/** Everything a deployment touches, injected: no step reads Office configuration or the clock on its own. */
export interface DeployContext {
    dataRoot: string;
    execute: typeof command;
    office: OfficeClient;
    effects: ControllerEffects;
    /** The launchd plist the service is loaded from. */
    plistPath: string;
    domain: string;
    /** Every store database, the control database included. */
    databases: StoreDatabase[];
    /** The project databases, which keep an admission journal. */
    projects: StoreDatabase[];
    archives: string[];
    timings: DeployTimings;
    now: () => Date;
    sleep: (ms: number) => Promise<void>;
    alive: (pid: number) => boolean;
    /** Told each step transition. Throwing ends the controller there, as a crash would. */
    observe?: (event: { operation: string; step: string; phase: 'intended' | 'ran' | 'recorded'; state?: string }) => void;
}
