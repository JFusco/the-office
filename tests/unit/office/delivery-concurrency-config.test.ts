import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { localBindings } from '../../../server/office/local-config';

const roots: string[] = [];
afterEach(() => { vi.unstubAllEnvs(); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

test('delivery concurrency is optional and bounded to whole numbers from 1 to 3', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-concurrency-config-')); roots.push(root);
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const write = (config: unknown) => writeFileSync(resolve(root, 'office-config.json'), JSON.stringify(config));
    write({}); expect(localBindings(root).delivery).toBeUndefined();
    write({ delivery: {} }); expect(localBindings(root).delivery).toEqual({});
    for (const concurrency of [1, 2, 3]) { write({ delivery: { concurrency } }); expect(localBindings(root).delivery?.concurrency).toBe(concurrency); }
    for (const concurrency of [0, 4, 1.5, '2', -1]) { write({ delivery: { concurrency } }); expect(() => localBindings(root)).toThrow('Delivery concurrency'); }
    write({ delivery: null }); expect(() => localBindings(root)).toThrow('Delivery concurrency');
});
