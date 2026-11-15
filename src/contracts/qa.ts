/** One independent Office QA worker's observed result; old QA Team results remain separate. */
export interface OfficeQAReport {
    version: 1 | 2;
    ticket: string;
    commit: string;
    stage: string;
    validation: 'independent-checks' | 'browser';
    setup: {
        status: 'ready' | 'blocked';
        summary: string;
        owner: string;
        nextAction: string;
        url: string;
        actor: string;
        resources: string[];
    };
    cases: {
        id: string;
        /** Required (nullable for regression) in v2; historical v1 is unchanged. */
        criterionId?: string | null;
        check: string;
        kind: 'acceptance' | 'regression';
        status: 'passed' | 'failed' | 'blocked' | 'not-tested';
        expected: string;
        observed: string;
        evidenceIds: string[];
    }[];
    nextOwner: string;
    nextAction: string;
}
