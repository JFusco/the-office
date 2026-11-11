import { expect, test } from 'vitest';
import { prePushRejection } from '../../../../server/delivery/publication/pre-push-boundary';

const head = 'a'.repeat(40), sid = '20261111T185859.575149Z-H097376ef-P000156d7';
const identity = { pid: 87767, cwd: '/owned/candidate', head, branch: 'codex/165-repair' };
const events = () => [
    { event: 'version', sid },
    { event: 'start', sid, argv: ['/usr/bin/git', 'push', 'origin', `${head}:refs/heads/codex/165-repair`] },
    { event: 'def_repo', sid, worktree: '/owned/candidate' },
    { event: 'cmd_name', sid, name: 'push' },
    { event: 'child_start', sid, child_id: 0, child_class: 'transport/file' },
    { event: 'cmd_name', sid: sid + '/transport', name: 'receive-pack' },
    { event: 'child_start', sid, child_id: 1, child_class: 'hook', hook_name: 'pre-push' },
    { event: 'child_exit', sid, child_id: 1, code: 7 },
    { event: 'child_exit', sid, child_id: 0, code: 0 },
    { event: 'exit', sid, code: 1 },
    { event: 'atexit', sid, code: 1 },
];
const encode = (rows: unknown[]) => rows.map(row => JSON.stringify(row)).join('\n') + '\n';

test('qualifies the native ref-update boundary without claiming hook effects are safe', () => {
    const proof = prePushRejection(encode(events()), identity);
    expect(proof).toMatchObject({ kind: 'native-pre-push-rejected', pid: 87767, hookExitCode: 7,
        refUpdateNotAttempted: true, hookSideEffectsReconciled: false });
    expect(proof.traceSha256).toMatch(/^[a-f0-9]{64}$/);
});
test.each(['pid', 'cwd', 'head', 'branch'] as const)('refuses a changed %s', key => {
    const expected = { ...identity, [key]: key === 'pid' ? 87768 : key === 'head' ? 'b'.repeat(40) : 'different' };
    expect(() => prePushRejection(encode(events()), expected)).toThrow();
});
test.each(['successful-hook', 'missing-settlement', 'missing-hook-exit', 'extra-command', 'nested-writer', 'second-root', 'wrong-order'])('%s cannot settle a push', scenario => {
    const rows: any[] = events();
    if (scenario === 'successful-hook') rows[7].code = 0;
    if (scenario === 'missing-settlement') rows.pop();
    if (scenario === 'missing-hook-exit') rows.splice(7, 1);
    if (scenario === 'extra-command') rows[1].argv.push('--force');
    if (scenario === 'nested-writer') rows.splice(8, 0, { event: 'cmd_name', sid: sid + '/other', name: 'push' });
    if (scenario === 'second-root') rows.push({ ...rows[1], sid: sid + '-another' });
    if (scenario === 'wrong-order') [rows[7], rows[9]] = [rows[9], rows[7]];
    expect(() => prePushRejection(encode(rows), identity)).toThrow();
});
test('error text without the native trace is never authority', () => {
    expect(() => prePushRejection('git exited 1: pnpm install failed', identity)).toThrow();
});
