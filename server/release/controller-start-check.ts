import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { command } from '../workers/process';

/** What the controller entry imports before it runs anything: every module the controller loads at start-up. */
export const CONTROLLER_RUNTIME = 'server/release/controller-runtime.ts';
/** A load takes seconds; the bound only stops one that hangs. */
export const START_CHECK_TIMEOUT_MS = 2 * 60_000;
/**
 * Awaits the import and, when it throws, writes only the error's name and message: the runner keeps the tail
 * of a child's stderr, which a long stack would otherwise fill before the message is reached.
 */
const LOAD = 'try { await import(process.argv[1]); } catch (error) { process.stderr.write(`${error?.name ?? "Error"}: ${String(error?.message ?? error).slice(0, 1500)}\\n`); process.exitCode = 1; }';

export interface ControllerStartCheck {
    dataRoot: string;
    /** The release that would run the controller, already verified by `pinnedController`. */
    controller: string;
    directory: string;
    execute: typeof command;
    node?: string;
}

/**
 * Loads the controller's start-up modules from its release tree, with this data root, in a child that runs
 * nothing else: the launch's node, working directory and environment. That release's own checks run as its
 * modules load, `localBindings` reading the data root's `office-config.json` among them, so a configuration
 * it rejects fails here instead of killing the controller before it journals. The check depends on the
 * release keeping `CONTROLLER_RUNTIME` at that path, reading its configuration as it loads, and leaving
 * every deployment action inside `runController`; every release since the controller was added does. A
 * release without the file cannot pass. Returns null when the modules load, otherwise why the controller
 * cannot start.
 */
export async function controllerStartFailure(check: ControllerStartCheck): Promise<string | null> {
    const { dataRoot, controller, directory, execute } = check;
    try {
        await execute(check.node ?? process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', LOAD, pathToFileURL(resolve(directory, CONTROLLER_RUNTIME)).href], {
            cwd: directory, env: { OFFICE_DATA_ROOT: dataRoot }, timeout: START_CHECK_TIMEOUT_MS, readOnly: true,
        });
        return null;
    } catch (error) {
        const cause = String(error instanceof Error ? error.message : error).slice(0, 2000).trim();
        return `Controller release ${controller} failed to load its start-up modules with the configuration in ${resolve(dataRoot, 'office-config.json')}: ${cause}\nNothing was launched, and no launch record or STOP was written. Resolve this for controller ${controller}, then retry.`;
    }
}
