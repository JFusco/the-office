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
    /** The project's ticket provider (`github` for GitHub or `azure` for Jira/Azure), or the model provider for a worker failure. */
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

/** One subject as it stood when a repair started: its key and a digest of its episode count and marker, stage, stop and head. */
export interface RepairSubject { subject: string; digest: string }

/** A repair in progress: the issue that tracks it and exactly which subjects it is for. */
export interface IncidentRepair {
    event: string;
    issue: { repository: string; number: number; url: string };
    startedAt: string;
    subjects: RepairSubject[];
}

/**
 * How the Office could resume a subject once the fix serves. Checked against the route inventory
 * (server/incidents/repair/resume-routes.ts) when the fix is bound; the handler's own
 * preconditions are checked again when a resume is admitted.
 */
export interface RepairRoute { action: string; payload: Record<string, unknown>; expectedStage: string }

/** An observable sign that a resumed subject got past what was repaired. A closed list: nothing here is executed. */
export type RepairBoundary = { kind: 'stage-result-passed'; stage: string } | { kind: 'stage-left'; stage: string } | { kind: 'record-settled' };

/** What a fix declares for one subject. Without a declared boundary a resume proves nothing about the repair. */
export type SubjectFix = RepairSubject & (
    | { disposition: 'route'; route: RepairRoute; boundary: RepairBoundary }
    | { disposition: 'undeclared-boundary'; route: RepairRoute; reason: string }
    | { disposition: 'no-route'; reason: string });

/** A fix bound to the incident, as GitHub reported it when it was bound. */
export interface IncidentFix {
    event: string;
    /** The merge commit of a merged pull request, the head of an open one, or the commit named. */
    commit: string;
    pullRequest: { number: number; head: string; merged: boolean } | null;
    /** The commit was on `main` when bound. */
    onMain: boolean;
    boundAt: string;
    bindings: SubjectFix[];
    /** Set while a verified running release is known to hold the commit, and removed when the running release no longer does. A merge or a binding never sets it. */
    deployed?: { event: string; release: { commit: string; hash: string; operation: string; activatedAt: string }; at: string };
    /**
     * The last time the mark was removed: the release it named, when it had been set, and why.
     * `not-in-release`: the verified release then running did not contain the commit.
     * `release-identity-unknown`: the running release could not be verified, so nothing showed
     * the commit was running.
     */
    withdrawn?: { event: string; reason: 'not-in-release' | 'release-identity-unknown'; release: { commit: string; hash: string; operation: string; activatedAt: string }; deployedAt: string; at: string };
}

/**
 * The Office-wide switch for automatic repair resumes. Paused until a person enables it, and every
 * change advances the revision. `invalid`: the saved switch could not be read, which counts as paused.
 */
export interface ResumeSwitch { enabled: boolean; revision: number; reason: string; at: string | null; invalid?: true }

/**
 * How a bound subject stands once its fix is found in the running release. `admitted`: its resume
 * was queued, once, for this fix. `no-route`: nothing will resume it. `gone`: it cleared, or no
 * longer stands as the fix bound it. `held`: it could be resumed and automatic resumes are paused.
 * `due`: it could be resumed and they are enabled.
 */
export type ResumeStanding = 'admitted' | 'no-route' | 'gone' | 'held' | 'due';

/**
 * Why a due subject was not resumed on a pass. `resumes-paused`: the Office-wide switch.
 * `release-unconfirmed`: the running release is not verified, or is not known to hold the fix.
 * `project-paused`: its project is paused or draining. `wait-ended`: the repair wait no longer
 * holds for that exact stop (it ran out, the stop changed, or something stronger explains it).
 * `no-record`: its project or its delivery job is not there. `key-mismatch`: the route's key is
 * not that job's. `request-pending`: another request for that key is queued or working.
 * `already-reconciled`: the same request completed earlier and stands as its own answer.
 * `not-dispatchable`: this release does not dispatch that route in that form.
 */
export type ResumeRefusal = 'resumes-paused' | 'release-unconfirmed' | 'project-paused' | 'wait-ended' | 'no-record' | 'key-mismatch' | 'request-pending' | 'already-reconciled' | 'not-dispatchable';

/** What the Office reads for one fix found in the running release. A reading only: it grants nothing and records nothing. */
export interface ResumeAssessment {
    fix: string;
    commit: string;
    release: NonNullable<IncidentFix['deployed']>['release'];
    subjects: { subject: string; standing: ResumeStanding; reason: string; action?: string }[];
}

/** A file of the running release as a verdict read it. Accepted only while the release holds that path with that hash. */
export interface SourceCitation { path: string; sha256: string; line?: number }

/**
 * A remembered verdict that the stop is correct. It holds only while the code it cited and the
 * stops it judged stay the same; once that changes it is kept, marked as lapsed.
 */
export interface IncidentDismissal {
    event: string;
    /** The verdict's own words, as evidence: one line, bounded, credentials removed. */
    reason: string;
    /** SHA-256 of the reason exactly as it was sent, so a repeated send is told from a different one. */
    reasonDigest: string;
    /** Digest of the evidence packet the verdict was formed on. */
    packet: string;
    cited: SourceCitation[];
    /** The subjects open when it was recorded, as they stood. */
    subjects: RepairSubject[];
    /** The release the citations were checked against. */
    loadedHash: string;
    dismissedAt: string;
    lapsed?: { event: string; reason: string; at: string };
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
    /** Set by `repair-started`; observation never changes it. */
    repair?: IncidentRepair;
    /** Every fix bound so far, oldest first. */
    fixes?: IncidentFix[];
    /** Every dismissal so far, oldest first; only the last can still stand. */
    dismissals?: IncidentDismissal[];
}

/**
 * What the Office knows about one incident, bounded and hashed. Every list that is cut states its
 * total. `digest` is the SHA-256 of the rest in canonical form, exactly as it is handed out, with
 * credentials already removed from every string; a packet has no time of its own.
 */
export interface EvidencePacket {
    version: 1;
    incident: Pick<Incident, 'id' | 'fingerprint' | 'state' | 'revision' | 'cause' | 'expected' | 'research' | 'firstObservedAt' | 'lastObservedAt'>;
    release: { loadedHash: string; status: 'verified' | 'unknown'; commit: string | null; manifestDigest: string | null; operation: string | null; activatedAt: string | null; reason: string | null };
    /** `included` is a prefix of the ordered subjects: at most fifty, and no more than fit the packet's size. */
    subjects: {
        total: number; open: number;
        included: (RepairSubject & Pick<IncidentSubjectRecord, 'projectId' | 'kind' | 'id' | 'status' | 'stage' | 'stop' | 'lastWorker' | 'head' | 'unsettledEffect' | 'expected' | 'sources' | 'episode' | 'episodeCount' | 'openedAt' | 'clearedAt' | 'evidence'>)[];
    };
    repair: { event: string; issue: IncidentRepair['issue']; startedAt: string; subjects: number } | null;
    fixes: { total: number; recent: (Pick<IncidentFix, 'event' | 'commit' | 'pullRequest' | 'onMain' | 'boundAt'> & { bindings: number; deployed: IncidentFix['deployed'] | null })[] };
    dismissals: { total: number; recent: (Pick<IncidentDismissal, 'event' | 'reason' | 'packet' | 'cited' | 'loadedHash' | 'dismissedAt'> & { subjects: number; lapsed: IncidentDismissal['lapsed'] | null })[] };
    events: { total: number; recent: Pick<IncidentEvent, 'id' | 'at' | 'kind'>[] };
    digest: string;
}

/**
 * The first six are written by observation. `repair-started`, `fix-bound` and `dismissed` are
 * written by a person or the repair runner through the Office. `fix-deployed`, `fix-withdrawn`,
 * `release-identity-unknown`, `dismissal-invalidated`, `repair-wait-expired`, `resume-admitted`
 * and `resume-refused` are written by the Office itself.
 */
export type IncidentEventKind = 'incident-observed' | 'subject-observed' | 'episode-observed' | 'subject-cleared' | 'research-promoted' | 'research-withdrawn' | 'repair-started' | 'fix-bound' | 'fix-deployed' | 'fix-withdrawn' | 'release-identity-unknown' | 'dismissed' | 'dismissal-invalidated' | 'repair-wait-expired' | 'resume-admitted' | 'resume-refused';

export interface IncidentEvent {
    /** Stable: the same event recorded twice is one event. */
    id: string;
    incident: string;
    at: string;
    kind: IncidentEventKind;
    body: Record<string, unknown>;
}

export const subjectKey = (subject: Pick<IncidentSubject, 'projectId' | 'kind' | 'id'>) => `${subject.projectId}/${subject.kind}/${subject.id}`;
