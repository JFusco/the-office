import { createHash } from 'node:crypto';
import type { GitHubDelivery } from './github-delivery';

function issueScope(issue: any) {
    return { number: issue.number, html_url: issue.html_url, state: issue.state, updated_at: issue.updated_at, title: issue.title, body: issue.body,
        labels: issue.labels.map((label: any) => typeof label === 'string' ? label : { id: label.id, name: label.name }),
        assignees: issue.assignees.map((person: any) => ({ id: person.id, login: person.login })) };
}

/** Read-only provider observations; no worker, acceptance, mutation or scheduling policy. */
export async function readValidationProviderContext(delivery: GitHubDelivery, key: string) {
    const { store, engine } = delivery;
    if (store.project.provider !== 'github' || !/^GH-[1-9]\d*$/.test(key)) throw new Error('Qualified GitHub validation target required');
    const number = Number(key.slice(3)), issueUrl = `https://github.com/${store.project.repository}/issues/${number}`;
    const issueApiUrl = `https://api.github.com/repos/${store.project.repository}/issues/${number}`;
    const issue = await delivery.api(`issues/${number}`);
    if (!issue || issue.number !== number || issue.html_url !== issueUrl || issue.state !== 'open' || issue.pull_request ||
        !Array.isArray(issue.assignees) || !issue.assignees.some((person: any) => person?.login === 'JFusco')) throw new Error('Open assigned issue required');
    if (typeof issue.title !== 'string' || issue.body !== null && typeof issue.body !== 'string' ||
        typeof issue.updated_at !== 'string' || !issue.updated_at || !Array.isArray(issue.labels) ||
        issue.labels.some((label: any) => typeof label === 'string' ? !label : !label || typeof label.name !== 'string' || !label.name) ||
        issue.assignees.some((person: any) => !person || typeof person.login !== 'string' || !person.login)) throw new Error('Current issue scope is unavailable');
    const comments: { id: number; html_url: string; body: string; user: unknown; author_association: unknown; created_at: unknown; updated_at: unknown }[] = [];
    const seen = new Set<number>();
    let complete = false;
    for (let page = 1; page <= 20; page++) {
        const entries = await delivery.api(`issues/${number}/comments?per_page=100&page=${page}`);
        if (!Array.isArray(entries) || entries.length > 100) throw new Error('Current issue comment coverage is unavailable');
        for (const comment of entries) {
            if (!comment || !Number.isSafeInteger(comment.id) || comment.id < 1 || seen.has(comment.id) || comment.issue_url !== issueApiUrl ||
                comment.html_url !== `${issueUrl}#issuecomment-${comment.id}` || typeof comment.body !== 'string' ||
                comment.user !== null && (typeof comment.user?.login !== 'string' || !comment.user.login) ||
                typeof comment.author_association !== 'string' || !comment.author_association ||
                typeof comment.created_at !== 'string' || !comment.created_at || typeof comment.updated_at !== 'string' || !comment.updated_at)
                throw new Error('Current issue comment identity or pagination is unverified');
            seen.add(comment.id);
            comments.push({ id: comment.id, html_url: comment.html_url, body: comment.body, user: comment.user === null ? null : { login: comment.user.login },
                author_association: comment.author_association, created_at: comment.created_at, updated_at: comment.updated_at });
        }
        if (Buffer.byteLength(JSON.stringify(comments), 'utf8') > 1024 * 1024) throw new Error('Current issue comment context exceeds the bounded packet; none was truncated');
        if (entries.length < 100) { complete = true; break; }
    }
    if (!complete) throw new Error('Current issue comment pagination exceeds the bounded packet; none was truncated');
    const board = await engine.github.board();
    const cards = board?.items.filter(item => item.repository === store.project.repository && item.number === number) || [];
    if (!board || board.error || cards.length !== 1 || !cards[0].id || !['Ready', 'In progress', 'In review'].includes(cards[0].status)) throw new Error('Current authorized board lane required');
    const context = { source: 'Office read-only GitHub adapter', projectId: store.project.id, repository: store.project.repository, ticket: key,
        observedAt: store.clock.now().toISOString(), issue: issueScope(issue), comments, board: { url: store.project.githubProject?.url, item: structuredClone(cards[0]) } };
    if (Buffer.byteLength(JSON.stringify(context), 'utf8') > 1024 * 1024) throw new Error('Current issue comment context exceeds the bounded packet; none was truncated');
    return context;
}

/** Exclude observation time and unrelated API metadata; never exclude scope, comments or lane. */
export function validationProviderVersion(context: Awaited<ReturnType<typeof readValidationProviderContext>>) {
    return createHash('sha256').update(JSON.stringify({ projectId: context.projectId, repository: context.repository, ticket: context.ticket,
        issue: issueScope(context.issue),
        comments: context.comments, board: context.board })).digest('hex');
}
