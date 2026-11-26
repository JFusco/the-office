import { readRepo } from '../../intake/dependabot/qualify';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { RedoPayload } from './ledger';

export const API_VERSION = 'X-GitHub-Api-Version: 2026-03-10';
/** The canonical maintenance title/body pairs and the workflow that writes each; the release-policy title suffix is allowed. */
const MAINTENANCE = [
    { title: 'docs(wiki): weekly issue and merge reconciliation', body: /^Automated, reviewable weekly refresh of cited issue state and missed merge reconciliation\./, workflow: 'wiki-issue-sync.yml' },
    { title: 'docs(wiki): reconcile missed merges', body: /^Automated, reviewable batch wiki reconciliation\./, workflow: 'wiki-sync.yml' },
] as const;

/** The workflow that regenerates this qualified wiki PR and its inputs, or why there is none. */
export function wikiWorkflow(pr: any): { route: 'wiki-sync.yml' | 'wiki-issue-sync.yml'; inputs: Record<string, string> } | string {
    const parent = /^bot\/wiki-sync\/([1-9]\d*)$/.exec(pr.head?.ref || '')?.[1];
    if (parent) return { route: 'wiki-sync.yml', inputs: { pr_number: parent } };
    if (pr.head?.ref !== 'bot/wiki-maintenance') return 'it is not a canonical wiki automation branch';
    const title = String(pr.title || '').replace(/ \[skip release\]$/, ''), match = MAINTENANCE.find(m => m.title === title && m.body.test(pr.body || ''));
    return match ? { route: match.workflow, inputs: {} } : 'its title and body name no canonical wiki maintenance workflow';
}

export class WikiDispatchRefMismatch extends Error {}

/** The dispatch ref: the repository's live default branch, which must also be the configured target and the PR's base. */
export async function dispatchRef(delivery: GitHubDelivery, pr: any): Promise<string> {
    const { store } = delivery, repo = await delivery.api('');
    if (repo.full_name !== store.project.repository || repo.default_branch !== store.project.target || pr.base?.ref !== store.project.target)
        throw new WikiDispatchRefMismatch('The wiki dispatch ref is not the live default branch, the configured target and the PR base');
    return store.project.target;
}

export const dispatchArgs = (repository: string, workflow: string, ref: string, inputs: Record<string, string>) =>
    ['api', '-X', 'POST', '-H', API_VERSION, `repos/${repository}/actions/workflows/${workflow}/dispatches`, '-f', `ref=${ref}`,
        ...Object.entries(inputs).flatMap(([name, value]) => ['-f', `inputs[${name}]=${value}`])];

export interface WikiRun { id: number; url: string; status: string; conclusion: string; attempt?: number; completedAt?: string }

/** Read-only: the exact run the dispatch returned, matched on repository, ID, workflow path, event, ref and dispatch time. */
export async function dispatchedRun(delivery: GitHubDelivery, payload: RedoPayload, receipt: any, dispatchedAt: string): Promise<WikiRun | null> {
    const { store, execute } = delivery, id = Number(receipt?.workflow_run_id);
    if (!Number.isSafeInteger(id) || id <= 0 || !Date.parse(dispatchedAt)) return null;
    const run = await readRepo(store, execute, `actions/runs/${id}`);
    if (run.id !== id || run.repository?.full_name !== store.project.repository || run.path !== `.github/workflows/${payload.route}` ||
        run.event !== 'workflow_dispatch' || run.head_branch !== payload.target || !(Date.parse(run.created_at) >= Date.parse(dispatchedAt) - 120_000)) return null;
    return { id, url: run.html_url, status: run.status || '', conclusion: run.conclusion || '',
        ...(Number.isSafeInteger(run.run_attempt) && run.run_attempt > 0 ? { attempt: run.run_attempt } : {}),
        ...(run.status === 'completed' ? { completedAt: run.updated_at } : {}) };
}
