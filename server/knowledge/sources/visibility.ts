import type { SourceRegistry } from './registry';
/** Removal stops collection, not historical access. Withdrawal and revoked grants stop delivery. */
export function sourceVisible(registry: SourceRegistry, sourceId: string, projectId: string, purpose:'metadata'|'evidence'|'home-inspection'='metadata'): boolean {
    const source = registry.get(sourceId);
    return !!source && source.state !== 'withdrawn' && registry.authorized(sourceId, projectId)
        && (purpose==='metadata'||source.destination==='project-evidence'||purpose==='home-inspection'&&source.homeProjectId===projectId);
}
