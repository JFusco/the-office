/** A fresh GitHub write the route does not admit: no intent was created and nothing was sent. */
export class WriteHeld extends Error {
    constructor(readonly operation: string, readonly reason: string) {
        super(`GitHub ${operation} writes are held: ${reason}`);
        this.name = 'WriteHeld';
    }
}
/**
 * The selected credential could not be acquired. The write was never prepared, so it is retried later with bounded
 * backoff, never treated as an attempted write. The message names only a bounded reason.
 */
export class CredentialUnavailable extends Error {
    constructor(reason: string, readonly retryAt?: string) {
        super(`The Office GitHub App credential is unavailable: ${reason}`);
        this.name = 'CredentialUnavailable';
    }
}
