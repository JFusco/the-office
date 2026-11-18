import type { OfficeProject } from '../../src/shared';

/**
 * Whether a health service belongs in this project's IT report. Each Jira/Azure project follows
 * only its own Azure DevOps check (cec keeps the original `azure` id); every other service is shared.
 */
export function ownAzureCheck(project: Pick<OfficeProject, 'id' | 'provider'>, serviceId: string): boolean {
    if (serviceId.startsWith('azure:')) return serviceId === `azure:${project.id}`;
    return serviceId !== 'azure' || project.provider !== 'azure' || project.id === 'cec';
}
