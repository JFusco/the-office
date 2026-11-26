/**
 * Who an Office GitHub write is sent as, and the durable evidence that lets a write route move from the operator (Joe's
 * stored `gh` login) to the Office GitHub App. Public identifiers only: no key, token or signed request is ever saved.
 */

/** The concrete write a grant or activation covers: the fixed adapter, the provider target and, for board writes, the board and field. */
export interface WriteBinding {
    /** The fixed adapter that sends the write (`server/github/identity/write-inventory.ts`). */
    adapter: string;
    /** The provider target the adapter names, e.g. an issue URL or `owner/name:branch`. */
    target: string;
    /** Digest of the bound pre-state the adapter read before the write; a designated trial only. */
    beforeDigest?: string;
    /** Digest of the intended change, derived from the authorized operation and its payload. */
    expectedDigest?: string;
    board?: string;
    field?: string;
}

/** Why the writer may send this intent. */
export type WriterGrant =
    /** The operator: a route that was never activated, or one whose activation `revokes` names was revoked. */
    | { kind: 'operator'; revokes?: string }
    /** An ordinary App write under the route's current activation. */
    | { kind: 'activation'; activationEffectId: string }
    /** The one designated App trial of a pending `qualify` entry, by the digest of that entry. */
    | { kind: 'trial'; entryDigest: string; revokes?: string };

/** The writer pinned on an intent before it is created. Reconciliation reads back under this writer, never the current config. */
export interface EffectWriter {
    principal: 'operator' | 'app';
    projectId: string;
    repository: string;
    /** The route operation label (`server/github/identity/write-operations.ts`). */
    operation: string;
    /** The login GitHub is expected to record for the write. */
    login: string;
    appId?: number;
    installationId?: number;
    botId?: number;
    repositoryId?: number;
    grant: WriterGrant;
    binding: WriteBinding;
}

/** Actor-bearing evidence an adapter's independent read-back returned with a successful verification. */
export interface WriteQualification {
    /** The provider record read back, e.g. a comment URL or an issue event id. */
    record: string;
    target: string;
    /** What changed, in the adapter's words, e.g. `issue closed`. */
    transition: string;
    actor: { login: string; id?: number };
    observedAt: string;
}

/** The route an activation governs and the binding it was proved for. */
export interface RouteBinding {
    projectId: string;
    operation: string;
    repository: string;
    repositoryId: number;
    appId: number;
    installationId: number;
    /** The fixed adapters the proof covers, sorted. */
    adapters: string[];
    board?: string;
    field?: string;
}

/** An explicit promotion saved on the qualifying Effect, with the rollback that later revoked it. */
export interface WriteActivation {
    projectId: string;
    operation: string;
    /** The activation this one followed, or null for the route's first promotion. */
    predecessor: string | null;
    /** Distinct, sorted proof Effect ids; the first is the activation Effect id. */
    proofEffectIds: string[];
    binding: RouteBinding;
    activatedAt: string;
    /** The recorded rollback: the digest of its canonical public entry and binding, and the project clock time. */
    revocation?: { entryDigest: string; at: string };
}
