import { basename, isAbsolute, resolve } from 'node:path';
import { releaseDirectory } from './release-paths';
import { runningRelease, serviceConfiguration } from './service-plist';

/**
 * The service plist for another release of the same data root: the working directory, the entry script
 * and the release's own `node_modules/.bin` PATH entry move to the target; every other key is kept.
 * Pure. Refused when the current plist is not a release-shaped service with absolute paths or names
 * its release commit outside those three locations.
 */
export function renderPlist(current: unknown, targetCommit: string): Record<string, unknown> {
    const service = serviceConfiguration(current), running = runningRelease(service);
    if (running.kind !== 'release') throw new Error(`The service plist does not run a release: ${running.reason}`);
    if (!isAbsolute(service.dataRoot!) || !isAbsolute(service.workingDirectory!)) throw new Error('The service plist does not run a release: its data root and working directory must be absolute');
    const from = running.directory, to = releaseDirectory(service.dataRoot!, targetCommit);
    const plist = structuredClone(current) as Record<string, unknown>;
    const hasProgram = 'Program' in plist;
    const executable = hasProgram ? plist.Program : service.node;
    const absoluteNode = typeof executable === 'string' && isAbsolute(executable) && basename(executable) === 'node';
    if (!absoluteNode && (hasProgram || executable !== 'node')) throw new Error('The service plist does not run a release: its executable must be Node');

    const args = [...(plist.ProgramArguments as string[])], entryIndex = args.length - 1;
    const environment = { ...(plist.EnvironmentVariables as Record<string, string>) };
    const pathEntries = environment.PATH?.split(':') ?? [];
    const own = resolve(from, 'node_modules/.bin');
    const isOwnBin = (entry: string) => entry !== '' && resolve(from, entry) === own;
    const otherValues = {
        ...plist,
        WorkingDirectory: undefined,
        ProgramArguments: args.slice(0, entryIndex),
        EnvironmentVariables: { ...environment, PATH: pathEntries.filter(entry => !isOwnBin(entry)) },
    };
    if (JSON.stringify(otherValues).includes(running.commit)) throw new Error(`The service plist names release ${running.commit} in a value this deployment does not know how to move`);

    args[entryIndex] = resolve(to, 'server/index.ts');
    plist.ProgramArguments = args;
    plist.WorkingDirectory = to;
    if (environment.PATH !== undefined) {
        const targetBin = resolve(to, 'node_modules/.bin');
        environment.PATH = pathEntries.map(entry => isOwnBin(entry) ? targetBin : entry).join(':');
    }
    plist.EnvironmentVariables = environment;
    return plist;
}
