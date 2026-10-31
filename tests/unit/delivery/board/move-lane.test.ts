import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
afterEach(cleanupFakes);
import { moveLane, resolveLane } from '../../../../server/delivery/board/move-lane';

test('lanes resolve case-insensitively; Block needs exactly one Block or Blocked option', () => {
    const field = { projectId: 'p', fieldId: 'f', options: [{ id: '1', name: 'in review' }, { id: '2', name: 'Blocked' }] };
    expect(resolveLane(field, 'In review').id).toBe('1');
    expect(resolveLane(field, 'Block').id).toBe('2');
    expect(() => resolveLane({ ...field, options: [...field.options, { id: '3', name: 'Block' }] }, 'Block')).toThrow('exactly one');
    expect(() => resolveLane(field, 'Done')).toThrow('exactly one');
});
test('moves issue and PR cards with read-back and records verified updates', async () => {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'progress' });
    expect(await moveLane(f.store, f.execute as any, job, 'In review', () => {})).toBe('In review');
    expect(f.state.cards.map(c => c.status)).toEqual(['review', 'review']);
    expect(job.boardUpdates!.every(u => u.status === 'verified')).toBe(true);
});
test('never moves a card out of a human lane and never creates a card', async () => {
    const f = fakeGitHub(), job = f.candidate();
    f.state.cards[0].status = 'backlog';
    await expect(moveLane(f.store, f.execute as any, job, 'In progress', () => {})).rejects.toThrow('human lane');
    f.state.cards = [];
    await expect(moveLane(f.store, f.execute as any, job, 'In progress', () => {})).rejects.toThrow('no existing card');
});
test('an unverified board write stays uncertain and blocks the next move until read back', async () => {
    const f = fakeGitHub(), job = f.candidate();
    let mutated = false;
    const original = f.execute;
    const execute = async (program: string, args: string[], options: any) => {
        if (args[1] === 'graphql' && JSON.parse(options.input).query.startsWith('mutation')) { mutated = true; throw new Error('timeout'); }
        return original(program, args, options);
    };
    await expect(moveLane(f.store, execute as any, job, 'In progress', () => {})).rejects.toThrow('needs read-back');
    expect(mutated).toBe(true);
    expect(job.boardUpdates!.at(-1)!.status).toBe('uncertain');
    await expect(moveLane(f.store, f.execute as any, job, 'In review', () => {})).rejects.toThrow('remains uncertain');
});
test('a human Block lane is never moved by the harness, and the guard runs before any board write', async () => {
    const f = fakeGitHub(), job = f.candidate();
    f.state.cards[0].status = 'block';
    await expect(moveLane(f.store, f.execute as any, job, 'In review', () => {})).rejects.toThrow('human lane');
    f.state.cards[0].status = 'progress';
    await expect(moveLane(f.store, f.execute as any, job, 'In review', () => { throw new Error('Office paused before a harness write'); })).rejects.toThrow('paused');
    expect(f.state.cards[0].status).toBe('progress');
    expect(f.state.calls.some(c => c.includes('graphql') && c.includes('mutation'))).toBe(false);
});
test('a PR card auto-added in Backlog or without status moves with its issue; an issue card in Backlog does not', async () => {
    const f = fakeGitHub(), job = f.candidate({ pr: 200 });
    f.state.cards[0].status = 'progress';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'backlog' });
    expect(await moveLane(f.store, f.execute as any, job, 'In review', () => {})).toBe('In review');
    expect(f.state.cards.map(c => c.status)).toEqual(['review', 'review']);
    f.state.cards[1].status = '';
    f.state.cards[0].status = 'progress';
    expect(await moveLane(f.store, f.execute as any, job, 'In review', () => {})).toBe('In review');
    f.state.cards[0].status = 'backlog';
    await expect(moveLane(f.store, f.execute as any, job, 'In progress', () => {})).rejects.toThrow('human lane');
});
