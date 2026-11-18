import { expect, test } from 'vitest';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { NEW, OLD, git, readback, stopped } from './moved-head-fixtures';

test('a resume takes the recorded draft pull request as it stands: the PM naming that pull request is not a duplicate, and the stage is not run again', async () => {
    const { store, jira, engine, t } = stopped();
    engine.agents.readback = readback(4242) as any;
    engine.agents.reconcile = async () => { throw new Error('Nothing is reconstructed'); };
    engine.agents.stage = async () => { throw new Error('The draft pull request stage is not run again'); };
    await engine.resume(t.key, false);
    const live = store.ticket(t.key);
    expect(live).toMatchObject({ stage: 'repair', activity: 'waiting', blocker: '', prId: 4242, commit: OLD, headMove: { from: OLD, to: NEW, prId: 4242 } });
    // The Dev update with the pull request link went out once, through Effects.
    expect((store.db.prepare("SELECT status FROM effects WHERE id LIKE 'dev-update:%'").all() as { status: string }[]).map(row => row.status)).toEqual(['verified']);
    expect(jira.state[t.key].comments).toHaveLength(1);
});

test('a resume still refuses a pull request that is not the ticket\'s', async () => {
    const { store, engine, t } = stopped();
    engine.agents.readback = readback(7) as any;
    await expect(engine.resume(t.key, false)).rejects.toThrow('A different PR exists');
    expect(store.ticket(t.key)).toMatchObject({ stage: 'draft-pr', prId: 0 });
});

test('a recorded draft result on a head that does not contain the candidate is not the ticket\'s pull request: the resume stops as it did before', async () => {
    const { store, jira, engine, t } = stopped(), refuse = git({ contains: false });
    engine.jira = new JiraOperations(store, ((program: string, args: string[], options: any) => program === 'git' ? refuse(program, args, options) : jira.execute(program, args, options)) as any);
    engine.agents.readback = readback(4242) as any;
    engine.agents.stage = async () => { throw new Error('The draft pull request stage is not run again'); };
    await expect(engine.resume(t.key, false)).rejects.toThrow('A different PR exists');
    expect(store.ticket(t.key)).toMatchObject({ stage: 'draft-pr', prId: 0 });
    expect(store.ticket(t.key).headMove).toBeUndefined();
});
