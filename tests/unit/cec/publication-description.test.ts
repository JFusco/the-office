import { expect, test } from 'vitest';
import { JiraIssuePublisher } from '../../../server/cec/issue-publication';
import { knowledgeStore } from '../knowledge/knowledge-fixture';

test('a rich update preserves all original ADF nodes and reconciles the exact approved append', async () => {
    const fixture = knowledgeStore('cec');
    try {
        const original = { version: 1, type: 'doc', content: [
            { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Authored heading' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Protected link', marks: [{ type: 'link', attrs: { href: 'https://example.test' } }] }] },
        ] };
        const source = structuredClone(original);
        const fields = { summary: 'Existing', description: original, labels: ['keep'] };
        const writes: string[][] = [];
        const publisher = new JiraIssuePublisher(fixture.store, { id: 'test', marker: () => 'marker' }, async (_program, args, options) => {
            if (options?.readOnly === false) {
                writes.push(args);
                fields.description = JSON.parse(args[args.indexOf('--fields-json') + 1]).description;
                fields.summary = 'Reviewed';
            }
            const data = args.includes('types') ? [{ name: 'Improvement', hierarchyLevel: 0, subtask: false }] :
                args.includes('create-metadata') ? { fields: [] } : [{ key: 'CEC-154', fields }];
            return JSON.stringify({ data });
        });
        const operation = { kind: 'update', payload: { space: 'CEC', type: 'Improvement', summary: 'Reviewed', description: 'Approved plan\nmarker', labels: ['keep'] }, expected: { summary: 'Existing', description: source, labels: ['keep'] } } as any;
        fields.description = structuredClone(original);
        (fields.description.content[1].content[0] as any).marks[0].attrs.href = 'https://edited.example.test';
        await expect(publisher.preflight({} as any, operation, 'CEC-154')).rejects.toThrow('changed since approval preview');
        expect(writes).toHaveLength(0);
        fields.description = original;
        await publisher.preflight({} as any, operation, 'CEC-154');
        const receipt = await publisher.dispatch({} as any, operation, 'CEC-154', 'marker');
        expect(writes).toHaveLength(1);
        expect(writes[0]).not.toContain('--description');
        expect(fields.description.content.slice(0, source.content.length)).toEqual(source.content);
        expect(await publisher.verify(receipt, operation)).toBe(true);
        expect(await publisher.verify(receipt, operation)).toBe(true);
        expect(writes).toHaveLength(1);
        expect(original).toEqual(source);
    } finally { fixture.close(); }
});
