import { claimedDelivery } from './delivery-claim';
import { metadataFixture } from './pr-metadata';
import { deliveryInputSha256 } from '../../server/github/github-context';
import { digest } from '../../server/store/readback-evidence';
import { parkUnadmittedMetadata } from '../../server/delivery/parking/park-unadmitted-metadata';
import type { MetadataHumanEdit } from '../../server/delivery/publication/metadata-admission';
import type { EffectIntent, StageResult } from '../../src/shared';

export const TITLE = 'docs(operating): require explicit source acceptance [skip release]';

/** One command as a hook sees it: the program, its arguments and, for a board call, the GraphQL request. */
export interface Call { program: string; args: string[]; request?: { query: string; variables: Record<string, any> } }

/**
 * A hands-off job at its readiness review whose saved blocked review asks for a PR title edit the harness may not
 * make, with the human-edit decision read from it. The issue card is in In review, and so is the pull request's
 * card unless `prCard` is false (first in provider order with `prFirst`). Card mutations (`item>option`) and
 * comment POSTs are counted at the command boundary before each call runs, so a failed attempt counts. `before` and
 * `after` run around every command, where a test edits state or throws; `respond` may answer a command in place of
 * the fake. Synthetic; never contacts GitHub or a model.
 */
export function metadataParkFixture(options: { prCard?: boolean; prFirst?: boolean; others?: boolean } = {}) {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed');
    f.job.stage = 'lead-pr'; f.job.status = 'blocked';
    f.pr.title = TITLE;
    f.state.cards[0].status = 'review';
    if (options.prCard !== false) f.state.cards[options.prFirst ? 'unshift' : 'push']({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    const writes = { moves: [] as string[], posts: [] as string[] };
    const hooks: { before?: (call: Call) => void; after?: (call: Call) => void; respond?: (call: Call) => string | undefined } = {};
    const inner = f.delivery.execute;
    f.delivery.execute = (async (program, args, opts) => {
        const request = program === 'gh' && args[0] === 'api' && args[1] === 'graphql' ? JSON.parse(opts!.input!) : undefined, call: Call = { program, args, request };
        if (String(request?.query).startsWith('mutation')) writes.moves.push(`${request.variables.item}>${request.variables.option}`);
        if (program === 'gh' && args[0] === 'api' && /\/issues\/\d+\/comments$/.test(args[1]) && args.includes('-f')) writes.posts.push(args[args.indexOf('-f') + 1].slice(5));
        hooks.before?.(call);
        const out = hooks.respond?.(call) ?? await inner(program, args, opts);
        hooks.after?.(call);
        return out;
    }) as typeof inner;
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head, name: 'unit', status: 'completed', conclusion: 'success' }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    const finding = { id: 'pr-metadata', status: 'open' as const, summary: 'Release marker in the PR title', expected: 'Remove [skip release] from the title', actual: '[skip release]', attempts: 0 };
    const others = options.others ? [{ id: 'review-note', status: 'open' as const, summary: 'Carried advisory', expected: '', actual: '', attempts: 0 }] : [];
    const result: StageResult = { outcome: 'blocked', commit: f.job.head, prId: 200, branch: f.job.branch, worktree: f.job.worktree, summary: 'Release marker', blocker: 'Remove it', paidRuns: 0,
        previewUrl: '', qaRunDir: '', receipts: [], evidence: [], resolution: null, findings: [finding, ...others] };
    f.job.steps.push({ stage: 'lead-pr', result });
    f.job.reviewInputSha256 = deliveryInputSha256(f.store, f.job.key);
    const decision: MetadataHumanEdit = { route: 'human-edit', why: others.length ? 'other-findings' : 'lint-accepted', finding, others, step: f.job.steps.length - 1,
        resultSha256: digest(result), inputSha256: deliveryInputSha256(f.store, f.job.key),
        pr: { number: 200, url: f.job.prUrl, head: f.job.head, branch: f.job.branch, title: f.pr.title, body: f.pr.body } };
    const run = <T>(fn: () => Promise<T>) => claimedDelivery(f.store, f.job, fn);
    /** The first entry, as `dispatchLeadAssessment` makes it: the human-edit decision parks the job. */
    const parkNow = () => run(() => parkUnadmittedMetadata(f.delivery, f.job, result, decision));
    /** One ordinary claimed pass of the job through `GitHubDelivery.step`. */
    const pass = () => { f.job.status = 'queued'; return run(() => f.delivery.step(f.job)); };
    const lane = (id: string) => f.state.cards.find(card => card.id === id)?.status;
    const effects = () => (f.store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent<Record<string, any>>).filter(e => /:park(-comment)?:/.test(e.id));
    const blockMoves = () => writes.moves.filter(move => move.endsWith('>block'));
    return { ...f, result, decision, writes, hooks, run, parkNow, pass, lane, effects, blockMoves };
}
