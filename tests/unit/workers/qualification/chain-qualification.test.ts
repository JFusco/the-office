import { afterEach, expect, test } from 'vitest';
import { chainQualified } from '../../../../server/workers/qualification/chain-qualification';
import { policyTemplate } from '../../../../server/workers/qualification/policy-templates';
import { dataRoot, fakeEnvironment, install, passingRecord } from './support';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const needs = [{ policy: 'codex-reader', stage: 'vendor-review' }, { policy: 'claude-editor', stage: 'proposal' }];

test('a chain is qualified only when every record matches the host and the exact template this build launches', () => {
    const root = dataRoot(cleanup);
    expect(chainQualified(root, needs, fakeEnvironment())).toMatchObject({ stage: 'vendor-review', qualification: 'codex-reader', mismatch: 'no qualification record is installed' });
    install(root, passingRecord(policyTemplate('codex-reader'), ['vendor-review']), 'codex-reader');
    const editor = passingRecord(policyTemplate('claude-editor'), ['proposal']);
    install(root, editor, 'claude-editor');
    expect(chainQualified(root, needs, fakeEnvironment())).toBeUndefined();
    // Host, binary and controls still match, but the record's template is stale.
    for (const [field, stale] of [['arguments', [...editor.arguments, '--add-dir', '/']], ['settings', { disableAllHooks: false }], ['tools', ['Read']], ['filesystem', { readable: [], writable: [], denied: [] }], ['network', { allowed: ['*'] }]] as const) {
        install(root, { ...editor, [field]: stale }, 'claude-editor');
        expect(chainQualified(root, needs, fakeEnvironment()), field).toMatchObject({ stage: 'proposal', qualification: 'claude-editor', mismatch: expect.stringContaining(`${field} differ`) });
    }
    // The host part is checked first, as at launch.
    install(root, editor, 'claude-editor');
    expect(chainQualified(root, needs, fakeEnvironment({ sha256: 'e'.repeat(64) }))?.mismatch).toBe('the pinned executable binary digest changed');
});

test('the template part is judged against the protected roots the runtime launches with', () => {
    const root = dataRoot(cleanup), roots = { officeData: '/office/data', home: '/home/joe' };
    install(root, passingRecord(policyTemplate('claude-editor', roots), ['proposal']), 'claude-editor');
    expect(chainQualified(root, [{ policy: 'claude-editor', stage: 'proposal' }], fakeEnvironment(), roots)).toBeUndefined();
    expect(chainQualified(root, [{ policy: 'claude-editor', stage: 'proposal' }], fakeEnvironment(), { officeData: '/other/data', home: '/home/joe' })?.mismatch).toMatch(/arguments differ .*\(stale\)/);
});
