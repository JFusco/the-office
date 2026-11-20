import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { deployPaths } from './deploy-paths';
import { writeDurable } from './durable-file';
import { verifyRelease } from './release-manifest';
import { releaseDirectory } from './release-paths';

const Pin = z.object({ version: z.literal(1), commit: z.string().regex(/^[0-9a-f]{40}$/), pinnedAt: z.iso.datetime() }).strict();
export type ControllerPin = z.infer<typeof Pin>;

export const CONTROLLER_ENTRY = 'server/release/controller-entry.ts';

/** The pinned controller release, or null when no pin was ever set. A malformed pin throws. */
export function readControllerPin(dataRoot: string): ControllerPin | null {
    const { pin } = deployPaths(dataRoot);
    return existsSync(pin) ? Pin.parse(JSON.parse(readFileSync(pin, 'utf8'))) : null;
}

/**
 * The release tree a deployment's controller runs from. It must still verify against its manifest and
 * hold a controller entry: a pinned tree that changed, or predates the controller, runs nothing.
 */
export function pinnedController(dataRoot: string, commit: string): { directory: string; entry: string } {
    const directory = releaseDirectory(dataRoot, commit), verification = existsSync(directory) ? verifyRelease(directory, commit) : null;
    if (verification?.status !== 'verified') throw new Error(`Controller release ${commit} is ${verification ? verification.status : 'missing'}; it cannot run a deployment`);
    const entry = resolve(directory, CONTROLLER_ENTRY);
    if (!existsSync(entry)) throw new Error(`Controller release ${commit} has no ${CONTROLLER_ENTRY}`);
    return { directory, entry };
}

/** Pins a verified release as the controller for later deployments. A person's decision; no deployment calls it. */
export function writeControllerPin(dataRoot: string, commit: string, now: () => Date = () => new Date()): ControllerPin {
    pinnedController(dataRoot, commit);
    const pin = Pin.parse({ version: 1, commit, pinnedAt: now().toISOString() });
    writeDurable(deployPaths(dataRoot).pin, `${JSON.stringify(pin, null, 2)}\n`);
    return pin;
}
