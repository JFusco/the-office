import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { moveLane } from '../../../../server/delivery/board/move-lane';
import { laneWrite } from '../../../../server/delivery/board/lane-effect';
import type { EffectIntent } from '../../../../src/shared';
afterEach(cleanupFakes);

const MERGE = 'f'.repeat(40), operation = { id: `closeout:${MERGE}` };
/** Issue and PR cards in review, a counted board mutation, and an optional failure after the mutation lands. */
function board() {
    const f = fakeGitHub(), job = f.candidate({ pr: 200, stage: 'closeout', mergeCommit: MERGE });
    f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    const sent: string[] = [];
    let after: ((item: string) => void) | undefined;
    const execute = (async (program: string, args: string[], options: any = {}) => {
        const request = args[1] === 'graphql' ? JSON.parse(options.input) : undefined;
        const output = await f.execute(program, args, options);
        if (String(request?.query).startsWith('mutation')) { sent.push(request.variables.item); after?.(request.variables.item); }
        return output;
    }) as typeof f.execute;
    const effects = () => (f.store.db.prepare("SELECT body FROM effects WHERE body LIKE '%github-project-status%'").all() as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent<Record<string, unknown>>);
    return { f, job, sent, execute, effects, failAfter: (fn: typeof after) => { after = fn; } };
}

test('each card move is one Effect bound to project, item, field, option and head, and is not sent again', async () => {
    const { f, job, sent, execute, effects } = board();
    expect(await moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation)).toBe('Done');
    expect(f.state.cards.map(card => card.status)).toEqual(['done', 'done']);
    expect(sent).toEqual(['issue-card', 'pr-card']);
    expect(effects().map(effect => ({ id: effect.id, status: effect.status, target: effect.target, payload: effect.payload }))).toEqual(['issue-card', 'pr-card'].map(item => ({
        id: `harness:${job.id}:closeout:${MERGE}:lane:${item}`, status: 'verified', target: `project:${item}`, payload: { project: 'project', item, field: 'status', option: 'done', head: job.head } })));
    expect(job.boardUpdates!.map(update => [update.item, update.status, update.detail])).toEqual([['issue-card', 'verified', 'Done verified by read-back.'], ['pr-card', 'verified', 'Done verified by read-back.']]);
    await moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation);
    expect(sent).toHaveLength(2);
    expect(job.boardUpdates!.slice(2).map(update => update.detail)).toEqual(['Done already verified.', 'Done already verified.']);
});

test('a card already at Done is verified by reading it, with no Effect', async () => {
    const { f, job, sent, execute, effects } = board();
    f.state.cards[1].status = 'done';
    await moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation);
    expect(sent).toEqual(['issue-card']);
    expect(effects().map(effect => effect.payload.item)).toEqual(['issue-card']);
    expect(job.boardUpdates!.find(update => update.item === 'pr-card')).toMatchObject({ status: 'verified', detail: 'Done already verified.', option: 'done' });
});

test('a write that landed but was never read back is reconciled by reading, not sent again, though the card now reads Done', async () => {
    const { f, job, sent, execute, effects, failAfter } = board();
    failAfter(() => { failAfter(undefined); throw new Error('timeout after the write'); });
    await expect(moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation)).rejects.toThrow('needs read-back');
    expect(effects()[0]).toMatchObject({ status: 'uncertain' });
    expect(job.boardUpdates!.at(-1)).toMatchObject({ item: 'issue-card', status: 'uncertain' });
    expect(laneWrite(f.store, job, operation, 'issue-card')).toBe('unread');
    expect(f.state.cards[0].status).toBe('done');
    await moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation);
    expect(sent).toEqual(['issue-card', 'pr-card']);
    expect(effects().map(effect => effect.status)).toEqual(['verified', 'verified']);
    expect(job.boardUpdates!.every(update => update.status === 'verified')).toBe(true);
});

test('a write whose outcome is unknown and whose card is not at Done is never sent again', async () => {
    const { f, job, sent, execute, failAfter } = board();
    failAfter(item => { failAfter(undefined); f.state.cards.find(card => card.id === item)!.status = 'review'; throw new Error('timeout'); });
    await expect(moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation)).rejects.toThrow('needs read-back');
    await expect(moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation)).rejects.toThrow('remains uncertain');
    expect(sent).toEqual(['issue-card']);
});

test('a card a person moved after the verified move is left alone', async () => {
    const { f, job, sent, execute } = board();
    await moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation);
    f.state.cards[0].status = 'review';
    await expect(moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation)).rejects.toThrow('will not move it again');
    expect(sent).toHaveLength(2);
    expect(f.state.cards[0].status).toBe('review');
});

test('a refused guard sends nothing and leaves no pending board record', async () => {
    const { f, job, sent, execute, effects } = board();
    // The refusal comes through as itself: nothing was sent, so nothing needs read-back.
    await expect(moveLane(f.store, execute as any, job, 'Done', () => { throw new Error('Office paused before a harness write'); }, job.pr, operation)).rejects.toThrow(/^Office paused before a harness write$/);
    expect(sent).toEqual([]);
    expect(job.boardUpdates || []).toEqual([]);
    expect(effects()).toEqual([]);
    // Refused at the Effect's own preflight: the intent is rejected undispatched and the board has no record of it.
    let checks = 0;
    await expect(moveLane(f.store, execute as any, job, 'Done', () => { if (++checks === 2) throw new Error('Delivery authority unavailable'); }, job.pr, operation)).rejects.toThrow(/^Delivery authority unavailable$/);
    expect(sent).toEqual([]);
    expect(job.boardUpdates || []).toEqual([]);
    expect(effects().map(effect => [effect.status, effect.dispatchedAt])).toEqual([['rejected', '']]);
    await moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation);
    expect(sent).toEqual(['issue-card', 'pr-card']);
    expect(effects().map(effect => effect.status)).toEqual(['rejected', 'verified', 'verified']);
});

test('an earlier unread write is not confirmed against an option the board has since replaced', async () => {
    const { f, job, sent, execute, effects, failAfter } = board();
    // The first move lands but its read-back never happens, leaving the write unread.
    failAfter(() => { failAfter(undefined); throw new Error('timeout after the write'); });
    await expect(moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation)).rejects.toThrow('needs read-back');
    const unread = effects()[0];
    expect(unread).toMatchObject({ status: 'uncertain' });
    // The process stopped after the intent was marked sent and before its board record was saved.
    job.boardUpdates = (job.boardUpdates || []).filter(update => update.status !== 'uncertain');
    // Done is replaced by a new option and the card shows it; the old write must not be confirmed against it.
    f.state.lanes = f.state.lanes.map(lane => lane.name === 'Done' ? { id: 'done-2', name: 'Done' } : lane);
    f.state.cards[0].status = 'done-2';
    await expect(moveLane(f.store, execute as any, job, 'Done', () => {}, job.pr, operation)).rejects.toThrow('another field or option');
    expect(sent).toEqual(['issue-card']);
    expect(effects().find(effect => effect.id === unread.id)?.status).toBe('uncertain');
});

test('a move of this card saved before its Effect existed and never settled authorizes no first write', async () => {
    const { f, job, sent, execute } = board();
    const { moveCardOnce } = await import('../../../../server/delivery/board/lane-effect');
    f.state.cards[0].status = 'progress';
    job.boardUpdates = [{ stage: job.stage, head: job.head, project: 'project', item: 'issue-card', field: 'status', option: 'done', target: 'Done', at: '2026-11-24T18:00:00Z', status: 'uncertain', detail: 'gh exited 1: gh: HTTP 499' }];
    const update = { ...job.boardUpdates[0], status: 'verified' as const, detail: '' };
    await expect(moveCardOnce(f.store, execute as any, job, 'issue-card', { projectId: 'project', fieldId: 'status', options: f.state.lanes }, { id: 'done', name: 'Done' }, operation, () => {}, update))
        .rejects.toThrow('has no settled record; it is left unread');
    expect(sent).toEqual([]);
});
