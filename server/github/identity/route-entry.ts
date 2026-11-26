import { createHash } from 'node:crypto';
import type { RouteBinding } from '../../../src/contracts/write-identity';
import type { ActiveEntry, RouteEntry } from './app-config';

/** JSON with object keys sorted at every depth, so equal values have one text whatever their key order. */
export function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value && typeof value === 'object')
        return `{${Object.keys(value).sort().filter(key => (value as Record<string, unknown>)[key] !== undefined)
            .map(key => `${JSON.stringify(key)}:${canonicalJson((value as Record<string, unknown>)[key])}`).join(',')}}`;
    return JSON.stringify(value);
}
export const canonicalDigest = (value: unknown) => createHash('sha256').update(canonicalJson(value)).digest('hex');

/** The digest that identifies one public route entry, saved on the Effects it grants or revokes. */
export const entryDigest = (entry: RouteEntry) => canonicalDigest(entry);

/** The digest a rollback saves: its canonical public entry together with the binding it revoked. */
export const rollbackDigest = (entry: RouteEntry, binding: RouteBinding) => canonicalDigest({ entry, binding });

/** An active entry's distinct proof ids in sorted order; the first is the activation Effect id. */
export function normalizedProofs(entry: ActiveEntry): string[] {
    return [...new Set(entry.proofEffectIds)].sort();
}
export const activationIdOf = (entry: ActiveEntry) => normalizedProofs(entry)[0];
