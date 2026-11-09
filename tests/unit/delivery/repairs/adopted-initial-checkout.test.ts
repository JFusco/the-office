import { test, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ciFixture } from '../../../fixtures/ci-repair';
import { trackAdoptedReview } from '../../../../server/delivery/readiness/track-adopted-review';

test.each(['clone', 'config', 'user-file', 'index', 'advanced-head'])('a real initial checkout reconciles %s without replaying clone or losing work', async phase => {
    const f = ciFixture(), origin = resolve(f.root, 'origin.git');
    const env = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_COUNT: '0' };
    const git = (cwd: string, args: string[], input?: string) => execFileSync('git', args, { cwd, env, input, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    // Real objects/refs through fast-import keep the fixture lean without weakening the 30s limit.
    git(f.root, ['init', '--bare', '--initial-branch=main', origin]);
    const blob = (mark: number, value: string) => `blob\nmark :${mark}\ndata ${Buffer.byteLength(value)}\n${value}\n`;
    const commit = (ref: string, mark: number, parent: number | null, file: string, object: number) => {
        const message = `chore: fixture ${mark}`;
        return `commit refs/heads/${ref}\nmark :${mark}\ncommitter Fixture <fixture@example.invalid> 1700000000 +0000\ndata ${Buffer.byteLength(message)}\n${message}\n${parent ? `from :${parent}\n` : ''}M 100644 :${object} ${file}\n\n`;
    };
    git(origin, ['fast-import', '--quiet'], blob(1, '{"name":"fixture","version":"1.0.0"}') + blob(2, 'Reviewed update') + blob(3, 'New bot update') +
        commit('main', 11, null, 'package.json', 1) + commit('renovate/fixture', 12, 11, 'source.txt', 2) + commit('future', 13, 12, 'source.txt', 3) + 'done\n');
    const [base, head, future] = git(origin, ['rev-parse', 'refs/heads/main', 'refs/heads/renovate/fixture', 'refs/heads/future']).split('\n');
    f.pr.head.sha = head; f.pr.head.ref = 'renovate/fixture'; f.pr.base.sha = base;
    Object.assign(f.job, { head, branch: f.pr.head.ref, existingPR: true, status: 'working' });
    const original = f.delivery.execute; let pause = true;
    f.delivery.execute = async (bin, args, options) => {
        if (bin !== 'git') return original(bin, args, options);
        f.calls.push({ bin, args, options });
        const cwd = options?.cwd === f.store.project.repo ? origin : options!.cwd!;
        let result: string;
        if (args[0] === 'clone') {
            const local = [...args]; local[local.length - 2] = origin;
            result = git(cwd, local); git(args.at(-1)!, ['remote', 'set-url', 'origin', `https://github.com/${f.store.project.repository}.git`]);
        } else result = git(cwd, args);
        if (pause && (phase === 'config' ? args[0] === 'config' : args[0] === 'clone')) { pause = false; f.store.state.paused = true; }
        return result;
    };
    const path = resolve(f.artifactRoot, 'mandatory-check-assessment.json'); writeFileSync(path, 'Synthetic exact-head check requirement');
    const result: any = { ...structuredClone(f.job.steps[0].result), commit: head, branch: f.job.branch, worktree: '',
        findings: [{ id: 'packed', summary: 'Mandatory checks missing', expected: 'Passing receipts', actual: 'No receipts', status: 'open', attempts: 0 }],
        resolution: { kind: 'source-repair', findingIds: ['packed'], evidenceIds: ['assessment'] },
        evidence: [{ id: 'assessment', kind: 'review', path, commit: head, summary: 'Synthetic assessment', environment: 'fixture', url: '', observedAt: '' }] };
    await expect(f.delivery.queueSourceRepair(f.job, result, f.artifactRoot)).rejects.toThrow('paused');
    const retained = f.job.adoptedRepairCheckout!, candidate = retained.worktree!, id = retained.id;
    expect(git(candidate, ['rev-parse', 'HEAD'])).toBe(base); expect(f.job.worktree).toBe('');
    expect(f.calls.filter(c => c.args[0] === 'checkout')).toHaveLength(0);
    expect(f.calls.filter(c => c.args[0] === 'config')).toHaveLength(phase === 'config' ? 1 : 0);
    let index = '';
    if (phase === 'user-file') writeFileSync(resolve(candidate, 'keep.txt'), 'User work\n');
    if (phase === 'index') { git(candidate, ['read-tree', 'HEAD']); index = git(candidate, ['ls-files', '--stage']); }
    f.store.state.paused = false;
    if (phase === 'advanced-head') {
        git(origin, ['update-ref', 'refs/heads/renovate/fixture', future]);
        f.pr.head.sha = future; trackAdoptedReview(f.store, f.delivery.jobs, f.job, f.pr);
        result.commit = future; result.evidence[0].commit = future;
    }
    if (['user-file', 'index'].includes(phase)) {
        await expect(f.delivery.queueSourceRepair(f.job, result, f.artifactRoot)).rejects.toThrow('dirty');
        expect(f.job.worktree).toBe(''); expect(f.job.adoptedRepairCheckout?.id).toBe(id); expect(existsSync(candidate)).toBe(true);
        if (phase === 'user-file') expect(readFileSync(resolve(candidate, 'keep.txt'), 'utf8')).toBe('User work\n');
        if (phase === 'index') expect(git(candidate, ['ls-files', '--stage'])).toBe(index);
        expect(f.calls.filter(c => c.args[0] === 'checkout')).toHaveLength(0);
    } else {
        expect(await f.delivery.queueSourceRepair(f.job, result, f.artifactRoot)).toBe(true);
        expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', head: f.pr.head.sha });
        expect(git(f.job.worktree, ['rev-parse', 'HEAD'])).toBe(f.pr.head.sha);
        if (phase !== 'advanced-head') expect(f.job.adoptedRepairCheckout?.id).toBe(id);
        else { expect(existsSync(candidate)).toBe(false); expect(f.job.adoptedRepairCheckout?.id).not.toBe(id); }
        expect(f.calls.filter(c => c.args[0] === 'config')).toHaveLength(1);
    }
    expect(f.calls.filter(c => c.args[0] === 'clone')).toHaveLength(phase === 'advanced-head' ? 2 : 1);
    expect(f.calls.some(c => c.args[0] === 'push' || c.args.includes('POST') || c.args.includes('-B'))).toBe(false);
});
