import type { Store } from '../../store/store';
import { SlackReadAuthority } from '../slack-intake/read-authority';
import type { SourceRegistry } from './registry';
import { sourceDigest, type KnowledgeSource } from './source-record';

/** Collection policy belongs to the harness; only readAuthority enters the reader profile. */
export type CollectionPolicy = SlackReadAuthority & {
    sourceId: string; homeProjectId: string; destination: KnowledgeSource['destination']; sourceDigest: string; domains: string[];
};
export function collectionPolicy(source: KnowledgeSource): CollectionPolicy {
    if (source.kind !== 'slack' || sourceDigest(source) !== source.sourceDigest) throw Error('Invalid source authority digest');
    return { ...SlackReadAuthority.parse(source.authority), sourceId: source.id, homeProjectId: source.homeProjectId,
        destination: source.destination, sourceDigest: source.sourceDigest, domains: source.domains || [] };
}
export function readAuthority(policy: CollectionPolicy): SlackReadAuthority {
    const { workspace, appId, channels, tools, publicHosts } = policy;
    return SlackReadAuthority.parse({ workspace, appId, channels, tools, publicHosts });
}
export function collectionAllowed(registry: SourceRegistry, store: Store, policy: Pick<CollectionPolicy,'sourceId'|'sourceDigest'>): boolean {
    const source = registry.get(policy.sourceId);
    return registry.meta<{ state: string }>('cutover')?.state === 'ready' && !!source && source.state === 'active'
        && source.homeProjectId === store.project.id && source.sourceDigest === policy.sourceDigest && sourceDigest(source) === policy.sourceDigest
        && !!store.state.knowledge?.enabled && !store.state.paused && !store.state.draining;
}
