import type { OfficeProject } from '../../../src/shared';
import { jiraBinding } from '../../office/project-bindings';

/** The status automatic pickup waits for when no pickup setting has been saved: `Ready` on GitHub, the first configured Jira intake status otherwise. */
export function defaultPickupStatus(project: Pick<OfficeProject, 'id' | 'provider'>): string {
    return project.provider === 'github' ? 'Ready' : jiraBinding(project).statuses.intake[0].name;
}
