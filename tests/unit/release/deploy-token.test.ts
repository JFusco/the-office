import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { operationPaths } from '../../../server/release/deploy-paths';
import { createDeployToken, readDeployToken, removeDeployToken } from '../../../server/release/deploy-token';

const OP = 'deploy-20261120t030000z-0a0b0c0d';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const root = () => { const dir = mkdtempSync(resolve(tmpdir(), 'office-deploy-files-')); roots.push(dir); return dir; };

test('a fence token is created once, owner-only, reread on restart and removed on request', () => {
    const dataRoot = root(), token = createDeployToken(dataRoot, OP), path = operationPaths(dataRoot, OP).token;
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(createDeployToken(dataRoot, OP)).toBe(token);
    expect(readDeployToken(dataRoot, OP)).toBe(token);
    expect(statSync(path).mode & 0o777).toBe(0o600);
    writeFileSync(path, 'garbage');
    expect(() => readDeployToken(dataRoot, OP)).toThrow('unreadable');
    removeDeployToken(dataRoot, OP);
    expect(() => readDeployToken(dataRoot, OP)).toThrow('no saved fence token');
});
