import { afterEach, expect, test } from 'vitest';
import { lstatSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { allocateScratch, stageLaunch } from '../../../../server/maintenance/publication/versioned-launch';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const binding = { worktree: '/w', branch: 'codex/1-x', gitDir: '/r/.git/worktrees/x', gitCommonDir: '/r/.git' };

test('each weekly stage and Brain diagnosis selects its explicit policy; content calls are read-only', () => {
    const root = resolve(tmpdir(), `office-scratch-root-${Date.now()}`); roots.push(root);
    expect(stageLaunch('vendor-review', '/repo')).toEqual({ policy: { version: 1, kind: 'reader', cwd: '/repo' }, readOnly: true });
    expect(stageLaunch('maintenance-blocker', '/repo').policy.kind).toBe('reader');
    expect(stageLaunch('proposal-plan', '/repo').policy.cwd).toBe('/repo');
    expect(stageLaunch('proposal-plan', '/repo', binding).policy.cwd).toBe('/w');
    expect(stageLaunch('draft-pr', '/repo', binding)).toMatchObject({ policy: { kind: 'reader', cwd: '/w' }, readOnly: true });
    const editor = stageLaunch('proposal', '/repo', binding, false, root);
    expect(editor).toMatchObject({ policy: { kind: 'editor', cwd: '/w', candidate: binding }, readOnly: false });
    const qa = stageLaunch('browser-verification', '/repo', binding, true, root);
    expect(qa.policy).toMatchObject({ kind: 'checks', browser: true });
    expect(readdirSync(root)).toHaveLength(2);
    expect(lstatSync(editor.scratch!).mode & 0o077).toBe(0);
    expect(() => stageLaunch('draft-pr', '/repo')).toThrow(/owned candidate/);
    expect(() => stageLaunch('follow-up', '/repo')).toThrow(/No #612 launch policy/);
});

test('scratch is fresh per assignment', () => {
    const root = resolve(tmpdir(), `office-scratch-root-${Date.now()}-b`); roots.push(root);
    expect(allocateScratch(root)).not.toBe(allocateScratch(root));
});
