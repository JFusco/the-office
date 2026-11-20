import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { deployPaths } from './deploy-paths';
import { writeDurableIfAbsent } from './durable-file';

const Stop = z.object({
    version: z.literal(1), operation: z.string().min(1), at: z.iso.datetime(),
    /** The last step the journal recorded, or null when the controller never journaled one. */
    step: z.string().nullable(),
    reason: z.string().min(1), instruction: z.string().min(1),
}).strict();
export type DeployStop = z.infer<typeof Stop>;

/** The STOP record, or null. An unreadable record still stops: it is reported as its own reason. */
export function readDeployStop(dataRoot: string): DeployStop | null {
    const { stop } = deployPaths(dataRoot);
    try { return Stop.parse(JSON.parse(readFileSync(stop, 'utf8'))); }
    catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        return { version: 1, operation: 'unknown', at: new Date(0).toISOString(), step: null, reason: `The STOP record ${stop} is unreadable`, instruction: `Inspect ${stop} and the deployment journals beside it` };
    }
}

/**
 * Records that a deployment needs a person. The first record is kept: a later failure must not
 * overwrite the one that explains where things stopped. Only a person removes the file.
 */
export function writeDeployStop(dataRoot: string, stop: Omit<DeployStop, 'version' | 'at'>, now: () => Date = () => new Date()): DeployStop {
    const existing = readDeployStop(dataRoot);
    if (existing) return existing;
    const record = Stop.parse({ version: 1, at: now().toISOString(), ...stop, reason: stop.reason.slice(0, 2000) });
    const { stop: path } = deployPaths(dataRoot);
    while (!writeDurableIfAbsent(path, `${JSON.stringify(record, null, 2)}\n`)) {
        const winner = readDeployStop(dataRoot);
        if (winner) return winner;
        // A person cleared the winning record before it could be read.
    }
    return record;
}

/** Whether a STOP record refuses new deployments, with its own words. */
export function standingStop(dataRoot: string): string | null {
    const stop = readDeployStop(dataRoot);
    return stop ? `Deployment ${stop.operation} stopped for a person at ${stop.step ?? 'start-up'}: ${stop.reason} ${stop.instruction}` : null;
}
