import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { command } from '../workers/process';
import { releaseCommitOf } from './release-paths';

type Execute = typeof command;

export const SERVICE_LABEL = 'com.jfusco.living-office';
export const servicePlistPath = (home = homedir()) => resolve(home, 'Library/LaunchAgents', `${SERVICE_LABEL}.plist`);

const PlistSchema = z.object({
    Label: z.string(),
    ProgramArguments: z.array(z.string()).min(1),
    WorkingDirectory: z.string().optional(),
    EnvironmentVariables: z.record(z.string(), z.string()).optional(),
});

/** What launchd is configured to run: the source of truth for the running release, unlike active-release.json. */
export interface ServiceConfiguration { label: string; node: string; entry: string | null; workingDirectory: string | null; dataRoot: string | null }

/**
 * The script Node runs, for the two shapes the Office installs: `node SCRIPT` and `node --import tsx SCRIPT`.
 * Any other layout (other flags, or arguments after the script) is null rather than guessed.
 */
function scriptOf(args: string[]): string | null {
    const index = args[1] === '--import' && args[2] === 'tsx' ? 3 : 1;
    const script = args[index];
    return script && !script.startsWith('-') && args.length === index + 1 ? script : null;
}

export function serviceConfiguration(plist: unknown): ServiceConfiguration {
    const parsed = PlistSchema.parse(plist);
    return {
        label: parsed.Label, node: parsed.ProgramArguments[0], entry: scriptOf(parsed.ProgramArguments),
        workingDirectory: parsed.WorkingDirectory ?? null, dataRoot: parsed.EnvironmentVariables?.OFFICE_DATA_ROOT ?? null,
    };
}

export async function readServicePlist(execute: Execute, path = servicePlistPath()): Promise<ServiceConfiguration> {
    return serviceConfiguration(JSON.parse(await execute('plutil', ['-convert', 'json', '-o', '-', path], { readOnly: true, timeout: 30_000 })));
}

export type RunningRelease = { kind: 'release'; commit: string; directory: string } | { kind: 'not-a-release'; reason: string };

/**
 * A service runs a release only when it starts that release's own entry, from that release, under its own data root.
 * Everything comes from the plist; the caller's data root plays no part.
 */
export function runningRelease(service: ServiceConfiguration): RunningRelease {
    if (service.label !== SERVICE_LABEL) return { kind: 'not-a-release', reason: `service label is ${service.label}` };
    if (!service.workingDirectory) return { kind: 'not-a-release', reason: 'service has no working directory' };
    if (!service.dataRoot) return { kind: 'not-a-release', reason: 'service sets no OFFICE_DATA_ROOT' };
    const commit = releaseCommitOf(service.dataRoot, service.workingDirectory);
    if (!commit) return { kind: 'not-a-release', reason: `service runs from ${service.workingDirectory}, not a release directory of its data root ${service.dataRoot}` };
    if (!service.entry) return { kind: 'not-a-release', reason: 'service ProgramArguments are not node [--import tsx] SCRIPT' };
    // launchd resolves a relative entry against WorkingDirectory, not against whoever reads the plist.
    if (resolve(service.workingDirectory, service.entry) !== resolve(service.workingDirectory, 'server/index.ts')) return { kind: 'not-a-release', reason: `service entry ${service.entry} is outside its release` };
    return { kind: 'release', commit, directory: resolve(service.workingDirectory) };
}
