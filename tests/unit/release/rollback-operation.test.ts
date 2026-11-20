import { expect, test } from 'vitest';
import { rollbackOperation } from '../../../server/release/rollback-operation';

test('a rollback is named after the deployment it undoes, and keeps its place in time order', () => {
    expect(rollbackOperation('deploy-20261120t030000z-0a0b0c0d')).toBe('rollback-20261120t030000z-0a0b0c0d');
    expect(rollbackOperation('deploy-20261120t030000z-0a0b0c0d')).toMatch(/^[a-z0-9][a-z0-9-]{7,63}$/);
});
