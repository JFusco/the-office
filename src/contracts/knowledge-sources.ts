export type KnowledgeSourceKind = 'artifact' | 'link';
export type KnowledgeSourceState = 'active' | 'paused' | 'removed' | 'withdrawn';
export type KnowledgeCadence = 'daily' | 'weekly' | 'manual';
export interface SourceSubscription { projectId: string; active: boolean; revision: number; updatedAt: string }
/** Safe list projection. Source bodies never enter snapshots. */
