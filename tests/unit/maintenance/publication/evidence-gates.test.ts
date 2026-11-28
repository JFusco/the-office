import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { implementationChecked, qaChecked } from '../../../../server/maintenance/publication/evidence-gates';
import { retainCheckEvidence } from '../../../../server/maintenance/publication/retain-evidence';
afterEach(cleanupFakes);
const HEAD = 'a'.repeat(40), proposal = { issue: 5, branch: 'codex/5-x', head: HEAD, worktree: '/w', summary: '' };

test('a versioned step is gated on its retained copy; a historical step on its saved path in the run directory', () => {
    const f = fakeMaintenanceGitHub(), root = resolve(f.store.dataRoot, 'runs', 'r'); mkdirSync(root, { recursive: true });
    const run: any = { id: 'r', steps: [{}, { publicationVersion: 1 }] };
    const scratch = mkdtempSync(resolve(tmpdir(), 'office-gates-')); writeFileSync(resolve(scratch, 'qa.log'), 'ok'); writeFileSync(resolve(scratch, 'shot.png'), 'png');
    const group: any = { ctx: { store: f.store, run, at: () => 2 }, versioned: true, proposalStep: 1 };
    expect(implementationChecked(group, {} as any, proposal, root)).toBe(false);
    retainCheckEvidence(f.store, run, { step: 1, stage: 'browser-verification', workerId: 'w', issue: 5, branch: 'codex/5-x', head: HEAD, scratch, checks: [
        { path: resolve(scratch, 'qa.log'), commit: HEAD, summary: 's', kind: 'checks', url: '' }, { path: resolve(scratch, 'shot.png'), commit: HEAD, summary: 's', kind: 'screenshot', url: 'http://127.0.0.1/x' }] });
    expect(implementationChecked(group, {} as any, proposal, root)).toBe(true);
    expect(qaChecked(group, {} as any, proposal, root)).toEqual({ checks: true, browser: false });
    const legacy: any = { ctx: { store: f.store, run: { id: 'r', steps: [{}, {}] }, at: () => 2 }, versioned: false, proposalStep: 1 };
    writeFileSync(resolve(root, 'checks.txt'), 'ok');
    const built: any = { checks: [{ path: resolve(root, 'checks.txt'), commit: HEAD, kind: 'checks', url: '' }] };
    expect(implementationChecked(legacy, built, proposal, root)).toBe(true);
    expect(qaChecked(legacy, built, proposal, root)).toEqual({ checks: true, browser: false });
    expect(implementationChecked(legacy, { checks: [{ ...built.checks[0], commit: 'c'.repeat(40) }] } as any, proposal, root)).toBe(false);
});

test('a versioned gate passes only when every retained output of its step is intact; one broken copy fails it on first use and on replay', () => {
    const f = fakeMaintenanceGitHub(), root = resolve(f.store.dataRoot, 'runs', 'r'); mkdirSync(root, { recursive: true });
    const run: any = { id: 'r', steps: [{}, { publicationVersion: 1 }] };
    const scratch = mkdtempSync(resolve(tmpdir(), 'office-gates-')); writeFileSync(resolve(scratch, 'verify.log'), 'ok'); writeFileSync(resolve(scratch, 'packed.log'), 'ok');
    const group: any = { ctx: { store: f.store, run, at: () => 2 }, versioned: true, proposalStep: 1 };
    const evidence = retainCheckEvidence(f.store, run, { step: 1, stage: 'package-verification', workerId: 'w', issue: 5, branch: 'codex/5-x', head: HEAD, scratch, checks: [
        { path: resolve(scratch, 'verify.log'), commit: HEAD, summary: 'verify:ci', kind: 'checks', url: '' }, { path: resolve(scratch, 'packed.log'), commit: HEAD, summary: 'test:packed', kind: 'checks', url: '' }] });
    expect(implementationChecked(group, {} as any, proposal, root)).toBe(true);
    expect(qaChecked(group, {} as any, proposal, root).checks).toBe(true);
    writeFileSync(evidence.checks[1].path, 'changed');
    expect(implementationChecked(group, {} as any, proposal, root)).toBe(false);
    expect(qaChecked(group, {} as any, proposal, root).checks).toBe(false);
});
