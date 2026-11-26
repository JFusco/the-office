import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { projectById } from '../../../../../server/office/projects';
import { Store } from '../../../../../server/store/store';
import { harnessEffect } from '../../../../../server/delivery/harness/effect';
import { bindGitHubIdentity } from '../../../../../server/github/identity/identity-runtime';
import type { GitHubAppConfig, RouteEntry } from '../../../../../server/github/identity/app-config';
import { canonicalDigest } from '../../../../../server/github/identity/route-entry';
import { changeDigest } from '../../../../../server/github/identity/write-boundary';
import { currentPrincipal, currentWriteCredential } from '../../../../../server/github/identity/write-credential-scope';
import type { InstallationTokens } from '../../../../../server/github/identity/installation-token';
import type { WriteOperation } from '../../../../../server/github/identity/write-operations';

export const APP = { appId: 1001, installationId: 2002, botLogin: 'office-test[bot]', botId: 3003, repositoryId: 4004 };
/** A synthetic token shape: generated per fixture, never a real credential. */
export const SYNTHETIC_TOKEN = `ghs_${'Synthetic0'.repeat(4)}`;

/** A parsed `githubApp` block for the Brain fixture project, with the given routes. */
export function appConfig(writes: Partial<Record<WriteOperation, RouteEntry>> = {}, change: Partial<GitHubAppConfig> = {}): GitHubAppConfig {
    return {
        appId: APP.appId, installationId: APP.installationId, botLogin: APP.botLogin, botId: APP.botId,
        keySource: { kind: 'keychain', service: 'office-github-app-test', account: 'fixture' },
        repositories: { brain: { repository: 'JFusco/brain', repositoryId: APP.repositoryId } },
        writes: { brain: writes }, ...change,
    };
}

export const JOB = { id: 'job-1' };
export const issueUrl = (issue: number) => `https://github.com/JFusco/brain/issues/${issue}`;
export const closeId = (issue: number, job = JOB) => `harness:${job.id}:issue-close:${issue}`;

/**
 * A temporary file-backed Brain store with an injected `githubApp` config, a fake token issuer and a counted
 * provider that tells App mutations from operator mutations by the child credential each one runs under.
 */
export function routeFixture() {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), 'route-fixture-'))), path = join(folder, 'office.sqlite');
    let now = Date.parse('2026-11-26T12:00:00.000Z'), config: GitHubAppConfig | undefined;
    const clock = { now: () => new Date(now), monotonic: () => now };
    const issues = new Map<number, { closed: boolean; by?: string }>();
    const provider = { mutations: [] as { issue: number; principal: string; token: boolean }[], readBacks: [] as string[], tokenRequests: 0, keyReads: 0, unavailable: false, operatorLogin: 'JFusco' };
    const tokens = {
        token: async (request: { installationId: number; repositoryId: number }) => {
            provider.tokenRequests++;
            if (provider.unavailable) throw new Error('issuer offline');
            provider.keyReads++;
            return { token: SYNTHETIC_TOKEN, expiresAt: now + 3_600_000, permissions: {}, ...request };
        },
    } as unknown as InstallationTokens;
    const connections: DatabaseSync[] = [];
    const open = () => {
        const store = new Store(path, projectById('brain'), folder, clock);
        bindGitHubIdentity(store, { config: () => config, tokens: () => tokens, operatorLogin: async () => provider.operatorLogin });
        return store;
    };
    let store = open();
    const fixture = {
        path, provider, issues,
        get store() { return store; },
        setConfig(next: GitHubAppConfig | undefined) { config = next; },
        config: () => config,
        advance(ms: number) { now += ms; },
        reopen() { store.close(); store = open(); return store; },
        /** A second connection to the same file, as another process would see it. */
        independent() { const db = new DatabaseSync(path); connections.push(db); return db; },
        cleanup() { store.close(); for (const db of connections) if (db.isOpen) db.close(); rmSync(folder, { recursive: true, force: true }); },
        app: () => provider.mutations.filter(m => m.principal !== 'operator').length,
        operator: () => provider.mutations.filter(m => m.principal === 'operator').length,
        /** The pending entry that designates `harness:<job>:issue-close:<issue>` for one App trial. */
        qualify(issue: number, revokes?: string, job = JOB): RouteEntry {
            return { mode: 'qualify', effectId: closeId(issue, job), installationId: APP.installationId, repositoryId: APP.repositoryId, adapter: 'github-issue-close',
                target: issueUrl(issue), beforeDigest: canonicalDigest(null),
                expectedDigest: changeDigest({ id: closeId(issue, job), operation: 'github-issue-close', target: issueUrl(issue), payload: { issue } }), ...(revokes ? { revokes } : {}) };
        },
        /**
         * Closes one issue through the ordinary harness caller. The provider records the closing actor: the bot when the
         * child carries the scoped App token, the operator otherwise. `lose` applies the mutation and loses the response.
         */
        close(issue: number, options: { lose?: boolean; actor?: string; adopt?: boolean; gate?: Promise<void>; onDispatch?: () => void; job?: { id: string } } = {}) {
            const read = async () => { provider.readBacks.push(currentPrincipal()); return issues.get(issue)?.closed ? { issue, closed: true } : null; };
            // The first guard runs before the intent exists; the second is the preflight a gate can hold.
            let guards = 0;
            return harnessEffect(store, options.job ?? JOB, {
                key: `issue-close:${issue}`, operation: 'github-issue-close', target: issueUrl(issue), payload: { issue },
                guard: async () => { if (++guards === 2 && options.gate) await options.gate; },
                dispatch: async () => {
                    options.onDispatch?.();
                    const principal = currentPrincipal(), token = currentWriteCredential()?.gh.env.GH_TOKEN === SYNTHETIC_TOKEN;
                    provider.mutations.push({ issue, principal, token });
                    issues.set(issue, { closed: true, by: options.actor ?? (token ? APP.botLogin : 'JFusco') });
                    if (options.lose) throw new Error('gh timed out; previous action outcome must be reconciled');
                    return { issue, closed: true };
                },
                readBack: read,
                qualify: async () => {
                    const saved = issues.get(issue);
                    if (options.adopt || !saved?.by) return undefined;
                    return { record: `${issueUrl(issue)}#event-closed`, target: issueUrl(issue), transition: 'issue closed', actor: { login: saved.by, ...(saved.by === APP.botLogin ? { id: APP.botId } : {}) }, observedAt: new Date(now).toISOString() };
                },
            });
        },
    };
    return fixture;
}
export type RouteFixture = ReturnType<typeof routeFixture>;
