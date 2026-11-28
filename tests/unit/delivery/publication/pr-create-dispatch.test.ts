import { expect, test } from 'vitest';
import { dispatchDraftCreate } from '../../../../server/delivery/publication/pr-create-dispatch';

test('one explicit-head draft create with the body on stdin, shared by delivery and maintenance', async () => {
    const calls: any[] = [];
    const printed = await dispatchDraftCreate((async (program: string, args: string[], options: any) => { calls.push({ program, args, options }); return 'https://github.com/o/r/pull/9\n'; }) as any,
        { repository: 'o/r', base: 'main', branch: 'codex/9-x', title: 'fix: x', body: 'Closes #9', cwd: '/w' });
    expect(printed).toBe('https://github.com/o/r/pull/9\n');
    expect(calls).toEqual([{ program: 'gh', args: ['pr', 'create', '--repo', 'o/r', '--base', 'main', '--head', 'codex/9-x', '--draft', '--title', 'fix: x', '--body-file', '-'], options: { cwd: '/w', input: 'Closes #9', timeout: 120000 } }]);
});
