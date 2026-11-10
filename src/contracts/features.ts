import type { QueueTiming } from './work';

export type FeaturePhase = 'discovery' | 'plan' | 'review' | 'approval' | 'delivery' | 'complete';
export interface FeatureDocument { id: string; revision: number; digest: string; markdown: string; path: string; createdAt: string }
export interface FeatureOption { id: string; label: string; tradeoff: string }
export interface FeatureQuestion { id: string; question: string; recommendation: string; choices: string[]; options?: FeatureOption[]; recommendedOptionId?: string }
export type FeatureRoundAuthor = 'product' | 'review' | 'harness';
export type FeatureHarnessAction = 'retry' | 'release-to-ordinary' | 'pause';
export interface FeatureHarnessOption extends FeatureOption { action: FeatureHarnessAction; target: string; preconditionsDigest: string }
export interface FeatureRound { id: string; revision: number; questions: FeatureQuestion[]; answers: Record<string, string>; createdAt: string; reviewRevision?: number; reviewRun?: string; author?: FeatureRoundAuthor; options?: FeatureHarnessOption[]; notes?: { id: string; text: string; at: string }[]; resolvedAt?: string }
export type FeatureProgression = 'manual' | 'automatic';
export type FeatureWait = 'policy' | 'pause' | 'questions' | 'provider' | 'processes' | 'fence' | 'capacity' | 'prerequisites' | 'retry';
export interface FeatureRecovery {
    stage: string; revision: number; generation: number; attempts: number; replacements: string[];
    nextAt: string | null; wait?: FeatureWait; diagnosticUsed?: boolean; detail: string;
}
export interface FeatureEvidenceRef { artifact: string; sha256: string; evidenceDigest: string; capturedAt: string; coverage: 'complete' | 'truncated' | 'unreadable' | 'permission-denied' }
export interface FeatureHandoff { episodeId: string; key: string; assessmentId: string; policyDigest: string; evidence: FeatureEvidenceRef; rationale: string; requirements: string[]; acceptanceCriteria: string[]; settledDecisions: string[]; openQuestions: string[] }
export interface FeatureRelease { id: string; revision: number; at: string; outcome: 'authorized' | 'replan' | 'ordinary'; detail: string }
export interface FeaturePolicyAuthority { kind: 'policy'; projectId: string; policyDigest: string; policyVersion: string; evidenceDigest?: string }
export type FeatureAuthority = { kind: 'human'; actor: 'Joe' } | FeaturePolicyAuthority;
export interface FeatureQuestionProjection { projectId: string; projectName: string; ticket?: string; featureId: string; title: string; asker: FeatureRoundAuthor; revision: number; roundId: string; createdAt: string; questions: FeatureQuestion[]; options?: FeatureOption[] }
export interface FeaturePlanningActivation { assessment: boolean; progression: FeatureProgression; policyDigest: string }
export interface FeatureBaseline { repository: string; remote?: string; ref: string; sha: string; path: string; files: Record<string, { digest: string; mode: number }>; scope: string[] }
export interface FeatureOperation {
    id: string; kind: 'create' | 'update' | 'assign' | 'board' | 'transition';
    payload: Record<string, unknown>; expected: Record<string, unknown>;
}
export interface FeatureManifestItem {
    id: string; title: string; key: string; action: 'create' | 'update'; predecessor: string;
    criteria: string[]; review?: 'focused' | 'full'; validation?: 'developer-checks' | 'independent-checks' | 'browser'; checks?: string[]; operations: FeatureOperation[];
}
export interface FeatureManifest { provider: 'github' | 'azure'; destination: string; items: FeatureManifestItem[] }
export interface FeatureApproval {
    id: string; projectId: string; featureId: string; digest: string; featureRevision: number; briefDigest: string; planDigest: string;
    manifestDigest: string; manifest: FeatureManifest; reviewRun: string; reviewRevision: number;
    researchDigest: string; helperCommit: string; baselineSha: string; observedSha: string;
    comparisonDigest: string; approver: 'Joe' | 'policy'; requestId: string; at: string; authority?: FeatureAuthority;
}
export interface FeaturePublicationItem {
    id: string; key: string; url: string; approvalId: string; verified: boolean; queued: boolean;
    createIntent?: string; effects: string[]; fence: boolean; startedApprovalId?: string; ownerId?: string;
    handoff?: { featureId: string; itemId: string; approvalId: string; kind: 'request' | 'review' | 'job'; id: string };
}
export interface FeatureAttempt {
    id: string; stage: string; revision: number; baselineSha: string;
    status: 'queued' | 'working' | 'completed' | 'interrupted' | 'failed'; startedAt: string; endedAt: string; replacementOf?: string;
}
export interface FeatureReview {
    attemptDir: string; run: string; helper: string; helperCommit: string; revision: number; fingerprint: string;
    researchDigest: string; status: string; stage: string; processes: number[]; lockPath?: string;
    acceptedArtifact: string; acceptedDigest: string; pendingDecision?: string; pendingQuestions?: FeatureQuestion[]; pendingRecovery?: boolean; stoppedCalls?: string[]; profiles?: Record<string, unknown>; fallbacks?: Record<string, unknown[]>;
}
export interface Feature {
    progression?: FeatureProgression; policyDigest?: string; handoff?: FeatureHandoff; evidence?: FeatureEvidenceRef;
    recovery?: FeatureRecovery; recoveryHistory?: FeatureRecovery[]; lifetimeReplans?: number; releases?: FeatureRelease[];
    id: string; projectId: string; title: string; intent: string; sourceGoalId: string; sourceTicket: string;
    revision: number; phase: FeaturePhase; status: 'queued' | 'working' | 'waiting' | 'blocked' | 'completed';
    paused: boolean; detail: string; createdAt: string; updatedAt: string; enqueuedAt: string;
    links?: { projectId: string; id: string; title: string }[];
    rounds: FeatureRound[]; reviewDocuments?: FeatureDocument[]; briefs: FeatureDocument[]; plans: FeatureDocument[];
    conversation: { id: string; role: 'human' | 'analyst' | 'developer' | 'review' | 'pm' | 'harness'; text: string; at: string }[];
    baseline?: FeatureBaseline; baselineHistory?: FeatureBaseline[]; manifest?: FeatureManifest; review?: FeatureReview;
    approvals: FeatureApproval[]; publication: FeaturePublicationItem[]; attempts: FeatureAttempt[];
    activeAttempt?: string; confirmedBrief?: string; timing: QueueTiming[];
    requests: Record<string, { digest: string; resultRevision: number; response?: string }>;
    reviewHistory: FeatureReview[];
}
export interface FeatureBinding { featureId: string; itemId: string; approvalId: string; approvalDigest: string }
