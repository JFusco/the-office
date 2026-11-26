import { likePrefix } from '../../../store/like-prefix';
import type { Store } from '../../../store/store';
import type { BotRedo, BotRedoRoute, DependabotAdoption, EffectIntent, TicketJob } from '../../../../src/shared';

/** The exact request a redo Effect carries. Every field is fixed when it is first prepared and reused unchanged. */
export interface RedoPayload {
    project: string; repository: string; pr: number; sha: string; adoption: string; issue: number;
    bot: BotRedo['bot']; branch: string; target: string; route: BotRedoRoute; args: string[];
}

const prefix = (store: Store, pr: number) => `bot-redo:${store.project.id}:${store.project.repository}:${pr}:`;
/** One allowance per conflicted head of one PR, whichever delivery job asks. */
export const redoBase = (store: Store, pr: number, sha: string) => `${prefix(store, pr)}${sha}`;

/** The one adopted record that owns this job's existing PR and issue, or null. */
export function adoptionFor(store: Store, job: TicketJob): DependabotAdoption | null {
    const records = store.state.coordination?.adoptions?.filter(a => a.pr === job.pr && `GH-${a.issue}` === job.key && a.status === 'adopted') || [];
    return records.length === 1 && job.existingPR ? records[0] : null;
}

export const botOf = (record: DependabotAdoption): BotRedo['bot'] => record.bot || 'dependabot';
export const redoFor = (record: DependabotAdoption, pr: number, sha: string) => record.redos?.find(r => r.pr === pr && r.sha === sha);

function belongsTo(store: Store, record: DependabotAdoption, effect: EffectIntent<RedoPayload>): boolean {
    const p = effect.payload;
    if (!p || p.project !== store.project.id || p.repository !== store.project.repository || p.pr !== record.pr ||
        p.adoption !== record.id || p.issue !== record.issue || p.bot !== botOf(record) || !/^[a-f0-9]{40}$/.test(p.sha) ||
        effect.work.projectId !== store.project.id || effect.work.kind !== 'delivery') return false;
    const base = redoBase(store, p.pr, p.sha);
    return effect.id === base || effect.id.startsWith(`${base}:retry-`) && /^[1-9]\d*$/.test(effect.id.slice(base.length + 7));
}

/** Find an original request when a wait or its request ID was missing from the adoption. */
function restoreRedo(record: DependabotAdoption, pr: number, sha: string, effects: EffectIntent<RedoPayload>[]): BotRedo | undefined {
    const found = redoFor(record, pr, sha);
    if (found?.effectId) return found;
    const effect = effects.find(e => e.dispatchedAt) ?? effects.find(e => e.status === 'prepared') ??
        effects.sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
    if (!effect) return found;
    const p = effect.payload;
    if (found) {
        if (found.issue === p.issue && found.bot === p.bot && found.branch === p.branch) {
            found.effectId = effect.id;
            found.route = p.route;
        }
        return found;
    }
    const redo: BotRedo = { sha, pr, issue: p.issue, bot: p.bot, branch: p.branch, issueUrl: `https://github.com/${p.repository}/issues/${p.issue}`, firstSeenAt: effect.createdAt, route: p.route, effectId: effect.id };
    (record.redos ??= []).push(redo);
    return redo;
}

/** This head's redo, rebuilt from its original request Effect when the adoption no longer holds it. */
export function redoOf(store: Store, record: DependabotAdoption, pr: number, sha: string): BotRedo | undefined {
    const found = redoFor(record, pr, sha);
    if (found?.effectId) return found;
    return restoreRedo(record, pr, sha, redoEffects(store, pr).filter(e => belongsTo(store, record, e) && e.payload.sha === sha));
}

/** A first observation after restart can already be looking at the replacement head. */
export function restoreRedos(store: Store, record: DependabotAdoption): void {
    const byHead = new Map<string, EffectIntent<RedoPayload>[]>();
    for (const e of redoEffects(store, record.pr).filter(e => belongsTo(store, record, e))) {
        const rows = byHead.get(e.payload.sha) ?? [];
        rows.push(e);
        byHead.set(e.payload.sha, rows);
    }
    for (const [sha, rows] of byHead) restoreRedo(record, record.pr, sha, rows);
}

export function matchesRedo(store: Store, record: DependabotAdoption, redo: BotRedo, effect: EffectIntent<RedoPayload>): boolean {
    return effect.id === redo.effectId && redo.pr === record.pr && redo.issue === record.issue && redo.bot === botOf(record) && belongsTo(store, record, effect) &&
        effect.payload.sha === redo.sha && effect.payload.branch === redo.branch && (!redo.route || effect.payload.route === redo.route);
}

/** Every redo request Effect for this PR, across delivery jobs. */
export function redoEffects(store: Store, pr: number): EffectIntent<RedoPayload>[] {
    return (store.db.prepare("SELECT body FROM effects WHERE id LIKE ? ESCAPE '\\'").all(likePrefix(prefix(store, pr))) as { body: string }[])
        .map(row => JSON.parse(row.body));
}

/**
 * An attempted request whose need a qualified replacement head settled. Only the exact saved settlement counts:
 * the row keeps its own status, error and receipt, and this grants neither a resend nor merge authority.
 */
export function settledRequest(store: Store, effect: EffectIntent): boolean {
    if (effect.status !== 'uncertain' || !effect.dispatchedAt) return false;
    const p = effect.payload as RedoPayload;
    return !!p && !!store.state.coordination?.adoptions?.some(a => a.status === 'adopted' && belongsTo(store, a, effect as EffectIntent<RedoPayload>) &&
        a.redos?.some(r => r.sha === p.sha && r.pr === p.pr && r.bot === p.bot && matchesRedo(store, a, r, effect as EffectIntent<RedoPayload>) && r.settled?.effectId === effect.id &&
            r.settled.project === store.project.id && r.settled.repository === store.project.repository && r.settled.pr === p.pr &&
            r.settled.adoption === a.id && r.settled.bot === p.bot && r.settled.sha === p.sha && /^[a-f0-9]{40}$/.test(r.settled.replacement) && r.settled.replacement !== p.sha));
}
