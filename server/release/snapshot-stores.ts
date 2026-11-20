import { compareAdmissions, snapshotAdmissions, type AdmissionSnapshot } from './admission-snapshot';
import type { DeployContext } from './deploy-context';
import { changedStores, fingerprintStores, type StoreFingerprint } from './store-fingerprint';

export interface StoreSnapshot { admissions: AdmissionSnapshot[]; fingerprints: StoreFingerprint[] }

/** Admission cursors of every project store and a content fingerprint of every store, taken while the service is stopped. */
export function snapshotStores(ctx: Pick<DeployContext, 'projects' | 'databases'>): StoreSnapshot {
    return { admissions: snapshotAdmissions(ctx.projects), fingerprints: fingerprintStores(ctx.databases) };
}

/** Why a snapshot cannot serve as the baseline for a later comparison; empty when it can. */
export function snapshotGaps(snapshot: StoreSnapshot): string[] {
    return [
        ...snapshot.admissions.filter(entry => entry.cursor === null).map(entry => `${entry.name}: admission cursor unreadable (${entry.reason ?? 'unknown'})`),
        ...snapshot.fingerprints.filter(entry => entry.digest === null).map(entry => `${entry.name}: contents unreadable (${entry.reason ?? 'unknown'})`),
    ];
}

/**
 * What changed in the stores since `before`; empty only when no work was admitted and every store
 * holds exactly what it held. A snapshot that is missing or malformed counts as changed.
 */
export function storesChangedSince(ctx: Pick<DeployContext, 'projects' | 'databases'>, before: unknown): string[] {
    const earlier = before as Partial<StoreSnapshot> | undefined;
    if (!Array.isArray(earlier?.admissions) || !Array.isArray(earlier?.fingerprints)) return ['no store snapshot was recorded before the start'];
    const now = snapshotStores(ctx), admissions = compareAdmissions(earlier.admissions, now.admissions);
    return [
        ...(admissions.status === 'unchanged' ? [] : admissions.projects.map(project => `${project.name}: ${project.reason}`)),
        ...changedStores(earlier.fingerprints, now.fingerprints).map(store => `${store.name}: ${store.reason}`),
    ];
}
