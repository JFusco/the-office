import { cardStatus, projectCards, statusField, type Execute } from '../../board/project-graphql';
import type { Store } from '../../../store/store';

export const DEPENDABOT = 'dependabot[bot]';
/** A dependency update may change only package manifests and lockfiles. */
const MANIFEST = /(^|\/)(package\.json|pnpm-lock\.yaml|package-lock\.json|npm-shrinkwrap\.json|yarn\.lock)$/;

export interface DependabotPR { number: number; title: string; url: string; head: string; body: string }

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

/** Why this PR is not a dependency-only Dependabot update the Office may adopt, or '' when it is. */
export async function refusal(store: Store, execute: Execute, p: any): Promise<string> {
    if (p.draft)
        return 'it is a draft';
    if (!p.head?.ref?.startsWith('dependabot/'))
        return `branch ${p.head?.ref || '(none)'} is not a Dependabot branch`;
    if (p.head?.repo?.full_name !== store.project.repository)
        return 'it comes from another repository';
    if (p.base?.ref !== store.project.target)
        return `it targets ${p.base?.ref}, not ${store.project.target}`;
    const files = (await readRepo(store, execute, `pulls/${p.number}/files?per_page=100`, true)).map((f: any) => f.filename as string);
    if (!files.length)
        return 'its changed files are unavailable';
    const other = files.filter((name: string) => !MANIFEST.test(name));
    if (other.length)
        return `it changes more than package manifests and lockfiles (${other.slice(0, 5).join(', ')})`;
    const commits = await readRepo(store, execute, `pulls/${p.number}/commits?per_page=100`, true);
    // Author identity alone can be spoofed; Dependabot's commits are also GitHub-verified.
    const foreign = commits.filter((c: any) => c.author?.login !== DEPENDABOT || c.commit?.verification?.verified !== true);
    if (!commits.length || foreign.length)
        return `it has commits not authored and verified as Dependabot (${foreign.map((c: any) => String(c.sha).slice(0, 7)).join(', ') || 'none readable'})`;
    return '';
}
