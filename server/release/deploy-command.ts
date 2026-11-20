import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { DATA } from '../office/config';
import { command } from '../workers/process';
import { readControllerPin, writeControllerPin } from './controller-pin';
import { DeployFacts, RollbackFacts, type DeployOutcome } from './deploy-facts';
import { deployJournalPath, readDeployJournal } from './deploy-journal';
import { deployLockPath } from './deploy-lock';
import { readOutcome } from './deploy-outcome';
import { deployPaths, operationPaths } from './deploy-paths';
import { newOperationId, operationTime } from './operation-id';
import { readDeployStop, standingStop } from './deploy-stop';
import { launchController } from './launch-controller';
import { assertCommit } from './release-paths';

const USAGE = 'pnpm office deploy COMMIT [--idle-minutes N] | deploy status | deploy resume OPERATION | deploy end OPERATION | deploy pin COMMIT';
/** Beyond the idle wait: stop, backup, start and verification, with room to roll back. */
const MARGIN_MS = 30 * 60_000;

export interface DeployCommandOptions { execute?: typeof command; dataRoot?: string; log?: (line: string) => void; now?: () => Date }

function report(log: (line: string) => void, outcome: DeployOutcome): number {
    log(JSON.stringify(outcome, null, 2));
    return outcome.status === 'deployed' || outcome.status === 'ended' ? 0 : 1;
}

/** What `deploy status` shows: read from files only, so it answers while the service is down. */
function status(dataRoot: string) {
    const paths = deployPaths(dataRoot), lock = deployLockPath(dataRoot);
    const operations = new Set<string>();
    if (existsSync(paths.directory)) {
        for (const name of readdirSync(paths.directory)) {
            const match = /^([a-z0-9][a-z0-9-]{7,63})\.(?:jsonl|launch\.json|outcome\.json)$/.exec(name);
            if (match) operations.add(match[1]);
        }
    }
    const recent = [...operations].sort((a, b) => operationTime(a).localeCompare(operationTime(b))).slice(-5);
    return {
        pin: (() => { try { return readControllerPin(dataRoot); } catch (error) { return { error: String(error) }; } })(),
        stop: readDeployStop(dataRoot),
        lock: existsSync(lock) ? readFileSync(lock, 'utf8') : null,
        operations: recent.map(operation => {
            const path = operationPaths(dataRoot, operation).launch;
            const read = <T>(record: () => T) => {
                try { return record(); } catch (error) { return { error: String(error) }; }
            };
            const journal = read(() => existsSync(deployJournalPath(dataRoot, operation)) ? readDeployJournal(dataRoot, operation) : null);
            return {
                operation,
                ...(journal && ('error' in journal ? { error: journal.error } : { kind: journal.facts.kind, last: journal.last, torn: journal.torn })),
                launch: read(() => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null),
                outcome: read(() => readOutcome(dataRoot, operation)),
            };
        }),
    };
}

/** The pin an operation's journal fixed when it began; an operation keeps its controller for life. */
function controllerOf(dataRoot: string, operation: string): string | null {
    if (!existsSync(deployJournalPath(dataRoot, operation))) return null;
    const { facts } = readDeployJournal(dataRoot, operation), rolled = RollbackFacts.safeParse(facts);
    return DeployFacts.parse(rolled.success ? readDeployJournal(dataRoot, rolled.data.of).facts : facts).controller;
}

/**
 * `pnpm office deploy …`. Deploying, resuming and ending run in the pinned controller; this process
 * only launches it and reports. `pin` and removing a STOP record are a person's decisions. Returns
 * the exit code: zero only when the release was deployed or the fence was ended as asked.
 */
export async function deployCommand(args: string[], options: DeployCommandOptions = {}): Promise<number> {
    const { execute = command, dataRoot = DATA, log = console.log, now = () => new Date() } = options;
    const [verb, subject] = args, refuse = (reason: string) => { log(JSON.stringify({ status: 'refused', reason }, null, 2)); return 1; };
    try {
        if (verb === 'status') { log(JSON.stringify(status(dataRoot), null, 2)); return 0; }
        if (verb === 'pin') {
            if (!subject) return refuse('pin needs a full commit SHA');
            log(JSON.stringify({ pinned: writeControllerPin(dataRoot, assertCommit(subject), now) }, null, 2));
            return 0;
        }
        if (verb === 'end') {
            if (!subject) return refuse('end needs the operation whose fence to release');
            const controller = controllerOf(dataRoot, subject) ?? readControllerPin(dataRoot)?.commit;
            if (!controller) return refuse('No controller is pinned');
            const operation = newOperationId('end', now());
            return report(log, await launchController({ dataRoot, operation, controller, args: ['end', subject, '--operation', operation], timeoutMs: 5 * 60_000, execute, now, log }));
        }
        if (!verb) { log(USAGE); return 0; }
        const stop = standingStop(dataRoot);
        if (stop) return refuse(stop);
        const minutes = Number(args[args.indexOf('--idle-minutes') + 1]), idle = args.includes('--idle-minutes') ? minutes : 5;
        if (!Number.isFinite(idle) || idle <= 0 || idle > 240) return refuse('--idle-minutes takes a number of minutes from 1 to 240');
        const timeoutMs = idle * 60_000 + MARGIN_MS;
        if (verb === 'resume') {
            if (!subject) return refuse('resume needs an operation');
            const controller = controllerOf(dataRoot, subject);
            if (!controller) return refuse(`Deployment ${subject} has no journal to resume`);
            return report(log, await launchController({ dataRoot, operation: subject, controller, args: ['resume', subject, '--idle-minutes', String(idle)], timeoutMs, execute, now, log }));
        }
        const target = assertCommit(verb), pin = readControllerPin(dataRoot);
        if (!pin) return refuse('No controller is pinned. The first pin is set by hand after the bootstrap deploy: pnpm office deploy pin COMMIT');
        const operation = newOperationId('deploy', now());
        return report(log, await launchController({ dataRoot, operation, controller: pin.commit, args: ['deploy', target, '--operation', operation, '--controller', pin.commit, '--idle-minutes', String(idle)], timeoutMs, execute, now, log }));
    } catch (error) {
        return refuse(String(error instanceof Error ? error.message : error));
    }
}
