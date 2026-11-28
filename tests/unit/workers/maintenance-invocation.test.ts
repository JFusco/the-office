import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, sep } from 'node:path';
import { maintenanceInvocation, templateFor } from '../../../server/workers/maintenance-invocation';
import { editorPolicy, readerPolicy, checksPolicy, policyId, DEFAULT_REGISTRY } from '../../../server/workers/maintenance-launch';
import { currentPin, LaunchQualificationRefusal } from '../../../server/workers/launch-qualification';
import { dataRoot, fakeEnvironment, install, passingRecord } from './qualification/support';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const roots = { officeData: '/office/data', home: '/home/joe' };
const SESSION = '0f8fad5b-d9cb-469f-a165-70867728950e';

test('readers have no shell for Claude and a non-escalating read-only shell for Codex; no auto reviewer anywhere', () => {
    const claude = templateFor('claude', { kind: 'reader' }, roots).arguments.join(' ');
    expect(claude).toContain('--tools Read,Glob,Grep --allowedTools Read,Glob,Grep');
    expect(claude).toContain('--permission-mode plan --permission-prompts none');
    expect(claude).not.toMatch(/Bash|WebFetch|--add-dir/);
    const codex = templateFor('codex', { kind: 'reader' }, roots).arguments.join(' ');
    expect(codex).toContain('--sandbox read-only');
    expect(codex).toContain('approval_policy="never"');
    expect(codex).toContain('--ignore-user-config --ignore-rules');
    expect(codex).not.toMatch(/auto_review|on-request|--approve-for-me/);
    const checks = templateFor('codex', { kind: 'checks', browser: false }, roots).settings as Record<string, unknown>;
    expect(checks['sandbox_workspace_write.network_access']).toBe(false);
    expect((templateFor('codex', { kind: 'checks', browser: true }, roots).settings as Record<string, unknown>)['sandbox_workspace_write.network_access']).toBe(true);
});

test('the editor runs in its worktree with a fail-closed sandbox, the registry only, and protected Git and Office paths', () => {
    const template = templateFor('claude', { kind: 'editor', registry: ['registry.npmjs.org:443'] }, roots), settings = template.settings as any;
    expect(template.tools).toEqual(['Read', 'Glob', 'Grep', 'Bash']);
    expect(settings.sandbox).toMatchObject({ enabled: true, failIfUnavailable: true, allowUnsandboxedCommands: false, excludedCommands: [], network: { strictAllowlist: true, allowedDomains: ['registry.npmjs.org'] } });
    expect(settings.sandbox.filesystem.allowWrite).toEqual(['{cwd}', '{scratch}', '{gitDir}', '{gitCommonDir}/objects', '{gitCommonDir}/{branchRef}', '{gitCommonDir}/{branchRef}.lock', '{gitCommonDir}/logs/{branchRef}']);
    expect(settings.sandbox.filesystem.denyWrite).toEqual(expect.arrayContaining(['/office/data', '{gitCommonDir}/config', '{gitCommonDir}/hooks']));
    // A denial of the whole worktrees directory would cover the editor's own {gitDir}; writes are allow-only instead.
    expect(settings.sandbox.filesystem.denyWrite).not.toContain('{gitCommonDir}/worktrees');
    expect(template.arguments.join(' ')).not.toContain('--add-dir');
});

test('with the harness bindings written in, the editor can write its own linked-worktree Git files and no denial covers an allowed path; other worktrees stay unwritable', () => {
    const root = dataRoot(cleanup), common = resolve(root, 'repo', '.git'), gitDir = resolve(common, 'worktrees', '1-x');
    mkdirSync(gitDir, { recursive: true });
    const worktree = mkdtempSync(resolve(tmpdir(), 'office-candidate-')), scratch = mkdtempSync(resolve(tmpdir(), 'office-editor-scratch-'));
    cleanup.push(() => { rmSync(worktree, { recursive: true, force: true }); rmSync(scratch, { recursive: true, force: true }); });
    const schemaPath = resolve(root, 'schema.json'); writeFileSync(schemaPath, '{"type":"object"}');
    install(root, passingRecord(templateFor('claude', { kind: 'editor', registry: DEFAULT_REGISTRY }, roots), ['proposal']), 'claude-editor');
    const invocation = maintenanceInvocation({ dataRoot: root, stage: 'proposal', provider: 'claude', policy: editorPolicy({ worktree, branch: 'codex/1-x', gitDir, gitCommonDir: common }),
        session: SESSION, schema: '{"type":"object"}', schemaPath, scratch, roots, environment: fakeEnvironment() });
    const { allowWrite, denyWrite } = JSON.parse(invocation.args[invocation.args.indexOf('--settings') + 1]).sandbox.filesystem as { allowWrite: string[]; denyWrite: string[] };
    const covers = (parent: string, path: string) => path === parent || path.startsWith(`${parent}${sep}`);
    expect(allowWrite).toContain(gitDir);
    expect(denyWrite).toEqual(expect.arrayContaining([
        resolve(gitDir, 'commondir'), resolve(gitDir, 'gitdir'), resolve(gitDir, 'config.worktree'), resolve(worktree, '.git'),
    ]));
    for (const denied of denyWrite) {
        expect(covers(denied, gitDir), `${denied} covers the bound gitDir`).toBe(false);
        for (const allowed of allowWrite) expect(covers(denied, allowed), `${denied} covers ${allowed}`).toBe(false);
    }
    // What a local commit with hooks writes: the worktree's index, HEAD, reflog and ORIG_HEAD, the shared objects and the owned branch.
    for (const path of [...['index', 'HEAD', 'logs/HEAD', 'ORIG_HEAD'].map(name => resolve(gitDir, name)), resolve(common, 'objects', 'ab', 'cdef'),
        resolve(common, 'refs/heads/codex/1-x'), resolve(common, 'refs/heads/codex/1-x.lock'), resolve(common, 'logs/refs/heads/codex/1-x')])
        expect(allowWrite.some(allowed => covers(allowed, path)) && !denyWrite.some(denied => covers(denied, path)), path).toBe(true);
    // Another worktree's administrative files, other refs, Git configuration and hooks are not writable.
    for (const path of [resolve(common, 'worktrees', '2-other', 'index'), resolve(common, 'worktrees', '1-x-other', 'HEAD'), resolve(common, 'refs/heads/main'), resolve(common, 'config'), resolve(common, 'hooks', 'pre-push')])
        expect(allowWrite.some(allowed => covers(allowed, path)), path).toBe(false);
});

test('the invocation selects the exact pin, binds fresh harness values and needs a matching record', () => {
    const root = dataRoot(cleanup), schemaPath = resolve(root, 'schema.json');
    writeFileSync(schemaPath, '{"type":"object"}');
    const input = { dataRoot: root, stage: 'draft-pr', provider: 'claude' as const, policy: readerPolicy('/repo'), session: SESSION, schema: '{"type":"object"}', schemaPath, roots, environment: fakeEnvironment() };
    expect(() => maintenanceInvocation(input)).toThrow(LaunchQualificationRefusal);
    install(root, passingRecord(templateFor('claude', { kind: 'reader' }, roots), ['draft-pr']), policyId('claude', { kind: 'reader' }));
    const invocation = maintenanceInvocation(input);
    expect(invocation).toMatchObject({ program: 'claude', executablePath: currentPin('claude').path, spawnCwd: '/repo', policyId: 'claude-reader' });
    expect(invocation.args).toContain(SESSION);
    expect(invocation.args[invocation.args.indexOf('--json-schema') + 1]).toBe('{"type":"object"}');
    expect(() => maintenanceInvocation({ ...input, schema: '{"type":"string"}' })).toThrow(/inline schema/);
});

test('an editor or checks launch needs its own fresh private scratch outside Office data and the checkout', () => {
    const root = dataRoot(cleanup), worktree = mkdtempSync(resolve(tmpdir(), 'office-candidate-')); cleanup.push(() => rmSync(worktree, { recursive: true, force: true }));
    const candidate = { worktree, branch: 'codex/1-x', gitDir: resolve(root, 'common/worktrees/x'), gitCommonDir: resolve(root, 'common') };
    const base = { dataRoot: root, stage: 'proposal', provider: 'claude' as const, session: SESSION, schema: '{}', schemaPath: resolve(root, 'schema.json'), roots, environment: fakeEnvironment() };
    expect(() => maintenanceInvocation({ ...base, policy: editorPolicy(candidate) })).toThrow(/private scratch/);
    const used = resolve(root, 'scratch'); mkdirSync(used, { mode: 0o700 }); writeFileSync(resolve(used, 'old'), 'x');
    expect(() => maintenanceInvocation({ ...base, policy: editorPolicy(candidate), scratch: used })).toThrow(/fresh private/);
    const inside = resolve(worktree, 'scratch'); mkdirSync(inside, { mode: 0o700 });
    expect(() => maintenanceInvocation({ ...base, policy: checksPolicy(candidate, false), provider: 'codex', route: { model: 'm', effort: 'high' }, scratch: inside })).toThrow(/outside Office data and the checkout/);
});
