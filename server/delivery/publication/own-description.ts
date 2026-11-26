import { digest } from '../../store/readback-evidence';
import { maintenanceDraftProvenance } from '../../maintenance/draft-provenance';
import { uneditedDescription, type DescriptionHistory } from './description-history';
import type { Store } from '../../store/store';
import type { EffectIntent, TicketJob } from '../../../src/shared';
import type { DescriptionSource } from '../../../src/contracts/pr-metadata';

/** The Office write the live description is, the head it was written for, and the live `{title, body}` digest. */
export interface DescriptionAttribution { head: string; source: DescriptionSource; contentSha256: string }
export type OwnDescription = { owned: true; attribution: DescriptionAttribution } | { owned: false; reason: string };

/** One dispatched Office write of the description: the head it was for, what it wrote, and its proof when it has one. */
interface Write { effect: EffectIntent<any>; head: string; contentSha256: string; created?: true }

const HEAD = /^[a-f0-9]{40}$/, SHA = /^[a-f0-9]{64}$/;
const pair = (title: unknown, body: unknown) => typeof title === 'string' && typeof body === 'string' ? digest({ title, body }) : undefined;

/** What a saved write of this pull request says it wrote; null for another pull request's create, undefined when its own records conflict. */
function described(store: Store, e: EffectIntent<any>, pr: DescriptionHistory): Write | null | undefined {
    const own = e.work?.projectId === store.project.id && e.work.kind === 'delivery' && e.attemptId === e.work.id && e.authorization === 'office-harness';
    const p = e.payload, r = e.receipt as any, verified = e.status === 'verified', key = String((e.expectedState as any)?.key);
    if (e.operation === 'github-pr-create') {
        if (verified && (r?.number !== pr.number || r?.url !== pr.url)) {
            const other = Number.isSafeInteger(r?.number) && r.number > 0 && r.number !== pr.number &&
                r.url === `https://github.com/${pr.repository}/pull/${r.number}`;
            return other ? null : undefined;
        }
        if (!own || p?.branch !== pr.branch || !HEAD.test(p?.head) || key !== `pr-create:${p.head}`) return undefined;
        const recorded = verified && typeof r?.contentSha256 === 'string' && SHA.test(r.contentSha256);
        return { effect: e, head: p.head, contentSha256: recorded ? r.contentSha256 : '', ...(recorded ? { created: true } : {}) };
    }
    const [head, written] = e.operation === 'github-pr-metadata' ? [p?.binding?.head, p?.selected] : [p?.head, p?.plan];
    const sha = pair(written?.title, written?.body);
    if (!own || !HEAD.test(head) || !sha || (e.operation === 'github-pr-metadata'
        ? p.binding.url !== pr.url || p.binding.pr !== pr.number || p.binding.repository !== store.project.repository || p.binding.branch !== pr.branch || p.binding.jobId !== e.work.id || !key.startsWith('pr-metadata:')
        : written.kind !== 'pr-metadata' || p.branch !== pr.branch || !key.startsWith('ci-repair:')))
        return undefined;
    if (verified && (r?.head !== head || r.title !== written.title || r.body !== written.body)) return undefined;
    return { effect: e, head, contentSha256: sha };
}

/**
 * Whether the live description of this pull request is the Office's own, and for which head. The Office's writes
 * are its create, metadata and CI metadata Effects for this pull request, from any job of the project, ordered by
 * dispatch. The latest must be provable and hold the live bytes: a create whose original response recorded its
 * content, on a description never edited since. A PATCH is a write for ordering and has no authorship proof.
 * A tie, conflicting records, a newer unprovable write or bytes matching only an older write are refused. With no Office
 * write at all, a completed maintenance run's draft worker may prove it created the never-edited description.
 * An unsettled write is an error: it is read back first, never guessed.
 */
export function ownDescription(store: Store, job: Pick<TicketJob, 'key' | 'branch'>, pr: DescriptionHistory, nativeRoot?: string): OwnDescription {
    const refuse = (reason: string): OwnDescription => ({ owned: false, reason });
    const effects = (store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent<any>)
        .filter(e => e.operation === 'github-pr-create' ? e.target === `${pr.repository}:${pr.branch}` : ['github-pr-metadata', 'ci-pr-metadata'].includes(e.operation) && e.target === pr.url);
    if (effects.some(e => ['dispatching', 'uncertain'].includes(e.status)))
        throw new Error('An Office write of this pull request description needs read-back before its authorship is read');
    const dispatched = effects.filter(e => e.dispatchedAt).map(e => described(store, e, pr)).filter(w => w !== null);
    const live = digest({ title: pr.title, body: pr.body });
    if (!dispatched.length) {
        if (!uneditedDescription(pr)) return refuse('no Office write is recorded and the description was edited after it was created');
        const made = maintenanceDraftProvenance(store, job, pr, nativeRoot);
        return made.proven ? { owned: true, attribution: made.draft } : refuse(`no Office write is recorded and ${made.reason}`);
    }
    if (dispatched.some(w => !w)) return refuse('an Office write of this description has conflicting records');
    const writes = (dispatched as Write[]).sort((a, b) => Date.parse(a.effect.dispatchedAt) - Date.parse(b.effect.dispatchedAt));
    const latest = writes.at(-1)!, older = writes.slice(0, -1);
    if (older.some(w => Date.parse(w.effect.dispatchedAt) === Date.parse(latest.effect.dispatchedAt))) return refuse('two Office writes of this description were dispatched at the same time');
    if (!latest.created || latest.contentSha256 !== live)
        return refuse(older.some(w => w.contentSha256 === live) && latest.contentSha256 !== live ? 'the live description matches only an older Office write' :
            latest.created ? 'the live description is not what the latest Office write published' : 'the latest Office write of this description has no provable content');
    if (!uneditedDescription(pr))
        return refuse('the description was edited after the latest Office write');
    return { owned: true, attribution: { head: latest.head, source: { kind: 'effect', effectId: latest.effect.id, operation: latest.effect.operation }, contentSha256: live } };
}
