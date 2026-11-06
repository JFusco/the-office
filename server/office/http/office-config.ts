import type { OfficeConfigSummary, OfficeProject } from '../../../src/shared';
import type { CECBinding } from '../local-config';
import { sanitizeObject } from '../security';
import { json } from './responses';

export interface OfficeConfigInputs { projects: OfficeProject[]; cec: CECBinding; holds: Record<string, string> }

/** Explicit allowlist: never spread raw bindings, which hold accounts, IDs and local paths. */
export function officeConfigSummary({ projects, cec, holds }: OfficeConfigInputs): OfficeConfigSummary {
    return sanitizeObject({
        projects: projects.map(project => {
            const board = project.board || (project.githubProject ? { name: `${project.name} GitHub board`, url: project.githubProject.url } : undefined);
            return { id: project.id, name: project.name, provider: project.provider, repository: project.repository, target: project.target, boardName: board?.name ?? null, boardUrl: board?.url ?? null };
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
