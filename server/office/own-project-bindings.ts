import type { OfficeProject } from '../../src/shared';
import { STATUS_STAGES } from './jira-statuses-config';
import type { OwnBindingBlocks } from './own-binding-blocks';
import type { ProjectBindings } from './project-bindings-config';

/**
 * The resolved bindings of a Jira/Azure project other than cec, from its own blocks only. Its prompt
 * authority is its own; nothing, including the REPOSITORY line, comes from the legacy `cec` block.
 */
export function ownProjectBindings(project: Pick<OfficeProject, 'repository' | 'target'>, blocks: OwnBindingBlocks): ProjectBindings {
    const { jira, azure, prompt } = blocks, deployment = azure.deployment, statuses = jira.statuses;
    return Object.freeze({
        jira: Object.freeze({
            site: jira.site, cloudId: jira.cloudId, account: jira.account, credentialAccount: jira.credentialAccount, twgProfile: jira.twgProfile,
            projectKey: jira.projectKey, board: jira.board ?? 0,
            ...(jira.intakeListUrl === undefined ? {} : { intakeListUrl: jira.intakeListUrl }),
            statuses: Object.freeze({
                intake: Object.freeze(statuses.intake.map(status => Object.freeze({ ...status }))),
                stages: Object.freeze({ ...statuses.stages }),
                readyForStaging: statuses.readyForStaging,
                blocked: statuses.blocked,
            }),
        }),
        azure: Object.freeze({
            organization: azure.organization, project: azure.project, repositoryId: azure.repositoryId,
            deployment: Object.freeze({
                environment: deployment.environment ?? 'staging', subscription: deployment.subscription, resourceGroup: deployment.resourceGroup,
                containerApp: deployment.containerApp, container: deployment.container ?? deployment.containerApp,
                healthPath: deployment.healthPath ?? '/api/health', healthy: deployment.healthy,
            }),
        }),
        prompt: Object.freeze({
            authority: prompt.authority,
            preview: prompt.preview ?? '',
            htmlFallback: jira.htmlFallback ?? false,
            preflightStatuses: Object.freeze([...new Set(STATUS_STAGES.map(stage => statuses.stages[stage]))]),
            // Identity facts only: never accounts' credentials, profiles, subscriptions or local paths.
            repository: Object.freeze({
                site: jira.site, cloudId: jira.cloudId, account: jira.account, organization: azure.organization, project: azure.project,
                repository: project.repository, repositoryId: azure.repositoryId, target: project.target,
            }),
        }),
    });
}
