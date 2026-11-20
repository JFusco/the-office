import { expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const entry = resolve(__dirname, '../../../server/release/controller-entry.ts');

test('the controller entry refuses to run without a data root, before loading any Office module', () => {
    const { OFFICE_DATA_ROOT: _, ...env } = process.env;
    const result = spawnSync(process.execPath, ['--import', 'tsx', entry, 'deploy', 'a'.repeat(40)], { env, encoding: 'utf8', timeout: 60_000 });
    expect(result.status).toBe(2);
    expect(result.stderr).toContain('needs OFFICE_DATA_ROOT');
    expect(result.stdout).toBe('');
});

test('the entry has no static import, so nothing reads configuration before the data root is checked', () => {
    expect(readFileSync(entry, 'utf8')).not.toMatch(/^import /m);
});
