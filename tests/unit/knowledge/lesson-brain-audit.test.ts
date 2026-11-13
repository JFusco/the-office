import { expect, test } from 'vitest';
import { lessonBrainAudit } from '../../../server/knowledge/lesson-brain-audit';
import type { KnowledgeSearch } from '../../../src/contracts/knowledge-retrieval';
import { learningLesson } from './knowledge-fixture';

const hit = (path: string) => ({ reference: { id: `brain:s:${path}`, kind: 'brain' as const, path, snapshot: 's', contentSha256: 'x' }, title: `Title ${path}`, excerpt: '', citation: path, scope: 'technical' as const, limitations: [] });
const answer = (technical: ReturnType<typeof hit>[], technicalStatus: KnowledgeSearch['technicalStatus'] = 'available'): KnowledgeSearch => ({ office: [], technical, snapshot: 's', technicalStatus, truncated: false });

test('lists active lessons with Brain notes on the same topic and ignores retired ones', async () => {
    const queries: string[] = [];
    const lessons = [learningLesson('A', { when: 'Before upgrading', statement: 'Pin the router version' }), learningLesson('B', { statement: 'Run the wiki sync' }), learningLesson('C', { status: 'retired' })];
    const audit = await lessonBrainAudit(lessons, async query => { queries.push(query); return answer(query.includes('router') ? [hit('knowledge/a.md'), hit('knowledge/b.md'), hit('knowledge/c.md'), hit('knowledge/d.md')] : []); });
    expect(queries).toHaveLength(2);
    expect(queries[0]).toBe('Before upgrading Pin the router version');
    expect(audit).toMatchObject({ checked: 2, unavailable: 0 });
    expect(audit.rows).toEqual([{ scope: 'project', id: 'A', statement: 'Pin the router version', notes: [{ path: 'knowledge/a.md', title: 'Title knowledge/a.md' }, { path: 'knowledge/b.md', title: 'Title knowledge/b.md' }, { path: 'knowledge/c.md', title: 'Title knowledge/c.md' }] }]);
});

test('a Brain outage is counted, never reported as no overlap', async () => {
    const audit = await lessonBrainAudit([learningLesson('A')], async () => answer([], 'unavailable'));
    expect(audit).toEqual({ rows: [], checked: 1, unavailable: 1 });
});
