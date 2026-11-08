import { readRepo } from '../dependabot/qualify';
import { findTrackingIssue } from '../dependabot/tracking-issue';
import type { DependencyBot } from './adopt';

const OWNER = { login: 'JFusco', id: 486049 }, ACTIONS = { login: 'github-actions[bot]', id: 41898282 };
const branch = /^bot\/wiki-(?:sync\/[1-9]\d*|maintenance)$/;
const identity = (actual: any, expected: typeof OWNER) => actual?.login === expected.login && actual?.id === expected.id;
const wikiPath = (path: unknown) => typeof path === 'string' && !path.split('/').some(part => ['.', '..', ''].includes(part)) && (path === 'scripts/wiki/graph/data/graph.json' || path.startsWith('wiki/') && path.endsWith('.md'));

/** Canonical BOT_TOKEN wiki PRs: account identity plus bounded content, then ordinary exact-head review. */
export const wikiSync: DependencyBot = {
    id: 'wiki-sync', label: 'wiki-sync', autoAdoptLanes: ['In review'],
    async openPulls(store, execute) {
        return (await readRepo(store, execute, 'pulls?state=open&per_page=100', true))
            .filter((pull: any) => branch.test(pull.head?.ref || '') && identity(pull.user, OWNER));
    },
    async refusal(store, execute, pull) {
        if (!identity(pull.user, OWNER)) return 'the wiki workflow token author identity does not match';
        if (pull.draft) return 'it is a draft';
        if (!branch.test(pull.head?.ref || '')) return 'it is not a canonical wiki automation branch';
        if (pull.head?.repo?.full_name !== store.project.repository) return 'it comes from another repository';
        if (pull.base?.ref !== store.project.target) return 'it does not target the configured base';
        const p = typeof pull.commits === 'number' && typeof pull.changed_files === 'number' ? pull : await readRepo(store, execute, `pulls/${pull.number}`);
        if (p.state !== 'open' || p.head?.sha !== pull.head.sha || !/^[a-f0-9]{40}$/.test(p.head.sha)) return 'the wiki PR head changed or is unavailable';
        const parent = /^bot\/wiki-sync\/([1-9]\d*)$/.exec(p.head.ref)?.[1];
        if (parent) {
            if (p.title !== `docs(wiki): reconcile PR #${parent}` || !p.body?.startsWith(`Automated, reviewable wiki reconciliation for merged PR #${parent}.`)) return 'the wiki PR does not match its source merge';
            const source = await readRepo(store, execute, `pulls/${parent}`);
            if (!source.merged || !source.merged_at || source.base?.ref !== store.project.target || typeof source.head?.ref !== 'string' || source.head.ref.startsWith('bot/wiki-')) return 'the source PR is not an eligible merged parent';
        } else if (!['docs(wiki): reconcile missed merges', 'docs(wiki): weekly issue and merge reconciliation'].includes(p.title) || !/^Automated, reviewable (?:batch wiki reconciliation\.|weekly refresh of cited issue state and missed merge reconciliation\.)/.test(p.body || '')) return 'it is not a canonical wiki maintenance PR';
        const commits = await readRepo(store, execute, `pulls/${p.number}/commits?per_page=100`, true);
        if (!commits.length || commits.length !== p.commits || commits.at(-1)?.sha !== p.head.sha || commits.some((commit: any) => !identity(commit.author, ACTIONS) || !identity(commit.committer, ACTIONS))) return 'wiki commits are not exclusively Actions-authored on the current head';
        const files = await readRepo(store, execute, `pulls/${p.number}/files?per_page=100`, true);
        if (!files.length || files.length !== p.changed_files || files.some((file: any) => !wikiPath(file.filename) || file.previous_filename && !wikiPath(file.previous_filename))) return 'wiki changes extend beyond Markdown and the generated wiki graph, or file coverage is incomplete';
        const closing = [...(p.body || '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi)].map(match => Number(match[1]));
        if (closing.length) {
            const tracking = await findTrackingIssue(store, execute, p.number, 0, 'wiki-sync');
            if (!tracking || closing.some(number => number !== tracking.number)) return 'the wiki PR closes an issue other than its owned tracking issue';
        }
        return '';
    },
};
