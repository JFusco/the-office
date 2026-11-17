import type { OfficeProject } from '../../src/shared';
import { PROJECT_BINDINGS } from './projects';
import type { AzureBinding, JiraBinding, ProjectBindings, PromptBinding } from './project-bindings-config';

type Project = Pick<OfficeProject, 'id'>;
type Registry = ReadonlyMap<string, ProjectBindings>;

function bindings(project: Project, registry: Registry): ProjectBindings {
    const found = registry.get(project.id);
    // Never fall back to another project's connection.
    if (!found) throw new Error(`Project "${project.id}" has no Jira/Azure binding`);
    return found;
}

/** This project's Jira connection and workflow. Throws for a project that has none. */
export function jiraBinding(project: Project, registry: Registry = PROJECT_BINDINGS): JiraBinding {
    return bindings(project, registry).jira;
}

/** This project's Azure DevOps connection and observed deployment. Throws for a project that has none. */
export function azureBinding(project: Project, registry: Registry = PROJECT_BINDINGS): AzureBinding {
    return bindings(project, registry).azure;
}

/** This project's delivery prompt text and values. Throws for a project that has none. */
export function promptBinding(project: Project, registry: Registry = PROJECT_BINDINGS): PromptBinding {
    return bindings(project, registry).prompt;
}
