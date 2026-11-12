import type { Lesson } from '../../src/contracts/knowledge';

/** Another project's office lesson travels as approved text only: its evidence and origin stay with its home project. */
export function lessonForProject(project: string, lesson: Lesson): Lesson {
    return lesson.scope === 'office' && lesson.originProjectId !== project ? { ...lesson, evidence: [], sourceRetrospectiveId: '', sourceSubject: undefined, repositoryInstruction: undefined } : lesson;
}
