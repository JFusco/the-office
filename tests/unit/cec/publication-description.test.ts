import { expect, test } from 'vitest';
import { JiraIssuePublisher, jiraText } from '../../../server/cec/issue-publication';
import { descriptionPreimage } from '../../../server/cec/publication-description';
import { knowledgeStore } from '../knowledge/knowledge-fixture';

test('attributes on an otherwise plain paragraph keep the raw ADF preimage and detect attribute-only drift', async () => {
    const fixture = knowledgeStore('cec');
    try {
        const original = { version: 1, type: 'doc', content: [{ type: 'paragraph', attrs: { localId: 'authored' }, content: [{ type: 'text', text: 'Text' }] }] };
        expect(descriptionPreimage(original, jiraText)).toEqual(original);
        const fields: any = { summary: 'Existing', description: structuredClone(original), labels: ['keep'] };
        const writes: string[][] = [];
        const publisher = new JiraIssuePublisher(fixture.store, { id: 'test', marker: () => 'marker' }, async (_program, args, options) => {
            if (options?.readOnly === false) writes.push(args);
            const data = args.includes('types') ? [{ name: 'Improvement', hierarchyLevel: 0, subtask: false }] :
                args.includes('create-metadata') ? { fields: [] } : [{ key: 'CEC-154', fields }];
            return JSON.stringify({ data });
        });
        const operation = { kind: 'update', payload: { space: 'CEC', type: 'Improvement', summary: 'Reviewed', description: 'Approved plan\nmarker', labels: ['keep'] }, expected: { summary: 'Existing', description: structuredClone(original), labels: ['keep'] } } as any;
        fields.description.content[0].attrs.localId = 'edited';
        await expect(publisher.preflight({} as any, operation, 'CEC-154')).rejects.toThrow('changed since approval preview');
        expect(writes).toHaveLength(0);
        fields.description = structuredClone(original);
        await publisher.preflight({} as any, operation, 'CEC-154');
        await publisher.dispatch({} as any, operation, 'CEC-154', 'marker');
        expect(writes).toHaveLength(1);
        expect(writes[0]).toContain('--fields-json');
        expect(writes[0]).not.toContain('--description');
        expect(JSON.parse(writes[0][writes[0].indexOf('--fields-json') + 1]).description.content[0]).toEqual(original.content[0]);
    } finally { fixture.close(); }
});

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
