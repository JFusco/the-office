import { expect, test } from 'vitest';
import { deployPaths, operationPaths } from '../../../server/release/deploy-paths';
import { newOperationId, operationTime } from '../../../server/release/operation-id';

test('operation IDs are sortable, lower-case and valid journal IDs', () => {
    const id = newOperationId('deploy', new Date('2026-11-20T03:15:00.123Z'), () => '1a2b3c4d');
    expect(id).toBe('deploy-20261120t031500z-1a2b3c4d');
    expect(id).toMatch(/^[a-z0-9][a-z0-9-]{7,63}$/);
    expect(newOperationId('rollback')).toMatch(/^rollback-\d{8}t\d{6}z-[0-9a-f]{8}$/);
});

test('operations of every kind order by when they began', () => {
    const names = ['rollback-20261120t030000z-aaaaaaaa', 'deploy-20261121t030000z-bbbbbbbb', 'end-20261119t030000z-cccccccc'];
    expect(names.sort((a, b) => operationTime(a).localeCompare(operationTime(b)))).toEqual(['end-20261119t030000z-cccccccc', 'rollback-20261120t030000z-aaaaaaaa', 'deploy-20261121t030000z-bbbbbbbb']);
});

test('every deployment file sits under the data root, outside the releases folder', () => {
    const paths = deployPaths('/data'), files = operationPaths('/data', 'deploy-x');
    expect(paths).toEqual({ directory: '/data/deployments', pin: '/data/controller-pin.json', stop: '/data/deployments/STOP.json', controllerStore: '/data/deployments/controller.sqlite', controllerData: '/data/deployments/controller-data' });
    expect(Object.values(files).every(path => path.startsWith('/data/deployments/deploy-x.'))).toBe(true);
});
