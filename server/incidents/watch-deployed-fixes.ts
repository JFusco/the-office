import type { ReleaseIdentity } from '../office/release-identity';
import type { command } from '../workers/process';
import { compareMemory, COMPARES_PER_PASS, recordDeployedFixes, type DeployedFixes } from './deployed-fixes';
import type { IncidentLedger } from './incident-ledger';
import { redactEvidence } from './redact-evidence';
import { recordWithdrawnFixes } from './withdrawn-fixes';

export interface DeployedFixWatch {
    ledger: IncidentLedger;
    /** Read fresh whenever it is needed: the identity changes when a deployment records its activation. */
    identity: () => ReleaseIdentity;
    loadedHash: string;
    execute: typeof command;
    allowed: () => boolean;
    now?: () => Date;
    report?: (message: string) => void;
}

/** What one pass did: the fixes it recognised in the running release, and the incidents it returned to `shipped`. */
export type DeployedFixPass = DeployedFixes & { withdrawn: string[] };

/**
 * One pass at a time for a timer to call: first recordWithdrawnFixes, so no incident is left
 * `deployed` for a release that does not hold its fix, then recordDeployedFixes. Both share the
 * definitive answers between ticks, failed comparisons within a tick, and the tick's read limit.
 * If withdrawals use every read and leave arrivals waiting, the next tick sets aside one read
 * for arrivals. Ticks do not overlap. Failures are reported with credentials removed, and the
 * next tick can run as usual.
 */
export function watchDeployedFixes({ ledger, identity, loadedHash, execute, allowed, now = () => new Date(), report = console.error }: DeployedFixWatch): () => Promise<DeployedFixPass | undefined> {
    const memory = compareMemory();
    let running = false, reserveArrivalRead = false;
    return async () => {
        if (running || !allowed()) return undefined;
        running = true;
        try {
            const comparison = { ledger, identity, execute, memory, allowed, failed: new Set<string>() };
            const withdrawalLimit = reserveArrivalRead ? COMPARES_PER_PASS - 1 : COMPARES_PER_PASS;
            const withdrawn = await recordWithdrawnFixes({ ...comparison, now: now(), limit: withdrawalLimit });
            // The fence, once taken, ends the tick: the second pass asks GitHub before it asks whether it may.
            if (!allowed()) return { deployed: [], unknown: [], absent: [], waiting: [], withdrawn: withdrawn.withdrawn };
            const arrivals = await recordDeployedFixes({ ...comparison, loadedHash, now: now(), limit: COMPARES_PER_PASS - withdrawn.reads });
            reserveArrivalRead = withdrawn.reads === COMPARES_PER_PASS && arrivals.waiting.length > 0;
            return { ...arrivals, withdrawn: withdrawn.withdrawn };
        }
        catch (error) { report(redactEvidence(String(error)).slice(0, 500)); return undefined; }
        finally { running = false; }
    };
}
