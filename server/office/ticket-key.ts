import type { OfficeProject } from '../../src/shared';
import { jiraBinding } from './project-bindings';
import type { ProjectBindings } from './project-bindings-config';

type Project = Pick<OfficeProject, 'id' | 'provider'>;
type Registry = ReadonlyMap<string, ProjectBindings>;

/** The key prefix of this project's tickets: `GH` for GitHub issues, the Jira project key otherwise. */
export function ticketPrefix(project: Project, registry?: Registry): string {
    return project.provider === 'github' ? 'GH' : jiraBinding(project, registry).projectKey;
}

/** The ticket number when `key` belongs to this project (`PREFIX-<positive number>`), else undefined. */
export function ticketNumber(project: Project, key: unknown, registry?: Registry): number | undefined {
    if (typeof key !== 'string') return undefined;
    const prefix = `${ticketPrefix(project, registry)}-`, digits = key.slice(prefix.length);
    return key.startsWith(prefix) && /^[1-9][0-9]*$/.test(digits) ? Number(digits) : undefined;
}

/** True when `key` is one of this project's tickets. */
export function ownTicket(project: Project, key: unknown, registry?: Registry): key is string {
    return ticketNumber(project, key, registry) !== undefined;
}

/** The command-boundary check: `PREFIX-<digits>`. Identity-sensitive code uses `ownTicket`, which also rejects 0 and leading zeros. */
export function validTicket(project: Project, key: unknown, registry?: Registry): boolean {
    const prefix = `${ticketPrefix(project, registry)}-`;
    return typeof key === 'string' && key.startsWith(prefix) && /^\d+$/.test(key.slice(prefix.length));
}
