import { existsSync } from 'node:fs';
import type { command } from '../workers/process';
import { pinnedController } from './controller-pin';
import { DeployOutcome } from './deploy-facts';
import { deployJournalPath, readDeployJournal, type DeployJournalView } from './deploy-journal';
import { readOutcome } from './deploy-outcome';
import { operationPaths } from './deploy-paths';
import { writeDeployStop } from './deploy-stop';
import { writeDurable } from './durable-file';
import { rollbackOperation } from './rollback-operation';

export interface ControllerLaunch {
    dataRoot: string;
    /** The operation this launch runs or resumes; its journal names the step a dead controller reached. */
    operation: string;
    /** The pinned release whose tree runs the controller. */
    controller: string;
    /** Arguments for the controller entry. */
    args: string[];
    /** The controller's whole run is bounded; it is stopped when this passes. */
    timeoutMs: number;
    execute: typeof command;
    node?: string;
    now?: () => Date;
    log?: (line: string) => void;
}

/** The outcome a controller printed as its last line of output, or null. */
function printedOutcome(output: string): DeployOutcome | null {
    const last = output.trim().split('\n').at(-1) ?? '';
    try { return DeployOutcome.parse(JSON.parse(last)); } catch { return null; }
}

/**
 * Runs the deployment controller from the pinned release tree, never from the invoking checkout or
 * the target release. The launch is recorded before the controller is spawned. A controller that
 * cannot start, hangs, exits non-zero or ends without an outcome leaves a STOP record naming the
 * last journaled step; nothing is retried, and the fence and token it held are left as they are.
 */
export async function launchController(launch: ControllerLaunch): Promise<DeployOutcome> {
    const { dataRoot, operation, controller, args, execute, now = () => new Date() } = launch;
    const refused = (reason: string): DeployOutcome => ({ status: 'refused', operation, step: null, reason });
    let tree;
    try { tree = pinnedController(dataRoot, controller); }
    catch (error) { return refused(String(error instanceof Error ? error.message : error)); }
    const { launch: launchPath, outcome: outcomePath } = operationPaths(dataRoot, operation);
    writeDurable(launchPath, `${JSON.stringify({ operation, controller, args, at: now().toISOString(), launcher: process.pid }, null, 2)}\n`);
    let failure: string | undefined;
    try {
        const outcome = printedOutcome(await execute(launch.node ?? process.execPath, ['--import', 'tsx', tree.entry, ...args], { cwd: tree.directory, env: { OFFICE_DATA_ROOT: dataRoot }, timeout: launch.timeoutMs, onLine: launch.log }));
        if (outcome?.operation === operation) return outcome;
    } catch (error) { failure = `the controller did not finish: ${String(error instanceof Error ? error.message : error).slice(0, 1000)}`; }
    const saved = (() => {
        try {
            const outcome = readOutcome(dataRoot, operation);
            return outcome?.operation === operation ? outcome : null;
        } catch { return null; }
    })();
    if (!failure && saved) return saved;
    failure ??= 'the controller exited without reporting an outcome for this operation';

    const journalPath = deployJournalPath(dataRoot, operation), hasJournal = existsSync(journalPath);
    const undo = rollbackOperation(operation);
    let journal: DeployJournalView | undefined, rollback: DeployJournalView | undefined, unreadable = false;
    try {
        if (hasJournal) journal = readDeployJournal(dataRoot, operation);
        if (journal && existsSync(deployJournalPath(dataRoot, undo))) rollback = readDeployJournal(dataRoot, undo);
    } catch { unreadable = true; }
    const step = rollback?.last ? `${undo}:${rollback.last.step}` : journal?.last?.step ?? null;
    const status = 'Run pnpm office deploy status and confirm the controller is no longer running.';
    let instruction: string;
    if (args[0] === 'end' && args[1]) {
        instruction = `${status} Read ${launchPath} and check the fence for deployment ${args[1]}. If its fence is held or its outcome is unfinished, run pnpm office deploy end ${args[1]} once you have confirmed the service state. Clear STOP after settling the deployment.`;
    } else if (saved) {
        instruction = `${status} Read the saved outcome at ${outcomePath} and check the service and fence before clearing STOP. An operation with a saved outcome has ended.`;
    } else if (!hasJournal) {
        instruction = `${status} Read ${launchPath}, resolve the start-up failure, then clear STOP and retry the deployment command if the service is ready.`;
    } else if (unreadable || journal?.torn || rollback?.torn || journal?.facts.kind !== 'deploy' ||
               (rollback?.last && ['failed', 'uncertain'].includes(rollback.last.state))) {
        instruction = `${status} Inspect ${journalPath} and check the service and fence. Once the service is as intended, run pnpm office deploy end ${operation} and clear STOP.`;
    } else {
        instruction = `${status} Read ${journalPath}. If the deployment is still unfinished, clear STOP and run pnpm office deploy resume ${operation}. Any pending mutation is settled by read-back.`;
    }
    const stop = writeDeployStop(dataRoot, { operation, step, reason: failure, instruction }, now);
    return { status: 'stopped', operation, step, reason: stop.operation === operation ? failure : `${failure}; an earlier STOP for ${stop.operation} stands` };
}
