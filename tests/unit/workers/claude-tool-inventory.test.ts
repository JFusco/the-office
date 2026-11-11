import { expect, test } from 'vitest';
import { scanClaudeToolRecords } from '../../../server/workers/claude-tool-inventory';
import { digest } from '../../../server/store/readback-evidence';

const call = (id = 'read', command = 'inspect retained evidence') => ({ type: 'tool_use', id, name: 'Bash', input: { command } });
const output = (id = 'read') => ({ type: 'tool_result', tool_use_id: id, content: 'Synthetic retained output', is_error: false });
const issued = (item = call(), uuid = 'issued') => ({ type: 'assistant', sessionId: 'worker', cwd: '/candidate', uuid,
    message: { id: 'message-' + uuid, role: 'assistant', content: [item] } });
const returned = (item = output()) => ({ type: 'user', sessionId: 'worker', cwd: '/candidate', uuid: 'returned', parentUuid: 'issued',
    message: { role: 'user', content: [item] } });
const scan = (records: any[]) => scanClaudeToolRecords(records, 'worker', cwd => cwd === '/candidate');
const reference = (item: unknown, role = 'assistant') => ({ type: 'api-request-blob', sessionId: 'worker', hash: 'a'.repeat(64), message: { role, content: [item] } });

test('a stopped invocation retains its missing result explicitly and makes no completion or effects claim', () => {
    const records = [issued(), returned(), issued(call('pending'), 'pending-issued')], before = structuredClone(records);
    const inventory = scan(records);
    expect([...inventory.calls.keys()]).toEqual(['read', 'pending']);
    expect(inventory.missingResults).toEqual(['pending']); expect(inventory.orphanResults).toEqual([]);
    expect(inventory.genuineResults.has('pending')).toBe(false);
    expect(records).toEqual(before);
});

test('API history binds both issued input representations without becoming another execution', () => {
    const display = call(), wire = { command: 'inspect actual wire evidence' }, execution = { ...issued(display), wireToolInputs: { read: wire } };
    const inventory = scan([execution, returned(), reference({ ...display, input: wire }), reference(output(), 'user')]);
    expect(inventory.calls.size).toBe(1); expect(inventory.outputs.size).toBe(1); expect(inventory.issued.get('read')).toHaveLength(1);
    expect(inventory.calls.get('read')?.inputRepresentations).toEqual([
        { namespace: 'display', value: display.input, sha256: digest(display.input) },
        { namespace: 'wire', value: wire, sha256: digest(wire) },
    ]);
    expect(inventory.calls.get('read')?.referenceProvenance).toHaveLength(2);
});

test('API-history-only calls or outputs cannot fill a missing genuine execution', () => {
    expect(() => scan([reference(call())])).toThrow('paired issued execution');
    expect(() => scan([issued(), reference(output(), 'user')])).toThrow('paired issued execution');
});

test('identical repeated records coalesce while distinct issued identities remain visible for stricter stopped-attempt admission', () => {
    const first = issued(), result = returned();
    const identical = scan([first, result, structuredClone(first), structuredClone(result)]);
    expect(identical.calls.size).toBe(1); expect(identical.issued.get('read')).toHaveLength(1);
    const ambiguous = scan([first, result, issued(call(), 'another-issued')]);
    expect(ambiguous.issued.get('read')).toHaveLength(2);
});

test('a result with the wrong parent cannot authenticate a historical reference', () => {
    expect(() => scan([issued(), { ...returned(), parentUuid: 'foreign' }, reference(call())])).toThrow('paired issued execution');
});

test.each(['session', 'cwd', 'input', 'wire', 'output'])('identity or conflicting duplicate %s evidence remains rejected', change => {
    const first: any = issued(), records: any[] = [first, returned()];
    if (change === 'session') first.sessionId = 'foreign';
    if (change === 'cwd') first.cwd = '/foreign';
    if (change === 'input') records.push(issued(call('read', 'different input')));
    if (change === 'wire') records.push({ ...issued(), wireToolInputs: { read: { command: 'new wire input' } } });
    if (change === 'output') records.push(returned({ ...output(), content: 'Different result' }));
    expect(() => scan(records)).toThrow();
});
