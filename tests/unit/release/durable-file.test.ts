import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { writeDurable } from '../../../server/release/durable-file';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const root = () => { const dir = mkdtempSync(resolve(tmpdir(), 'office-deploy-files-')); roots.push(dir); return dir; };

test('a durable write replaces the file whole and leaves no draft behind', () => {
    const dataRoot = root(), path = resolve(dataRoot, 'nested/file.json');
    writeDurable(path, 'one'); writeDurable(path, 'two');
    expect(readFileSync(path, 'utf8')).toBe('two');
    expect(readdirSync(resolve(dataRoot, 'nested'))).toEqual(['file.json']);
});
