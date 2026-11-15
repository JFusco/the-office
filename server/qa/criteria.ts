import { createHash } from 'node:crypto';

/** A reference binds the saved requirement, not the worker's prose or candidate revision. */
export function qaCriteria(checks: readonly string[] = []): { id: string; check: string }[] {
    return checks.map(check => ({ id: `AC-${createHash('sha256').update(check).digest('hex').slice(0, 16)}`, check }));
}
