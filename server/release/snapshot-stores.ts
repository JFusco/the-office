import { absentAdmission, compareAdmissions, snapshotAdmissions, type AdmissionSnapshot } from './admission-snapshot';
import type { DeployContext } from './deploy-context';
import { absentFingerprint, changedStores, fingerprintStores, type StoreFingerprint } from './store-fingerprint';

export interface StoreSnapshot { admissions: AdmissionSnapshot[]; fingerprints: StoreFingerprint[] }

/**
 * Admission cursors of every project store and a content fingerprint of every store, taken while the
 * service is stopped. Given an earlier snapshot, project events are read only as far as it went.
 */
export function snapshotStores(ctx: Pick<DeployContext, 'projects' | 'databases'>, since?: StoreFingerprint[]): StoreSnapshot {
    return { admissions: snapshotAdmissions(ctx.projects), fingerprints: fingerprintStores(ctx.databases, { projects: ctx.projects.map(project => project.name), since }) };
}

/**
 * The stores one reading marks absent where its cursor and its fingerprint do not both say so: a
 * marker on one of them only, a missing counterpart or a malformed entry. The reading may be an
 * untyped journal receipt.
 */
function absenceDisagreements(snapshot: StoreSnapshot): string[] {
    const marked = (entry: { name: string; absent?: true }) => entry?.absent !== undefined;
    const names = new Set([...snapshot.admissions.filter(marked), ...snapshot.fingerprints.filter(marked)].map(entry => entry.name));
    return [...names].filter(name => {
        const cursor = snapshot.admissions.find(entry => entry?.name === name), digest = snapshot.fingerprints.find(entry => entry?.name === name);
        return !(cursor && absentAdmission(cursor) && digest && absentFingerprint(digest));
    }).map(String);
}

/** Why a snapshot cannot serve as the baseline for a later comparison; empty when it can. */
export function snapshotGaps(snapshot: StoreSnapshot): string[] {
    return [
        ...snapshot.admissions.filter(entry => entry.cursor === null && !absentAdmission(entry)).map(entry => `${entry.name}: admission cursor unreadable (${entry.reason ?? 'unknown'})`),
        ...snapshot.fingerprints.filter(entry => entry.digest === null && !absentFingerprint(entry)).map(entry => `${entry.name}: contents unreadable (${entry.reason ?? 'unknown'})`),
        ...absenceDisagreements(snapshot).map(name => `${name}: the admission cursor and the fingerprint disagree on whether the store exists`),
    ];
}

/**
 * What changed in the stores since `before`; empty only when no work was admitted and every store
 * holds what it held, apart from what a start under the fence writes to a project store
 * (`fenced-start-writes.ts`). A project store absent both times is unchanged; one created since is a
 * change. A snapshot that is missing or malformed, or whose cursors and fingerprints disagree on
 * which stores are absent, counts as changed.
 */
export function storesChangedSince(ctx: Pick<DeployContext, 'projects' | 'databases'>, before: unknown): string[] {
    const earlier = before as Partial<StoreSnapshot> | undefined;
    if (!Array.isArray(earlier?.admissions) || !Array.isArray(earlier?.fingerprints)) return ['no store snapshot was recorded before the start'];
    const now = snapshotStores(ctx, earlier.fingerprints), admissions = compareAdmissions(earlier.admissions, now.admissions);
    return [
        ...(admissions.status === 'unchanged' ? [] : admissions.projects.map(project => `${project.name}: ${project.reason}`)),
        ...changedStores(earlier.fingerprints, now.fingerprints).map(store => `${store.name}: ${store.reason}`),
        ...absenceDisagreements(earlier as StoreSnapshot).map(name => `${name}: the earlier snapshot's cursor and fingerprint disagree on whether the store exists`),
        ...absenceDisagreements(now).map(name => `${name}: the later snapshot's cursor and fingerprint disagree on whether the store exists`),
    ];
}
