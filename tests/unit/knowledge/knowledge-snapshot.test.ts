import { expect, test } from 'vitest';
import type { KnowledgeState } from '../../../src/contracts/knowledge';
import { knowledgeSnapshot } from '../../../server/knowledge/knowledge-snapshot';
import { learningLesson } from './knowledge-fixture';

test("another project's office lesson arrives as approved text, and history naming a lesson no longer held is left out", () => {
    const proof = { kind: 'pr' as const, ref: 'pr:1', url: 'https://example.invalid/pr/1', detail: 'private' };
    const own = learningLesson('own', { evidence: [proof] }), foreign = learningLesson('foreign', { scope: 'office', originProjectId: 'cec', evidence: [proof] });
    const exposure = (id: string, lesson: string) => ({ id, stage: 'review', at: '', digest: '', eligible: [{ scope: 'project' as const, id: lesson, revision: 1 }, { scope: 'project' as const, id: 'gone', revision: 1 }], selected: [{ scope: 'project' as const, id: lesson, revision: 1 }], omitted: [] });
    const knowledge = { lessons: [own], officeLessons: [foreign], exposures: [exposure('kept', 'own'), exposure('dropped', 'gone')], officeProposals: [{ id: 'mine', projectId: 'brain' }, { id: 'theirs', projectId: 'cec' }] } as unknown as KnowledgeState;
    const view = knowledgeSnapshot('brain', knowledge)!;
    expect(view.lessons[0].evidence).toEqual([proof]);
    expect(view.officeLessons![0]).toMatchObject({ statement: foreign.statement, evidence: [], sourceRetrospectiveId: '' });
    expect(view.officeLessons![0].sourceSubject).toBeUndefined();
    expect(view.exposures!.map(e => e.id)).toEqual(['kept']);
    expect(view.exposures![0].eligible.map(r => r.id)).toEqual(['own']);
    expect(view.officeProposals!.map(p => p.id)).toEqual(['mine']);
    expect(knowledge.officeLessons![0].evidence).toEqual([proof]);
});
