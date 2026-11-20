import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { operationPaths } from './deploy-paths';
import { writeDurable } from './durable-file';

/**
 * The fence token of one deployment, kept in its own owner-only file so a restarted controller can
 * still release the fence. It is never written to the journal, an effect payload or a log.
 */
export function createDeployToken(dataRoot: string, operation: string): string {
    const { token: path } = operationPaths(dataRoot, operation);
    if (existsSync(path)) return readDeployToken(dataRoot, operation);
    const token = randomBytes(32).toString('hex');
    writeDurable(path, token, 0o600);
    return token;
}

export function readDeployToken(dataRoot: string, operation: string): string {
    const { token: path } = operationPaths(dataRoot, operation);
    if (!existsSync(path)) throw new Error(`Deployment ${operation} has no saved fence token at ${path}`);
    const token = readFileSync(path, 'utf8').trim();
    if (!/^[0-9a-f]{64}$/.test(token)) throw new Error(`The fence token of deployment ${operation} at ${path} is unreadable`);
    return token;
}

/** Removed only once the fence it opened is confirmed released. */
export const removeDeployToken = (dataRoot: string, operation: string) => rmSync(operationPaths(dataRoot, operation).token, { force: true });
