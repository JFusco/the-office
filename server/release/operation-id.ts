import { randomBytes } from 'node:crypto';

/** `deploy-20261120t031500z-1a2b3c4d`: sortable, and a valid journal operation ID. */
export function newOperationId(kind: 'deploy' | 'rollback' | 'end', now: Date = new Date(), random: () => string = () => randomBytes(4).toString('hex')): string {
    return `${kind}-${now.toISOString().replace(/\.\d+Z$/, 'z').replace(/[-:]/g, '').toLowerCase()}-${random()}`;
}

/** When an operation began, read from its ID; operations of every kind sort by it. */
export const operationTime = (operation: string) => operation.replace(/^[a-z]+-/, '');
