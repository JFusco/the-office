import type { command } from '../workers/process';
import { SERVICE_LABEL } from './service-plist';

type Execute = typeof command;

/** The per-user launchd domain the Office login service lives in. */
export const launchDomain = (uid: number = process.getuid!()) => `gui/${uid}`;

/**
 * Whether launchd has the service in the domain. Only launchd's own "Could not find service" answer
 * means it is absent; any other failure is inconclusive and thrown.
 */
export async function serviceLoaded(execute: Execute, domain: string): Promise<boolean> {
    try {
        await execute('launchctl', ['print', `${domain}/${SERVICE_LABEL}`], { readOnly: true, timeout: 30_000 });
        return true;
    } catch (error) {
        if (/Could not find service/.test(String(error))) return false;
        throw error;
    }
}

/** Removes the service from the domain, which stops it; `KeepAlive` restarts a service that is only signalled. */
export const bootout = (execute: Execute, domain: string) => execute('launchctl', ['bootout', `${domain}/${SERVICE_LABEL}`], { timeout: 60_000 });

/** Loads the plist into the domain; `RunAtLoad` starts it. */
export const bootstrap = (execute: Execute, domain: string, plist: string) => execute('launchctl', ['bootstrap', domain, plist], { timeout: 60_000 });
