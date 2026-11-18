import type { BindingBlocks } from './project-binding-blocks';

type Entry = { id: string; provider: string; bindingBlocks?: BindingBlocks };

/** Each configured Jira project owns its ticket keys: the cec project's key is `CEC`, any other's its `jira.projectKey`. */
export function assertUniqueProjectKeys(projects: readonly Entry[]): void {
    const owners = new Map<string, string>();
    // cec claims CEC first, so a clash is reported on the project that wrote the key.
    for (const project of [...projects].sort((a, b) => Number(b.id === 'cec') - Number(a.id === 'cec'))) {
        if (project.provider !== 'azure') continue;
        const key = project.id === 'cec' ? 'CEC' : project.bindingBlocks?.jira.projectKey;
        if (key === undefined) continue;
        const owner = owners.get(key);
        if (owner !== undefined) throw new Error(`Project "${project.id}": jira.projectKey is already used by project "${owner}"`);
        owners.set(key, project.id);
    }
}
