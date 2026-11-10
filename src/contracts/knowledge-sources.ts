export type KnowledgeSourceKind = 'slack' | 'artifact' | 'link';
export type KnowledgeDestination = 'project-evidence' | 'technical-brain';
export type KnowledgeSourceState = 'active' | 'paused' | 'removed' | 'withdrawn';
export type KnowledgeCadence = 'daily' | 'weekly' | 'manual';
export interface SourceSubscription { projectId: string; active: boolean; revision: number; updatedAt: string }
/** Safe list projection. Connection credentials and source bodies never enter snapshots. */
export interface KnowledgeSourceSummary {
    id: string; kind: KnowledgeSourceKind; title: string; homeProjectId: string;
    destination: KnowledgeDestination; state: KnowledgeSourceState; cadence: KnowledgeCadence;
    revision: number; createdAt: string; updatedAt: string; subscriptions: SourceSubscription[];
    workspace?: string; channelId?: string; channelName?: string; url?: string;
    pending: number; needsAttention: number; admitted: number; lastObservedAt: string; gaps: string[];
}
