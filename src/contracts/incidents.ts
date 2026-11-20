/**
 * The office-wide incident record: one incident per cause, across projects, with every affected
 * subject bound exactly. An incident describes stopped work; it never grants a retry, a resume or
 * any authority over it.
 */
export type IncidentState = 'observed' | 'triaged' | 'fixing' | 'shipped' | 'deployed' | 'verified' | 'recurred' | 'housekept' | 'dismissed' | 'needs-joe' | 'abandoned';

/** Where a signal was read. `runner` is reserved for the repair runner's own failures. */
export type IncidentSource = 'stopped-work' | 'worker-failure' | 'it-recovery' | 'it-investigation' | 'improvement' | 'provider-error' | 'slack-delivery' | 'outbox' | 'runner';

/** A stop the Office already understands. Recognised from typed fields only, never from wording. */
export type ExpectedWait = 'hold' | 'decision' | 'merge-approval' | 'prerequisite' | 'pause' | 'authentication' | 'provider-wait' | 'retry' | 'uncertain-effect' | 'question';

export interface IncidentCause {
    source: IncidentSource;
    /** The project's ticket provider (`github`, `jira`), or the model provider for a worker failure. */
    provider: string;
    stage: string;
    /** The typed cause the harness recorded: a stop kind, a blocked cause, a failure category. */
    kind: string;
    /** Normalized text of a cause the harness wrote. Empty otherwise: only harness wording is identity. */
    text: string;
    /**
     * Who wrote the stop's explanation. `model`: it repeats what a model's saved result said.
     * `unknown`: the record does not say where its text came from. Only `harness` text groups
     * subjects; the other two are identified by their subject.
     */
    author: 'harness' | 'model' | 'unknown';
}

/** Exactly which work is affected. A shared fingerprint says nothing about another subject. */
export interface IncidentSubject {
    projectId: string;
    kind: string;
    /** The source record's own stable ID. */
    id: string;
    /** One stop of this subject; a later stop for the same cause is a new episode. */
    episode: string;
    stage: string;
    stop: { kind: string; at: string } | null;
    lastWorker: string;
    /** The candidate head the handler recorded, in that handler's own meaning. */
    head: string;
    /** A write for this subject is still dispatching or uncertain: read-back only. */
    unsettledEffect: boolean;
}

export interface IncidentCandidate {
    subject: IncidentSubject;
    cause: IncidentCause;
    expected: ExpectedWait | null;
    /** Sanitized and bounded. Never a conversation body. */
    evidence: string;
    /** Subject keys of other sources' records of this same stop; they are folded into this one. */
    absorbs?: string[];
}

export interface IncidentSubjectRecord extends IncidentSubject {
    status: 'open' | 'cleared';
    /** This subject's own explanation; subjects of one incident can carry different ones. */
    expected: ExpectedWait | null;
    sources: IncidentSource[];
    evidence: string;
    firstObservedAt: string;
    lastObservedAt: string;
    /** When the signal was last found again after being absent, or first found. */
    openedAt: string;
    clearedAt: string | null;
    /** The most recent episodes, oldest first; `episodeCount` is the total, and every return after a clear is one. */
    episodes: string[];
    episodeCount: number;
}

/** Whether the incident may be investigated now. Withdrawn as soon as no reason for it holds. */
export interface IncidentResearch {
    eligible: boolean;
    reason: string;
    at: string | null;
}

export interface Incident {
    id: string;
    fingerprint: string;
    state: IncidentState;
    revision: number;
    cause: IncidentCause;
    /** The explanation every open subject shares; null when one has none or they differ. */
    expected: ExpectedWait | null;
    research: IncidentResearch;
    firstObservedAt: string;
    lastObservedAt: string;
    subjects: IncidentSubjectRecord[];
}

export type IncidentEventKind = 'incident-observed' | 'subject-observed' | 'episode-observed' | 'subject-cleared' | 'research-promoted' | 'research-withdrawn';

export interface IncidentEvent {
    /** Stable: the same event recorded twice is one event. */
    id: string;
    incident: string;
    at: string;
    kind: IncidentEventKind;
    body: Record<string, unknown>;
}

export const subjectKey = (subject: Pick<IncidentSubject, 'projectId' | 'kind' | 'id'>) => `${subject.projectId}/${subject.kind}/${subject.id}`;
