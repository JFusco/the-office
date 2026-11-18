import type { OfficeConfigSummary, OfficeProject } from '../../../src/shared';
import type { CECBinding } from '../local-config';
import type { ProjectBindings } from '../project-bindings-config';
import type { ProjectPolicyInput } from '../project-policy-config';
import { sanitizeObject } from '../security';
import { projectSettingsSummary } from './project-settings-summary';
import { json } from './responses';

export interface OfficeConfigInputs {
    projects: OfficeProject[]; cec: CECBinding; holds: Record<string, string>;
    /** Each Jira/Azure project's resolved binding; absent lists no project's connection. */
    bindings?: ReadonlyMap<string, ProjectBindings>;
    /** Each project's configured policy block; absent resolves every policy from its defaults. */
    policies?: ReadonlyMap<string, ProjectPolicyInput>;
}

/** Explicit allowlist: never spread raw bindings, which hold accounts, IDs and local paths. */
export function officeConfigSummary({ projects, cec, holds, bindings = new Map(), policies = new Map() }: OfficeConfigInputs): OfficeConfigSummary {
    return sanitizeObject({
        projects: projects.map(project => {
            const board = project.board || (project.githubProject ? { name: `${project.name} GitHub board`, url: project.githubProject.url } : undefined);
            return { id: project.id, name: project.name, provider: project.provider, repository: project.repository, target: project.target, boardName: board?.name ?? null, boardUrl: board?.url ?? null, ...projectSettingsSummary(project, bindings, policies) };
        }),
        cec: { site: cec.site, organization: cec.organization, project: cec.project, repository: cec.repository, target: cec.target },
        holds: Object.entries(holds).map(([key, reason]) => ({ key, reason })),
    });
}

/** GET /api/office-config: the effective configuration loaded at startup. */
export async function officeConfigRoute(req: Request, url: URL, context: { config: OfficeConfigInputs }): Promise<Response | undefined> {
    if (url.pathname !== '/api/office-config') return undefined;
    if (req.method !== 'GET') return json({ error: 'GET required' }, 405);
    return json(officeConfigSummary(context.config));
}
