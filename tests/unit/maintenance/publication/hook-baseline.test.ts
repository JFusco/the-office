import { afterEach, expect, test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { command } from '../../../../server/workers/process';
import { assertPushHooksUnchanged, pushHookBaseline } from '../../../../server/maintenance/publication/hook-baseline';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function repo() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-hooks-')); roots.push(root);
    execFileSync('git', ['init', '-q', root]); execFileSync('git', ['remote', 'add', 'origin', 'https://github.com/JFusco/cms-field-vocabulary.git'], { cwd: root });
    return root;
}

test('an unchanged destination, hook path and chain pass; an edited hook or a delegate the chain cannot establish refuse the push', async () => {
    const root = repo(), baseline = await pushHookBaseline(command, root);
    expect(baseline.destinations).toEqual(['https://github.com/JFusco/cms-field-vocabulary.git']);
    await expect(assertPushHooksUnchanged(command, root, baseline)).resolves.toBeUndefined();
    mkdirSync(resolve(root, '.git/hooks'), { recursive: true });
    writeFileSync(resolve(root, '.git/hooks/pre-push'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
    await expect(assertPushHooksUnchanged(command, root, baseline)).rejects.toThrow(/hook chain changed/);
    writeFileSync(resolve(root, '.git/hooks/pre-push'), '#!/bin/sh\npnpm run verify:ci || exit $?\n', { mode: 0o755 });
    await expect(assertPushHooksUnchanged(command, root, baseline)).rejects.toThrow(/cannot be established/);
    await expect(pushHookBaseline(command, root)).rejects.toThrow(/cutover blocker/);
});

test('a changed hook path or an added push destination refuses the push', async () => {
    const root = repo(), baseline = await pushHookBaseline(command, root);
    execFileSync('git', ['config', 'core.hooksPath', '.husky/_'], { cwd: root });
    await expect(assertPushHooksUnchanged(command, root, baseline)).rejects.toThrow(/hook path changed/);
    execFileSync('git', ['config', '--unset', 'core.hooksPath'], { cwd: root });
    execFileSync('git', ['remote', 'set-url', '--add', '--push', 'origin', 'https://github.com/someone/else.git'], { cwd: root });
    await expect(assertPushHooksUnchanged(command, root, baseline)).rejects.toThrow(/destination changed/);
});
