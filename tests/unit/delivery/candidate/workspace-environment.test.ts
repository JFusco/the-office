import { expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, renameSync, writeFileSync, existsSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { candidateWorkspaceEnvironment } from '../../../../server/delivery/candidate/workspace-environment';
import { command } from '../../../../server/workers/process';
import type { TicketJob } from '../../../../src/shared';

function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-workspace-boundary-'));
    const cwd = resolve(root, 'ticket-work', 'job', 'ci-repair', 'candidate'); mkdirSync(cwd, { recursive: true });
    const repair = { id: 'repair', worktree: cwd, head: 'a'.repeat(40), branch: 'renovate/test' };
    const job = { id: 'job', worktree: cwd, adoptedRepairCheckout: repair } as TicketJob;
    return { root, cwd, repair, job, close: () => rmSync(root, { recursive: true, force: true }) };
}
test('only saved private clones receive a canonical per-child workspace root', () => {
    const f = fixture(); try {
        expect(candidateWorkspaceEnvironment(f.root, f.job, f.cwd)).toEqual({ NPM_CONFIG_WORKSPACE_DIR: realpathSync(f.cwd) });
        expect(candidateWorkspaceEnvironment(f.root, undefined, f.cwd)).toBeUndefined();
        expect(candidateWorkspaceEnvironment(f.root, { ...f.job, adoptedRepairCheckout: undefined }, f.cwd)).toBeUndefined();
        expect(candidateWorkspaceEnvironment(f.root, f.job, f.root)).toBeUndefined();
        const ciJob = { ...f.job, adoptedRepairCheckout: undefined, ciRepairs: [f.repair] } as TicketJob;
        expect(candidateWorkspaceEnvironment(f.root, ciJob, f.cwd)).toEqual({ NPM_CONFIG_WORKSPACE_DIR: realpathSync(f.cwd) });
        f.repair.id = 'other'; expect(() => candidateWorkspaceEnvironment(f.root, f.job, f.cwd)).toThrow('path changed');
    } finally { f.close(); }
});
test('a changed directory or any symlink below the owned root refuses launch policy', () => {
    for (const part of ['ticket-work', 'ticket-work/job', 'ticket-work/job/ci-repair', 'ticket-work/job/ci-repair/candidate']) {
        const f = fixture(); try {
            const path = resolve(f.root, part), retained = path + '-retained'; renameSync(path, retained); symlinkSync(retained, path, 'dir');
            expect(() => candidateWorkspaceEnvironment(f.root, f.job, f.cwd), part).toThrow('owned directories');
        } finally { f.close(); }
    }
});
test('real offline pnpm installs keep standalone and nested project workspaces out of the Office ancestor', async () => {
    const pnpm = process.env.npm_execpath;
    expect(pnpm, 'Run through the documented pnpm test script so its actual pnpm executable is available').toBeTruthy();
    for (const ownWorkspace of [false, true]) {
        const f = fixture(); try {
            writeFileSync(resolve(f.root, 'package.json'), '{"name":"owned-office-parent","private":true}');
            writeFileSync(resolve(f.root, 'pnpm-workspace.yaml'), 'packages:\n  - ticket-work/**\n');
            writeFileSync(resolve(f.cwd, 'package.json'), '{"name":"owned-candidate","private":true}');
            let cwd = f.cwd;
            if (ownWorkspace) {
                writeFileSync(resolve(f.cwd, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
                cwd = resolve(f.cwd, 'packages', 'viewer'); mkdirSync(cwd, { recursive: true });
                writeFileSync(resolve(cwd, 'package.json'), '{"name":"owned-viewer","private":true}');
            }
            const args = [pnpm!, 'install', '--offline', '--ignore-scripts', '--lockfile-only', '--no-frozen-lockfile', '--store-dir', resolve(f.root, 'store')];
            if (!ownWorkspace) {
                await command(process.execPath, args, { cwd, env: { COREPACK_ENABLE_NETWORK: '0' }, timeout: 20000 });
                expect(existsSync(resolve(f.root, 'pnpm-lock.yaml')), 'control must reproduce ancestor discovery').toBe(true);
                rmSync(resolve(f.root, 'pnpm-lock.yaml'));
            }
            const env = { ...candidateWorkspaceEnvironment(f.root, f.job, f.cwd), COREPACK_ENABLE_NETWORK: '0' };
            await command(process.execPath, args, { cwd, env, timeout: 20000 });
            expect(existsSync(resolve(f.cwd, 'pnpm-lock.yaml'))).toBe(true);
            expect(existsSync(resolve(f.root, 'pnpm-lock.yaml'))).toBe(false);
            expect(existsSync(resolve(f.root, 'node_modules'))).toBe(false);
        } finally { f.close(); }
    }
});
