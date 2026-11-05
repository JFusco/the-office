import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, realpathSync, readFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { Feature, FeatureDocument } from '../../src/contracts/features';
import type { Store } from '../store/store';

export const digest = (value: unknown): string => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
export const featureRoot = (store: Store, feature: Feature) => resolve(realpathSync(store.dataRoot), 'features', feature.id);
export function document(store: Store, feature: Feature, markdown: string): FeatureDocument {
    const id = randomUUID(), path = resolve(featureRoot(store, feature), 'documents', `${id}.md`);
    mkdirSync(resolve(featureRoot(store, feature), 'documents'), { recursive: true, mode: 0o700 });
    writeFileSync(path, markdown, { mode: 0o600, flag: 'wx' });
    return { id, revision: feature.revision, digest: digest(markdown), markdown, path, createdAt: store.clock.now().toISOString() };
}
export function artifactPath(store: Store, feature: Feature, id: string): string {
    const item = [...feature.briefs, ...feature.plans, ...(feature.reviewDocuments || [])].find(item => item.id === id);
    if (!item) throw new Error('Unknown feature artifact');
    const root = featureRoot(store, feature), path = realpathSync(item.path);
    if (realpathSync(root) !== root) throw new Error('Feature artifact root must not redirect through a symlink');
    if (!path.startsWith(root + sep) || digest(readFileSync(path, 'utf8')) !== item.digest) throw new Error('Feature artifact failed containment or digest check');
    return path;
}
