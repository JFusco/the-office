import { createHash } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';

const Body = z.object({
    tokenDigest: z.string().regex(/^[0-9a-f]{64}$/),
    deployment: z.string().trim().min(1).max(200),
    acquiredAt: z.iso.datetime(),
}).strict();

export type DeploymentFenceState =
    | { status: 'open' }
    | { status: 'held'; tokenDigest: string; deployment: string; acquiredAt: string }
    | { status: 'invalid'; reason: string };

/** Only a digest is stored or reported; the token itself stays with the deployment that holds it. */
export const fenceTokenDigest = (token: string) => createHash('sha256').update(token).digest('hex');

function assertToken(token: unknown): asserts token is string {
    // Ill-formed UTF-16 would be replaced when hashed, letting distinct tokens share a digest.
    if (typeof token !== 'string' || token.length < 16 || token.length > 200 || /\p{Cs}/u.test(token)) throw new Error('A deployment fence token is 16 to 200 characters of well-formed text');
}

/**
 * While a deployment holds this fence the service admits no new work; already-owned work may settle.
 * One row on the office control database, separate from the leases ControlStore.recover deletes, so
 * a restarted release starts fenced. An unreadable row counts as held: admission fails closed.
 */
export class DeploymentFence {
    constructor(private db: DatabaseSync, private now: () => Date = () => new Date()) {
        db.exec('CREATE TABLE IF NOT EXISTS deployment_fence (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL)');
    }
    read(): DeploymentFenceState {
        const row = this.db.prepare('SELECT body FROM deployment_fence WHERE id=1').get() as { body: string } | undefined;
        if (!row) return { status: 'open' };
        try {
            return { status: 'held', ...Body.parse(JSON.parse(row.body)) };
        } catch (error) {
            return { status: 'invalid', reason: `Stored deployment fence is unreadable: ${error instanceof Error ? error.message.slice(0, 200) : 'unknown'}` };
        }
    }
    held(): boolean { return this.read().status !== 'open'; }
    /** Idempotent for the token that holds it; refused while any other token, or an unreadable row, holds it. */
    acquire(token: unknown, deployment: unknown): DeploymentFenceState {
        assertToken(token);
        const name = z.string().trim().min(1).max(200).parse(deployment);
        return this.exclusive(() => {
            const current = this.read(), digest = fenceTokenDigest(token);
            if (current.status === 'held' && current.tokenDigest === digest && current.deployment === name) return current;
            if (current.status === 'held') throw new Error(`The deployment fence is held by ${current.deployment}`);
            if (current.status === 'invalid') throw new Error(`${current.reason}; clear it before acquiring`);
            const body = Body.parse({ tokenDigest: digest, deployment: name, acquiredAt: this.now().toISOString() });
            this.db.prepare('INSERT INTO deployment_fence VALUES(1,?)').run(JSON.stringify(body));
            return { status: 'held', ...body };
        });
    }
    /** Releases only for the exact token. Releasing an open fence is a no-op, so a repeated release is safe. */
    release(token: unknown): DeploymentFenceState {
        assertToken(token);
        return this.exclusive(() => {
            const current = this.read();
            if (current.status === 'open') return current;
            if (current.status === 'invalid') throw new Error(`${current.reason}; only clear-invalid removes it`);
            if (current.tokenDigest !== fenceTokenDigest(token)) throw new Error('The deployment fence is held by another token');
            this.db.prepare('DELETE FROM deployment_fence WHERE id=1').run();
            return { status: 'open' };
        });
    }
    /** Removes only an unreadable row; a readable fence is released by its token. */
    clearInvalid(): DeploymentFenceState {
        return this.exclusive(() => {
            if (this.read().status !== 'invalid') throw new Error('The deployment fence is not unreadable; release it with its token');
            this.db.prepare('DELETE FROM deployment_fence WHERE id=1').run();
            return { status: 'open' };
        });
    }
    private exclusive<T>(operation: () => T): T {
        this.db.exec('BEGIN IMMEDIATE');
        try {
            const result = operation();
            this.db.exec('COMMIT');
            return result;
        } catch (error) {
            this.db.exec('ROLLBACK');
            throw error;
        }
    }
}
