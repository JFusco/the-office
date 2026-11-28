import { readRepo } from '../../delivery/intake/dependabot/qualify';
import { carriesMarker } from './issue-content';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { EffectIntent } from '../../../src/shared';

type Execute = typeof command;
export interface GitHubIssue { number: number; node_id: string; html_url: string; state: string; title: string; body: string | null; labels: { name: string }[]; assignees: { login: string }[]; user?: { login: string } | null; pull_request?: unknown }

/** Every issue of the repository, open and closed, every page, without pull requests. An incomplete page set throws. */
export async function allIssues(store: Store, execute: Execute): Promise<GitHubIssue[]> {
    const rows = await readRepo(store, execute, 'issues?state=all&per_page=100', true) as GitHubIssue[];
    return rows.filter(issue => !issue.pull_request);
}

/** The keyed marker and the exact title, matched separately over the complete listing. */
export interface IssueMatches { marker: GitHubIssue[]; title: GitHubIssue[] }
export function matchIssues(issues: readonly GitHubIssue[], key: string, title: string): IssueMatches {
    return { marker: issues.filter(issue => carriesMarker(issue.body, key)), title: issues.filter(issue => issue.title === title) };
}

/** An issue identity an earlier run established for a key: from its saved progress, or from a verified create's receipt. */
export interface KnownIssue { number: number; url?: string; nodeId?: string }

/**
 * Every issue identity earlier maintenance runs verified for this key, whatever run found it: the issue a candidate
 * or Brain routing recorded, and the issue a verified maintenance create's receipt names for this project and key
 * (a lost create settled by read-back before its run recorded the issue still counts).
 */
export function knownIdentities(store: Pick<Store, 'state' | 'db' | 'project'>, key: string): KnownIssue[] {
    const known: KnownIssue[] = [];
    for (const run of store.state.maintenance?.runs || []) {
        for (const candidate of run.publication?.candidates || []) if (candidate.key === key && candidate.issue) known.push({ number: candidate.issue.number, url: candidate.issue.url, nodeId: candidate.issue.nodeId });
        const routing = run.blockerFollowup?.routing;
        if (routing?.key === key && routing.issue) known.push({ number: routing.issue.number, url: routing.issue.url, nodeId: routing.issue.nodeId });
    }
    const verified = store.db.prepare(`SELECT body FROM effects WHERE status = 'verified'
        AND json_extract(body,'$.operation') = 'github-issue-create' AND json_extract(body,'$.work.kind') = 'maintenance'
        AND json_extract(body,'$.work.projectId') = ? AND json_extract(body,'$.payload.key') = ?`).all(store.project.id, key) as { body: string }[];
    for (const row of verified) {
        const receipt = (JSON.parse(row.body) as EffectIntent).receipt as Partial<KnownIssue> | null;
        if (receipt && Number.isSafeInteger(receipt.number)) known.push({ number: receipt.number!, url: receipt.url, nodeId: receipt.nodeId });
    }
    return known;
}

/** Issue numbers earlier maintenance runs verified for this key (`knownIdentities`). */
export function knownIssues(store: Pick<Store, 'state' | 'db' | 'project'>, key: string): number[] {
    return [...new Set(knownIdentities(store, key).map(issue => issue.number))];
}

/** Attempted issue creates for this key in any run that have not settled: a search miss never clears one. */
export function outstandingCreates(store: Store, key: string): EffectIntent[] {
    const rows = store.db.prepare(`SELECT body FROM effects WHERE status IN ('dispatching','uncertain')
        AND json_extract(body,'$.operation') = 'github-issue-create' AND json_extract(body,'$.work.kind') = 'maintenance'
        AND json_extract(body,'$.payload.key') = ?`).all(key) as { body: string }[];
    return rows.map(row => JSON.parse(row.body));
}

export type IssueDecision = { adopt: GitHubIssue } | { create: true } | { stop: string };

/**
 * Adopt one open, unambiguous issue whose identity and content establish the same change: the keyed marker, an
 * issue an earlier run verified for the key (its progress or a verified create's receipt, matched by number, URL
 * and node ID even after its title or marker changed), or the issue the read-only decision named whose body carries
 * the grounded identity. A title alone, a closed, missing or conflicting match or an outstanding create stops; only a
 * complete listing with no match permits a create.
 */
export function issueDecision(store: Store, issues: readonly GitHubIssue[], matches: IssueMatches, input: { key: string; title: string; named: number; grounded: (issue: GitHubIssue) => boolean }): IssueDecision {
    const { repository } = store.project, canonical = (issue: GitHubIssue) => issue.html_url === `https://github.com/${repository}/issues/${issue.number}`;
    if (outstandingCreates(store, input.key).length) return { stop: `An earlier create for ${input.key} is unsettled; read it back before another create` };
    if (matches.marker.length > 1) return { stop: `${matches.marker.length} issues carry the marker for ${input.key}; reconcile them` };
    const identities = knownIdentities(store, input.key), known = [...new Set(identities.map(issue => issue.number))];
    if (known.length > 1) return { stop: `Earlier runs verified different issues for ${input.key}; reconcile them` };
    const chosen = matches.marker[0]?.number ?? known[0] ?? (input.named || undefined);
    if (chosen === undefined) return matches.title.length ? { stop: `An issue titled exactly "${input.title}" exists without this change's identity; decide whether it is the same change` } : { create: true };
    const found = issues.find(issue => issue.number === chosen);
    if (matches.marker[0] && known[0] && matches.marker[0].number !== known[0]) return { stop: `The marker and an earlier run name different issues for ${input.key}` };
    if (input.named && input.named !== chosen) return { stop: `The decision named #${input.named}, but #${chosen} is ${input.key}'s issue` };
    if (matches.title.some(issue => issue.number !== chosen)) return { stop: `Another issue carries the exact title "${input.title}"; reconcile it` };
    if (!found) return { stop: `Issue #${chosen} for ${input.key} is not in the complete listing` };
    // An identity an earlier run verified must still be that same issue, whatever its title or marker say now.
    if (identities.some(issue => issue.number === found.number && (issue.url !== undefined && issue.url !== found.html_url || issue.nodeId !== undefined && issue.nodeId !== found.node_id)))
        return { stop: `Issue #${chosen} no longer matches the identity an earlier run verified for ${input.key}; reconcile it` };
    if (found.state !== 'open') return { stop: `Issue #${chosen} for ${input.key} is ${found.state}; reopening it is a person's decision` };
    if (!canonical(found)) return { stop: `Issue #${chosen} does not have this repository's canonical URL` };
    if (!matches.marker.length && !known.length && !input.grounded(found)) return { stop: `Issue #${chosen} does not establish the same evidenced change` };
    return { adopt: found };
}
