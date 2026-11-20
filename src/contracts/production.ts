/** What the Office has seen of a ticket after staging acceptance: its promotion pull request and production deploy. */
export interface ProductionFollow {
    /** The staging-to-production pull request the ticket rides on. */
    pr?: number;
    prUrl?: string;
    /** `opened` by the Office, or `joined` because one was already open. */
    prSource?: 'opened' | 'joined';
    prAt?: string;
    /** Attempts whose pull request creation was refused before sending; each is a fresh intent. */
    prAttempt?: number;
    /** The newest passed production run already checked and found not to contain the ticket's commit. */
    checkedBuildId?: number;
    /** The production run that contains the ticket's commit. */
    buildId?: number;
    deployedAt?: string;
    /** When the Office moved the Jira ticket to Ready for Production, or found it there. */
    readyAt?: string;
    /** When the ticket and its sub-tasks were Done in Jira. Nothing follows this. */
    doneAt?: string;
    /** When the Office first looked at the ticket after staging acceptance; it stops looking 30 days later. */
    since?: string;
    /** Why a Jira move is waiting on a person; kept apart from the pull request's own note. */
    statusNote?: string;
    /** Why the Office is waiting on a person, in plain words. */
    note?: string;
}
