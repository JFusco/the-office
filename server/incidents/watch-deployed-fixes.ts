import type { ReleaseIdentity } from '../office/release-identity';
import type { command } from '../workers/process';
import { compareMemory, recordDeployedFixes, type DeployedFixes } from './deployed-fixes';
import type { IncidentLedger } from './incident-ledger';
import { redactEvidence } from './redact-evidence';

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

/**
 * One pass at a time of recordDeployedFixes for a timer to call. The answers GitHub gave are kept
 * between passes, so a release and a fix commit are compared once. A pass that is still reading
 * GitHub when the next is due is not joined by a second one. Never rejects: a failure is reported
 * with credentials removed and the next pass starts clean.
 */
export function watchDeployedFixes({ ledger, identity, loadedHash, execute, allowed, now = () => new Date(), report = console.error }: DeployedFixWatch): () => Promise<DeployedFixes | undefined> {
    const memory = compareMemory();
    let running = false;
    return async () => {
        if (running || !allowed()) return undefined;
        running = true;
        try { return await recordDeployedFixes({ ledger, identity, loadedHash, execute, now: now(), memory, allowed }); }
        catch (error) { report(redactEvidence(String(error)).slice(0, 500)); return undefined; }
        finally { running = false; }
    };
}
