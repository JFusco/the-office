import { existsSync, readFileSync } from 'node:fs';
import type { DeployContext } from './deploy-context';
import { DeployOutcome } from './deploy-facts';
import { deployJournalPath } from './deploy-journal';
import { operationPaths } from './deploy-paths';
import { writeDeployStop } from './deploy-stop';
import { writeDurable } from './durable-file';

const instruction = (operation: string, dataRoot: string) => `Read ${deployJournalPath(dataRoot, operation)} and pnpm office deploy status. Check what launchd runs (pnpm office release current) and GET /api/deployment-fence. When the service is as you want it, release this deployment's fence with pnpm office deploy end ${operation}, then remove the STOP record.`;

/** The saved outcome of an operation, or null while it has none: still running, or its controller died. */
export function readOutcome(dataRoot: string, operation: string): DeployOutcome | null {
    const path = operationPaths(dataRoot, operation).outcome;
    return existsSync(path) ? DeployOutcome.parse(JSON.parse(readFileSync(path, 'utf8'))) : null;
}

/**
 * Saves how an operation ended. `stopped` writes the STOP record first, so a controller that dies
 * between the two writes leaves the record that refuses further deployments, not a bare outcome.
 */
export function concludeOperation(ctx: Pick<DeployContext, 'dataRoot' | 'now'>, outcome: DeployOutcome): DeployOutcome {
    if (outcome.status === 'stopped') writeDeployStop(ctx.dataRoot, { operation: outcome.operation, step: outcome.step, reason: outcome.reason, instruction: instruction(outcome.operation, ctx.dataRoot) }, ctx.now);
    writeDurable(operationPaths(ctx.dataRoot, outcome.operation).outcome, `${JSON.stringify(DeployOutcome.parse(outcome), null, 2)}\n`);
    return outcome;
}
