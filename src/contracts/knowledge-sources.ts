export type KnowledgeSourceKind = 'artifact' | 'link';
export type KnowledgeSourceState = 'active' | 'paused' | 'removed' | 'withdrawn';
export type KnowledgeCadence = 'daily' | 'weekly' | 'manual';
export interface SourceSubscription { projectId: string; active: boolean; revision: number; updatedAt: string }
/** Safe list projection. Source bodies never enter snapshots. */
export interface KnowledgeSourceSummary {
    id: string; kind: KnowledgeSourceKind; title: string; homeProjectId: string;
    state: KnowledgeSourceState; cadence: KnowledgeCadence;
    revision: number; createdAt: string; updatedAt: string; subscriptions: SourceSubscription[];
    url?: string;
    pending: number; needsAttention: number; admitted: number; lastObservedAt: string; gaps: string[];
}
