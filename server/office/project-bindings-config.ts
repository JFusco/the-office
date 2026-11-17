import type { OfficeProject } from '../../src/shared';
import type { CECBinding } from './local-config';

/** Delivery stages whose start moves the Jira issue to a status. */
export type JiraStatusStage = 'understand' | 'code-review' | 'repair-review' | 'preview' | 'qa' | 'retest';

/** One project's Jira connection and workflow, resolved at start-up. */
export interface JiraBinding {
    site: string;
    cloudId: string;
    /** Jira accountId used for assignment and actor checks. */
    account: string;
    /** Keychain account of this project's Jira API token; absent for the legacy single-account CEC entry. */
    credentialAccount?: string;
    /** Saved TWG login profile for this project's Jira calls; absent means TWG's default login. */
    twgProfile?: string;
    projectKey: string;
    board: number;
    /** When present, this list replaces board membership as the intake source. */
    intakeListUrl?: string;
    statuses: {
        intake: readonly { name: string; id: string }[];
        stages: Readonly<Record<JiraStatusStage, string>>;
        readyForStaging: string;
        blocked: string;
    };
}

/** One project's Azure DevOps connection and the staging deployment the Office observes. */
export interface AzureBinding {
    organization: string;
    project: string;
    repositoryId: string;
    deployment: {
        environment: string;
        subscription: string;
        resourceGroup: string;
        containerApp: string;
        container: string;
        healthPath: string;
        /** `cos`: 2xx plus the COS health JSON; `http-ok`: 2xx only. */
        healthy: 'cos' | 'http-ok';
    };
}

export interface ProjectBindings { jira: JiraBinding; azure: AzureBinding }

function frozen<T>(value: T): T {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(frozen); Object.freeze(value); }
    return value;
}

/**
 * The bindings CEC has always had: its connection comes from the top-level `cec` block, and its
 * workflow and deployment values are the ones that were written into the code.
 */
export function legacyCecBindings(cec: CECBinding): ProjectBindings {
    return frozen({
        jira: {
            site: cec.site, cloudId: cec.cloudId, account: cec.account, projectKey: 'CEC', board: cec.board,
            ...(cec.intakeListUrl === undefined ? {} : { intakeListUrl: cec.intakeListUrl }),
            statuses: {
                intake: [{ name: 'To Do', id: '10000' }, { name: 'Open', id: '1' }],
                stages: { understand: 'In Progress', 'code-review': 'Code Review', 'repair-review': 'Code Review', preview: 'Ready for QA', qa: 'QA', retest: 'QA' },
                readyForStaging: 'Ready for Staging',
                blocked: 'Blocked',
            },
        },
        azure: {
            organization: cec.organization, project: cec.project, repositoryId: cec.repositoryId,
            deployment: {
                environment: 'staging', subscription: 'adcd54e8-229d-4a59-89ec-1713267e3ec9', resourceGroup: 'Cumulative-OS',
                containerApp: 'ca-cos-conductor-shell-stg', container: 'ca-cos-conductor-shell-stg', healthPath: '/api/health', healthy: 'cos',
            },
        },
    });
}

/** Bindings by project id. Only the Azure project `cec` has one until the rules phase; explicit blocks, when given, supply its connection details. */
export function projectBindings(projects: readonly Pick<OfficeProject, 'id' | 'provider'>[], cec: CECBinding, explicit: ReadonlyMap<string, ProjectBindings> = new Map()): ReadonlyMap<string, ProjectBindings> {
    return new Map(projects.filter(project => project.provider === 'azure' && project.id === 'cec').map(project => [project.id, explicit.get(project.id) ?? legacyCecBindings(cec)] as const));
}
