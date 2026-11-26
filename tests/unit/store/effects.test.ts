import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { projectById } from '../../../server/office/projects';
import { Effects, WriterRefused } from '../../../server/store/effects';
import { Store } from '../../../server/store/store';
import { promoteRoute, revokeRoute } from '../../../server/github/identity/route-activation';
import type { GitHubAppConfig } from '../../../server/github/identity/app-config';

let store: Store;
beforeEach(() => { store = new Store(':memory:', projectById('brain')); });
afterEach(() => store.close());

function operation() {
    return {
        id: 'same', work: { projectId: 'brain', kind: 'delivery' as const, id: 'job' },
        attemptId: 'attempt', operation: 'publish', target: 'branch', authorization: 'approved',
        payload: { head: 'reviewed' }, expectedState: { draft: true },
        preflight: vi.fn(async () => {}), dispatch: vi.fn(async () => ({ number: 7 })), verify: async () => true,
    };
}

test.each([
    ['work', { work: { projectId: 'brain', kind: 'delivery' as const, id: 'other' } }],
    ['attempt', { attemptId: 'other' }], ['operation', { operation: 'promote' }],
    ['target', { target: 'elsewhere' }], ['authorization', { authorization: 'different approval' }],
    ['payload', { payload: { head: 'other' } }], ['expected state', { expectedState: { draft: false } }],
] as const)('reusing a verified intent with a changed %s preserves the original receipt', async (_, change) => {
    const effects = new Effects(store), original = operation();
    const receipt = await effects.execute(original);
    await expect(effects.execute({ ...original, ...change })).rejects.toThrow('different operation');
    expect(original.preflight).toHaveBeenCalledOnce();
    expect(original.dispatch).toHaveBeenCalledOnce();
    const persisted = store.getEffect(original.id);
    expect(persisted?.status).toBe('verified');
    expect(persisted?.receipt).toStrictEqual(receipt);
});

test('two concurrent preflights for one intent dispatch exactly once', async () => {
    const effects = new Effects(store), original = operation();
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    original.preflight.mockImplementation(() => gate);
    const attempts = [effects.execute(original), effects.execute(original)];
    expect(original.preflight).toHaveBeenCalledTimes(2);
    release();
    const results = await Promise.allSettled(attempts);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(original.dispatch).toHaveBeenCalledOnce();
    expect(store.getEffect(original.id)).toMatchObject({ status: 'verified', receipt: { number: 7 } });
});

// Settled Effects keep what each transition owns: a late read-back or a late execute failure never erases the
// promotion or rollback saved on the row after it verified. File-backed, reopened, one provider mutation.
const APP = { appId: 1001, installationId: 2002, botLogin: 'office-test[bot]', botId: 3003, repositoryId: 4004 };
const appConfig = (): GitHubAppConfig => ({ appId: APP.appId, installationId: APP.installationId, botLogin: APP.botLogin, botId: APP.botId,
    keySource: { kind: 'keychain', service: 's', account: 'a' }, repositories: { brain: { repository: 'JFusco/brain', repositoryId: APP.repositoryId } }, writes: {} });
const target = 'https://github.com/JFusco/brain/issues/5';
const qualification = { record: `${target}#event`, target, transition: 'issue closed', actor: { login: APP.botLogin, id: APP.botId }, observedAt: '2026-11-26T12:00:00.000Z' };
function trialOperation(dispatch: () => Promise<unknown>) {
    return { id: 'trial', work: { projectId: 'brain', kind: 'delivery' as const, id: 'job' }, attemptId: 'job', operation: 'github-issue-close', target, authorization: 'office-harness',
        payload: { issue: 5 }, expectedState: { key: 'issue-close:5' }, preflight: async () => {}, dispatch, verify: async () => true,
        writer: { principal: 'app' as const, projectId: 'brain', repository: 'JFusco/brain', operation: 'issue-close', login: APP.botLogin, appId: APP.appId, installationId: APP.installationId,
            botId: APP.botId, repositoryId: APP.repositoryId, grant: { kind: 'trial' as const, entryDigest: 'entry' }, binding: { adapter: 'github-issue-close', target } } };
}
function gated<T>() { let release!: (value: T) => void; const held = new Promise<T>(resolve => { release = resolve; }); return { held, release }; }

test.each(['promotion', 'committed revocation'] as const)('a negative read-back that finishes after the first verified keeps the %s', async variant => {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), 'effects-settled-'))), path = join(folder, 'office.sqlite');
    let file = new Store(path, projectById('brain'), folder);
    try {
        let mutations = 0;
        await expect(new Effects(file).execute(trialOperation(async () => { mutations++; throw new Error('response lost'); }))).rejects.toThrow('response lost');
        const first = gated<{ verified: boolean; receipt: unknown; qualification?: typeof qualification }>(), second = gated<{ verified: boolean; receipt: unknown }>();
        const a = new Effects(file).reconcile('trial', () => first.held), b = new Effects(file).reconcile('trial', () => second.held);
        first.release({ verified: true, receipt: { winner: 1 }, qualification });
        expect(await a).toBe(true);
        expect(promoteRoute(file, appConfig(), 'issue-close', { mode: 'office-app', proofEffectIds: ['trial'] })).toEqual({ ok: true, activationId: 'trial' });
        if (variant === 'committed revocation') expect(revokeRoute(file, appConfig(), 'issue-close', { mode: 'operator', revokes: 'trial' })).toMatchObject({ ok: true });
        second.release({ verified: false, receipt: null });
        expect(await b).toBe(true);
        file.close();
        file = new Store(path, projectById('brain'), folder);
        const saved = file.getEffect('trial')!;
        expect(saved).toMatchObject({ status: 'verified', receipt: { winner: 1 }, qualification, activation: { proofEffectIds: ['trial'] } });
        expect(!!saved.activation!.revocation).toBe(variant === 'committed revocation');
        expect(mutations).toBe(1);
    } finally { file.close(); rmSync(folder, { recursive: true, force: true }); }
});

test('a late execute failure after a read-back verified and promoted the Effect leaves that outcome as it is', async () => {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), 'effects-late-'))), path = join(folder, 'office.sqlite');
    let file = new Store(path, projectById('brain'), folder);
    try {
        let mutations = 0;
        const response = gated<void>();
        const executing = new Effects(file).execute(trialOperation(async () => { mutations++; await response.held; throw new Error('late failure'); }));
        await vi.waitFor(() => expect(file.getEffect('trial')?.status).toBe('dispatching'));
        expect(await new Effects(file).reconcile('trial', async () => ({ verified: true, receipt: { read: true }, qualification }))).toBe(true);
        expect(promoteRoute(file, appConfig(), 'issue-close', { mode: 'office-app', proofEffectIds: ['trial'] })).toMatchObject({ ok: true });
        response.release();
        await expect(executing).resolves.toEqual({ read: true });
        file.close();
        file = new Store(path, projectById('brain'), folder);
        expect(file.getEffect('trial')).toMatchObject({ status: 'verified', error: '', receipt: { read: true }, qualification, activation: { proofEffectIds: ['trial'] } });
        expect(mutations).toBe(1);
    } finally { file.close(); rmSync(folder, { recursive: true, force: true }); }
});

test('a claim refusal rejects the prepared intent unsent and never dispatches; a failed claim transaction dispatches nothing', async () => {
    const effects = new Effects(store), refused = { ...operation(), id: 'refused', claim: () => 'The writer was refused at dispatch: test' };
    await expect(effects.execute(refused)).rejects.toBeInstanceOf(WriterRefused);
    expect(refused.dispatch).not.toHaveBeenCalled();
    expect(store.getEffect('refused')).toMatchObject({ status: 'rejected', dispatchedAt: '', error: 'The writer was refused at dispatch: test' });
    const broken = { ...operation(), id: 'broken', claim: (): string | undefined => { throw new Error('store unreadable'); } };
    await expect(effects.execute(broken)).rejects.toThrow('store unreadable');
    expect(broken.dispatch).not.toHaveBeenCalled();
    expect(store.getEffect('broken')).toMatchObject({ status: 'prepared', dispatchedAt: '' });
});
