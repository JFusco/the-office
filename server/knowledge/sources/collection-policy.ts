import type { Store } from '../../store/store';
import type { SourceRegistry } from './registry';
import { sourceDigest } from './source-record';

/** Collection runs only for an active source in its home project, with learning on and the project not paused or draining. */
export function collectionAllowed(registry: SourceRegistry, store: Store, policy: { sourceId: string; sourceDigest: string }): boolean {
    const source = registry.get(policy.sourceId);
    return !!source && source.state === 'active'
        && source.homeProjectId === store.project.id && source.sourceDigest === policy.sourceDigest && sourceDigest(source) === policy.sourceDigest
        && !!store.state.knowledge?.enabled && !store.state.paused && !store.state.draining;
}
