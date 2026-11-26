import type { KeyObject } from 'node:crypto';
import { appJwt, signingKey } from './app-jwt';
import type { AppKeySource } from './app-key';
import { canonicalJson } from './route-entry';
import { CredentialUnavailable } from './write-refusals';
import type { InstallationPermissions } from './write-operations';

/** One HTTPS exchange. The response body stays inside the issuer: it is parsed here and never logged or returned. */
export type HttpsTransport = (request: { method: 'POST'; url: string; headers: Record<string, string>; body: string }) => Promise<{ status: number; body: string }>;
export interface TokenRequest { installationId: number; repositoryId: number; permissions: InstallationPermissions }
/** A validated installation token, held in memory only. */
export interface InstallationToken { token: string; expiresAt: number; installationId: number; repositoryId: number; permissions: InstallationPermissions }
/** Public counts of direct App-authentication traffic, reported apart from ordinary GitHub calls. */
export interface AuthenticationCounters { exchanges: number; failures: number; cached: number }

export const API_VERSION = '2026-03-10';
/** Refresh this long before a cached token expires; a token with less left is never handed out. */
export const REFRESH_BEFORE_MS = 5 * 60_000;

const refuse = (reason: string): never => { throw new CredentialUnavailable(reason); };

/**
 * Exchanges the App JWT for an installation token scoped to exactly one repository id and the operation's permission
 * subset, then validates the returned grant before any use: the mandatory Metadata read, no excess permission, the
 * single-repository restriction, a usable expiry and a nonempty opaque token. Tokens are cached in memory by
 * installation, repository id and normalized permissions; concurrent refreshes of one key share one exchange.
 * The key is read lazily on the first exchange.
 */
export class InstallationTokens {
    readonly counters: AuthenticationCounters = { exchanges: 0, failures: 0, cached: 0 };
    private key?: Promise<KeyObject>;
    private cache = new Map<string, InstallationToken>();
    private pending = new Map<string, Promise<InstallationToken>>();
    constructor(private appId: number, private source: AppKeySource, private transport: HttpsTransport, private now: () => number = () => Date.now()) { }

    async token(request: TokenRequest): Promise<InstallationToken> {
        const cacheKey = `${request.installationId}:${request.repositoryId}:${canonicalJson(normalized(request.permissions))}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt - REFRESH_BEFORE_MS > this.now()) { this.counters.cached++; return cached; }
        const inFlight = this.pending.get(cacheKey);
        if (inFlight) return inFlight;
        const exchange = this.exchange(request).then(token => { this.cache.set(cacheKey, token); return token; }, error => {
            this.cache.delete(cacheKey);
            this.counters.failures++;
            throw error instanceof CredentialUnavailable ? error : new CredentialUnavailable('the token exchange failed');
        }).finally(() => this.pending.delete(cacheKey));
        this.pending.set(cacheKey, exchange);
        return exchange;
    }

    private async exchange(request: TokenRequest): Promise<InstallationToken> {
        if (!Number.isSafeInteger(request.installationId) || request.installationId <= 0 || !Number.isSafeInteger(request.repositoryId) || request.repositoryId <= 0)
            refuse('an explicit installation and repository id are required');
        // A Metadata-only request (the quota probe) asks for exactly that grant.
        const permissions = normalized(request.permissions), requested = Object.keys(permissions).length ? permissions : { metadata: 'read' as const };
        this.key ??= this.source.read().then(signingKey);
        let key: KeyObject;
        try { key = await this.key; }
        catch (error) { this.key = undefined; return refuse(error instanceof Error ? error.message : 'the signing key could not be read'); }
        this.counters.exchanges++;
        let response: { status: number; body: string };
        try {
            response = await this.transport({
                method: 'POST', url: `https://api.github.com/app/installations/${request.installationId}/access_tokens`,
                headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${appJwt(this.appId, key, new Date(this.now()))}`, 'content-type': 'application/json', 'user-agent': 'the-office', 'x-github-api-version': API_VERSION },
                body: JSON.stringify({ repository_ids: [request.repositoryId], permissions: requested }),
            });
        } catch { return refuse('the token exchange did not complete'); }
        if (response.status !== 201) refuse(`GitHub answered the token exchange with HTTP ${Number(response.status) || 'unknown'}`);
        let grant: any;
        try { grant = JSON.parse(response.body); } catch { return refuse('the token exchange answer was not JSON'); }
        return validated(grant, request, permissions, this.now());
    }
}

/** Metadata read is GitHub's own mandatory grant; the request never asks for it. */
function normalized(permissions: InstallationPermissions): InstallationPermissions {
    const { metadata: _metadata, ...rest } = permissions ?? {};
    return Object.fromEntries(Object.entries(rest).sort(([a], [b]) => a.localeCompare(b))) as InstallationPermissions;
}

function validated(grant: any, request: TokenRequest, permissions: InstallationPermissions, now: number): InstallationToken {
    if (typeof grant?.token !== 'string' || !/^[\x21-\x7e]{20,4096}$/.test(grant.token)) refuse('the answer carried no usable token');
    const expiresAt = Date.parse(grant.expires_at);
    if (!Number.isFinite(expiresAt) || expiresAt - REFRESH_BEFORE_MS <= now) refuse('the token expires too soon to use');
    const returned = grant.permissions;
    if (!returned || typeof returned !== 'object' || returned.metadata !== 'read') refuse('the grant is missing the mandatory Metadata read');
    const expected = { ...permissions, metadata: 'read' };
    if (Object.keys(returned).length !== Object.keys(expected).length || Object.entries(expected).some(([name, level]) => returned[name] !== level))
        refuse('the returned grant differs from the requested permission subset');
    if (grant.repository_selection !== 'selected' || !Array.isArray(grant.repositories) || grant.repositories.length !== 1 || grant.repositories[0]?.id !== request.repositoryId)
        refuse('the token is not restricted to the one requested repository');
    return { token: grant.token, expiresAt, installationId: request.installationId, repositoryId: request.repositoryId, permissions };
}

/** The production transport: Node's own HTTPS client. Never reached under unit tests, which inject a fake. */
export const fetchTransport: HttpsTransport = async ({ method, url, headers, body }) => {
    if (process.env.VITEST) throw new Error('Live GitHub App token exchange is blocked under unit tests');
    const response = await fetch(url, { method, headers, body, redirect: 'error' });
    return { status: response.status, body: await response.text() };
};
