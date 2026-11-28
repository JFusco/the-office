import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { retainCheckEvidence, retainedChecks } from '../../../../server/maintenance/publication/retain-evidence';
import type { MaintenanceRun } from '../../../../src/shared';
afterEach(cleanupFakes);
const HEAD = 'a'.repeat(40), binding = { issue: 5, branch: 'codex/5-x', head: HEAD };

function setup() {
    const f = fakeMaintenanceGitHub(), scratch = mkdtempSync(resolve(tmpdir(), 'office-scratch-'));
    const run = { id: 'run-1', steps: [] } as unknown as MaintenanceRun;
    return { ...f, run, scratch, cleanupScratch: () => rmSync(scratch, { recursive: true, force: true }) };
}

test('scratch outputs are copied under the run before the yield, mapped to worker, candidate and head, and the result is untouched', () => {
    const f = setup(); writeFileSync(resolve(f.scratch, 'verify.log'), 'ok');
    const checks = [{ path: resolve(f.scratch, 'verify.log'), commit: HEAD, summary: 'verify:ci', kind: 'checks' as const, url: '' }], original = structuredClone(checks);
    const evidence = retainCheckEvidence(f.store, f.run, { step: 3, stage: 'proposal', workerId: 'w', ...binding, scratch: f.scratch, checks });
    expect(checks).toEqual(original);
    expect(evidence.checks[0].path.startsWith(resolve(f.store.dataRoot, 'runs', 'run-1', 'evidence', '3'))).toBe(true);
    expect(retainedChecks(f.store, f.run, 3, binding)).toHaveLength(1);
    // The retained copy, not the worker's original, is what replay reads.
    f.cleanupScratch();
    expect(retainedChecks(f.store, f.run, 3, binding)).toHaveLength(1);
    expect(retainedChecks(f.store, f.run, 3, { ...binding, head: 'c'.repeat(40) })).toEqual([]);
    writeFileSync(evidence.checks[0].path, 'changed');
    expect(retainedChecks(f.store, f.run, 3, binding)).toEqual([]);
});

test('an output outside the scratch, a symlink or a missing file is refused', () => {
    const f = setup(), outside = resolve(tmpdir(), `office-outside-${Date.now()}.log`); writeFileSync(outside, 'x');
    symlinkSync(outside, resolve(f.scratch, 'link.log'));
    const check = (path: string) => ({ path, commit: HEAD, summary: 's', kind: 'checks' as const, url: '' });
    expect(() => retainCheckEvidence(f.store, f.run, { step: 3, stage: 'proposal', workerId: 'w', ...binding, scratch: f.scratch, checks: [check(outside)] })).toThrow(/outside/);
    expect(() => retainCheckEvidence(f.store, f.run, { step: 4, stage: 'proposal', workerId: 'w', ...binding, scratch: f.scratch, checks: [check(resolve(f.scratch, 'link.log'))] })).toThrow(/regular file/);
    expect(() => retainCheckEvidence(f.store, f.run, { step: 5, stage: 'proposal', workerId: 'w', ...binding, scratch: f.scratch, checks: [check(resolve(f.scratch, 'none.log'))] })).toThrow(/regular file/);
    rmSync(outside); f.cleanupScratch();
});

test('two required outputs for one step are accepted only together: removing, changing or rebinding either one fails the whole step', () => {
    const retained = () => {
        const f = setup(); writeFileSync(resolve(f.scratch, 'verify.log'), 'ok'); writeFileSync(resolve(f.scratch, 'packed.log'), 'ok');
        const checks = [{ path: resolve(f.scratch, 'verify.log'), commit: HEAD, summary: 'verify:ci', kind: 'checks' as const, url: '' },
            { path: resolve(f.scratch, 'packed.log'), commit: HEAD, summary: 'test:packed', kind: 'checks' as const, url: '' }];
        const evidence = retainCheckEvidence(f.store, f.run, { step: 3, stage: 'proposal', workerId: 'w', ...binding, scratch: f.scratch, checks });
        f.cleanupScratch();
        return { f, evidence };
    };
    const intact = retained();
    expect(retainedChecks(intact.f.store, intact.f.run, 3, binding)).toHaveLength(2);
    // Replay reads the same two copies again.
    expect(retainedChecks(intact.f.store, intact.f.run, 3, binding)).toHaveLength(2);
    for (const index of [0, 1]) {
        const removed = retained(); rmSync(removed.evidence.checks[index].path);
        expect(retainedChecks(removed.f.store, removed.f.run, 3, binding), `removed ${index}`).toEqual([]);
        const changed = retained(); writeFileSync(changed.evidence.checks[index].path, 'changed');
        expect(retainedChecks(changed.f.store, changed.f.run, 3, binding), `changed ${index}`).toEqual([]);
        const rebound = retained(); rebound.evidence.checks[index].commit = 'c'.repeat(40);
        expect(retainedChecks(rebound.f.store, rebound.f.run, 3, binding), `other head ${index}`).toEqual([]);
    }
});
