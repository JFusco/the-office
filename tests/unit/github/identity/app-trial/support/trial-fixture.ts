import { mkdtempSync, realpathSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../../../../server/store/store';
import { bindGitHubIdentity } from '../../../../../../server/github/identity/identity-runtime';
import { parseGitHubApp, type GitHubAppConfig, type QualifyEntry } from '../../../../../../server/github/identity/app-config';
import type { InstallationTokens } from '../../../../../../server/github/identity/installation-token';
import { currentPrincipal } from '../../../../../../server/github/identity/write-credential-scope';
import { appTrialComment } from '../../../../../../server/github/identity/app-trial/trial-comment';
import type { OfficeProject } from '../../../../../../src/shared';

/**
 * An isolated rehearsal of the approved #629 packet: a temporary project store, an injected `githubApp` block, a
 * synthetic token issuer and a counted provider. It exercises the exact interface; it is never the live G3 receipt,
 * which only the durable `the-office` project store of the running Office can hold.
 */
export const MARKER = '<!-- office-app-qualification:629:issue-comment:756 -->';
export const BODY = `${MARKER}\n\nThe Office GitHub App posted this comment for the approved issue-comment qualification on #629.`;
export const ISSUE = 'https://github.com/JFusco/the-office/issues/629';
export const API_ISSUE = 'https://api.github.com/repos/JFusco/the-office/issues/629';
export const PACKET = {
    projectId: 'the-office', repository: 'JFusco/the-office', repositoryId: 1438707274, appId: 5932019, installationId: 186014638,
    botLogin: 'jfusco-office[bot]', botId: 361413665, effectId: 'office-app-trial:the-office:comment:629:756',
    issue: { number: 629, id: 6619796298, nodeId: 'I_kwDOVcDuSs8AAAABipITSg' }, marker: MARKER, body: BODY,
    beforeDigest: '74234e98afe7498fb5daf1f36ac2d78acc339464f950703b8c019892f982b90b',
    expectedDigest: '79e4bf111555af37728b59e54fcca99db2ad7e798adec9546d10e344859d3ac4',
};
export type Packet = typeof PACKET;
export const BOT = { login: PACKET.botLogin, id: PACKET.botId }, OPERATOR = { login: 'JFusco', id: 7 };
/** The scoped App credential's call-ledger label (`child-credentials.ts`). */
export const APP_POST = `app:${PACKET.installationId}`;
export const ENTRY: QualifyEntry = { mode: 'qualify', effectId: PACKET.effectId, installationId: PACKET.installationId, repositoryId: PACKET.repositoryId,
    adapter: 'github-issue-comment', target: ISSUE, beforeDigest: PACKET.beforeDigest, expectedDigest: PACKET.expectedDigest };
export const PROJECT: OfficeProject = { id: 'the-office', name: 'The Office', provider: 'github', repo: '/nonexistent/the-office', repository: 'JFusco/the-office', target: 'main', autoAdopt: [] };
const NOW = Date.parse('2026-11-28T06:00:00.000Z');
export type Comment = { id: number; body: string; html_url: string; issue_url: string; user: { login: string; id: number }; created_at: string };
export const comment = (id: number, body: string, user = BOT, created = '2026-11-27T00:00:00Z'): Comment =>
    ({ id, body, html_url: `${ISSUE}#issuecomment-${id}`, issue_url: API_ISSUE, user: { ...user }, created_at: created });

/** The parsed `githubApp` block with the given `comment` route and top-level changes, validated as start-up would. */
export function appBlock(writes: unknown, change: Record<string, unknown> = {}): GitHubAppConfig | undefined {
    return parseGitHubApp({ appId: PACKET.appId, installationId: PACKET.installationId, botLogin: PACKET.botLogin, botId: PACKET.botId,
        keySource: { kind: 'keychain', service: 'office-github-app-test', account: 'fixture' },
        repositories: { 'the-office': { repository: 'JFusco/the-office', repositoryId: PACKET.repositoryId } },
        writes: { 'the-office': writes }, ...change }, [PROJECT]);
}

export interface ProviderHooks {
    /** The POST lands and its response is lost. */
    lose?: boolean;
    /** Runs as the App token is issued, inside writer selection. */
    atToken?: () => void;
    /** What the n-th complete listing returns; a promise that never settles models a crash mid-read. */
    list?: (all: Comment[], read: number) => Comment[] | Promise<Comment[]>;
    /** Changes to the n-th issue read. */
    issue?: (read: number) => Record<string, unknown> | undefined;
    /** The repository id the n-th repository read reports. */
    repositoryId?: (read: number) => number;
    /** Who GitHub records on a POST: the scoped principal by default. */
    author?: { login: string; id: number };
}

/**
 * A temporary file-backed `the-office` store bound to an injected identity runtime, and a counted GitHub: every POST
 * records the principal it ran under, every read is counted, and nothing reaches a live provider.
 */
export function trialOffice(writes: unknown = { comment: ENTRY }, change: Record<string, unknown> = {}) {
    const folder = realpathSync(mkdtempSync(join(tmpdir(), 'app-trial-'))), path = join(folder, 'office.sqlite');
    let config = appBlock(writes, change);
    const counts = { tokens: 0, issued: [] as { installationId: number; repositoryId: number }[], posts: [] as string[], listReads: 0, issueReads: 0, repositoryReads: 0, idReads: 0, issuePrincipals: [] as string[] };
    const hooks: ProviderHooks = {};
    const tokens = { token: async (request: { installationId: number; repositoryId: number }) => {
        counts.tokens++; counts.issued.push({ installationId: request.installationId, repositoryId: request.repositoryId }); hooks.atToken?.();
        return { token: 'synthetic', expiresAt: NOW + 3_600_000, permissions: {}, ...request };
    } } as unknown as InstallationTokens;
    const open = () => {
        const store = new Store(path, { ...PROJECT, repo: folder }, folder, { now: () => new Date(NOW), monotonic: () => NOW });
        bindGitHubIdentity(store, { config: () => config, tokens: () => tokens, operatorLogin: async () => 'JFusco' });
        return store;
    };
    let store = open();
    const comments: Comment[] = [comment(100, 'An earlier comment.', OPERATOR)];
    const execute = async (_program: string, args: string[]) => {
        const path = args[1];
        if (args.includes('POST')) {
            // Only the approved #629 conversation accepts the comment; any other destination records nothing.
            if (path !== 'repos/JFusco/the-office/issues/629/comments') throw new Error(`gh: Not Found (HTTP 404): POST ${path}`);
            const principal = currentPrincipal(), id = 900 + counts.posts.length;
            counts.posts.push(principal);
            comments.push(comment(id, args[args.indexOf('-f') + 1].slice('body='.length), hooks.author ?? (principal === 'operator' ? OPERATOR : BOT), new Date(NOW).toISOString()));
            if (hooks.lose) throw new Error('gh timed out; previous action outcome must be reconciled');
            return JSON.stringify({ id, html_url: `${ISSUE}#issuecomment-${id}` });
        }
        if (path === 'repos/JFusco/the-office') {
            const read = ++counts.repositoryReads;
            return JSON.stringify({ id: hooks.repositoryId ? hooks.repositoryId(read) : PACKET.repositoryId, full_name: 'JFusco/the-office' });
        }
        if (path === 'repos/JFusco/the-office/issues/629') {
            const read = ++counts.issueReads;
            counts.issuePrincipals.push(currentPrincipal());
            return JSON.stringify({ number: 629, id: PACKET.issue.id, node_id: PACKET.issue.nodeId, html_url: ISSUE, state: 'open', locked: false, ...hooks.issue?.(read) });
        }
        if (args.includes('--paginate')) {
            const read = ++counts.listReads;
            return JSON.stringify([hooks.list ? await hooks.list(comments, read) : comments]);
        }
        counts.idReads++;
        const found = comments.find(item => item.id === Number(path.split('/').pop()));
        if (!found) throw new Error('gh: Not Found (HTTP 404)');
        return JSON.stringify(found);
    };
    const fixture = {
        get store() { return store; }, counts, hooks, comments, execute,
        configure(next: unknown, more: Record<string, unknown> = {}) { config = next === undefined ? undefined : appBlock(next, { ...change, ...more }); },
        /** A new process on the same file: a new store, the same durable intents. */
        reopen() { store.close(); store = open(); return store; },
        run: (packet: object = PACKET, mode: 'check' | 'run' = 'run') => appTrialComment(store, execute, { mode, packet }),
        effects: () => (store.db.prepare('SELECT id FROM effects ORDER BY id').all() as { id: string }[]).map(row => row.id),
        cleanup() { try { store.close(); } catch { /* already closed */ } rmSync(folder, { recursive: true, force: true }); },
    };
    return fixture;
}
export type TrialOffice = ReturnType<typeof trialOffice>;
