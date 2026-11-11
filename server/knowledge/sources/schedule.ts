import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';
import type { KnowledgeRunner } from '../run-retrospective';
import { scanText, type SecretScanner } from './admission';
import { publicSourceWork } from './public-source';
import type { SourceRegistry } from './registry';

/** Due reads for the public pages this project registered, rotated so one source cannot starve the others. */
export function scheduledSources(store: Store, run: KnowledgeRunner, now: Date, registry?: SourceRegistry, scan: SecretScanner = scanText): ScheduledWork[] {
    if (!registry) return [];
    const sources = registry.home(store.project.id).filter(source => source.kind === 'link');
    const previous = sources.findIndex(source => source.id === registry.meta<string>(`rotation:${store.project.id}`));
    return [...sources.slice(previous + 1), ...sources.slice(0, previous + 1)].flatMap(source => {
        try { const work = publicSourceWork(store, run, now, registry, source, scan); return work ? [work] : []; }
        catch { return [{ store, work: { projectId: store.project.id, kind: 'knowledge-source' as const, id: `source:${source.id}` }, stage: 'knowledge-source-read', rank: 5, enqueuedAt: source.createdAt,
            eligibility: { state: 'blocked' as const, reason: 'Source configuration needs attention', owner: 'Harper', nextCheckAt: null }, identity: () => `invalid:${source.id}:${source.revision}`, execute: async () => undefined }]; }
    });
}
