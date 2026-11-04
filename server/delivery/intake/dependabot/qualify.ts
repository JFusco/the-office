import { cardStatus, projectCards, statusField, type Execute } from '../../board/project-graphql';
import type { Store } from '../../../store/store';

export const DEPENDABOT = 'dependabot[bot]';

export interface DependabotPR { bot?: 'dependabot' | 'pin-courier'; number: number; title: string; url: string; head: string; body: string }

export async function readRepo(store: Store, execute: Execute, path: string, paginate = false): Promise<any> {
    const args = ['api', `repos/${store.project.repository}/${path}`, ...(paginate ? ['--paginate', '--slurp'] : [])];
    const data = JSON.parse(await execute('gh', args, { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (paginate && (!Array.isArray(data) || data.some(page => !Array.isArray(page))))
        throw new Error(`Incomplete GitHub response for ${path}`);
    return paginate ? data.flat() : data;
}

export function dependabotPR(p: any): DependabotPR {
    return { number: p.number, title: p.title, url: p.html_url, head: p.head?.sha || '', body: p.body || '' };
}

/** Open Dependabot PRs, read once per poll. */
export async function openDependabotPulls(store: Store, execute: Execute): Promise<any[]> {
    return (await readRepo(store, execute, 'pulls?state=open&per_page=100', true)).filter((p: any) => p.user?.login === DEPENDABOT);
}

/** The subset whose board card a person moved to the pickup lane. */
export async function inPickupLane(store: Store, execute: Execute, pulls: any[], lane: string): Promise<any[]> {
    if (!pulls.length || !store.project.githubProject)
        return [];
    const field = await statusField(store, execute);
    const option = field.options.find(o => o.name.trim().toLowerCase() === lane.trim().toLowerCase());
    if (!option)
        return [];
    const cards = await projectCards(store, execute, field.projectId, pulls.map(p => ({ kind: 'PullRequest' as const, number: p.number })));
    const ready: any[] = [];
    for (const p of pulls) {
        const card = cards.find(c => c.kind === 'PullRequest' && c.number === p.number);
        if (card && await cardStatus(store, execute, card.id, field.fieldId) === option.id)
            ready.push(p);
    }
    return ready;
}

/**
 * Why this is not genuinely Dependabot's own PR, or '' when it is. Joe's rule: no project refuses a Dependabot
 * update for what it changes (npm, GitHub Actions or any other ecosystem); only someone else's commits disqualify it.
 */
export async function refusal(store: Store, execute: Execute, p: any): Promise<string> {
    if (p.draft)
        return 'it is a draft';
    if (!p.head?.ref?.startsWith('dependabot/'))
        return `branch ${p.head?.ref || '(none)'} is not a Dependabot branch`;
    if (p.head?.repo?.full_name !== store.project.repository)
        return 'it comes from another repository';
    if (p.base?.ref !== store.project.target)
        return `it targets ${p.base?.ref}, not ${store.project.target}`;
    const commits = await readRepo(store, execute, `pulls/${p.number}/commits?per_page=100`, true);
    // Author identity alone can be spoofed; Dependabot's commits are also GitHub-verified.
    // An author email can be set by anyone; Dependabot's commits are also committed and signed by GitHub itself (web-flow).
    const foreign = commits.filter((c: any) => c.author?.login !== DEPENDABOT || c.committer?.login !== 'web-flow' || c.commit?.verification?.verified !== true);
    if (!commits.length || foreign.length)
        return `it has commits not authored and verified as Dependabot (${foreign.map((c: any) => String(c.sha).slice(0, 7)).join(', ') || 'none readable'})`;
    return '';
}
