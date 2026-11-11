import { Effects } from '../store/effects';
import type { command } from '../workers/process';
import type { Lesson } from '../../src/shared';
import type { Store } from '../store/store';
import { lessonText } from './lesson-selection';

export const lessonIssueMarker = (lesson: Pick<Lesson, 'id'>) => `Office lesson ${lesson.id}`;

export function lessonIssueBody(store: Store, lesson: Lesson): string {
    const evidence = lesson.evidence.filter(item => /^https:\/\//.test(item.url)).map(item => `- [${item.detail}](${item.url})`).join('\n') || '- Recorded in the Office Lessons panel';
    return `## Summary\nPromote this ${lesson.kind} into the appropriate repository documentation, regression test, or harness check after inspecting existing guidance.\n\n> ${lessonText(lesson)}\n\n## Why\n${lesson.detail || 'Harper found it in an Office delivery retrospective.'}\n\n## Evidence\n${evidence}\n\n## Acceptance\n- Choose and justify documentation, test, or harness enforcement based on the evidence.\n- Consolidate duplicate guidance; use AGENTS.md only for durable repository conventions and navigation.\n- Report instruction-file line counts; 200 lines is a review guideline.\n- Verify behavior with the applicable focused checks.\n\n${lessonIssueMarker(lesson)} · proposed by Harper (Office knowledge engineer) for ${store.project.name}; filed after Joe's approval.`;
}

/**
 * Files Joe's approved AGENTS.md suggestion as one GitHub issue: a durable effect with read-back.
 * An uncertain create is reconciled by searching for the marker; it is never resent.
 */
export async function fileLessonIssue(store: Store, execute: typeof command, lessonId: string): Promise<string> {
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson) throw new Error('Lesson not found in this project');
    if (lesson.repositoryInstruction?.status === 'filed' && lesson.repositoryInstruction.issueUrl) return lesson.repositoryInstruction.issueUrl;
    if (lesson.repositoryInstruction?.status !== 'proposed') throw new Error('Only a proposed AGENTS.md suggestion can be filed');
    const repository = store.project.repository, marker = lessonIssueMarker(lesson), title = `Team learning: ${lesson.statement}`.slice(0, 240);
    if (store.project.provider !== 'github' || !repository) throw new Error('AGENTS.md issues are filed for GitHub projects only');
    const find = async (): Promise<{ url: string } | null> => {
        const found = JSON.parse(await execute('gh', ['issue', 'list', '--repo', repository, '--state', 'all', '--search', `"${marker}" in:body`, '--json', 'url,body', '--limit', '10'], { cwd: store.project.repo, timeout: 60000, readOnly: true })) as { url: string; body: string }[];
        const issue = found.find(item => item.body?.includes(marker));
        return issue ? { url: issue.url } : null;
    };
    const effects = new Effects(store), id = `lesson-issue:${lesson.id}`, prior = store.getEffect(id);
    let receipt: { url: string } | null = null;
    if (prior && ['dispatching', 'uncertain'].includes(prior.status)) {
        if (!await effects.reconcile(id, async () => { const found = await find(); return { verified: !!found, receipt: found }; }))
            throw new Error('The earlier issue request is still unconfirmed on GitHub; it will not be filed twice');
        receipt = store.getEffect<{ url: string }>(id)!.receipt as { url: string };
    } else {
        receipt = await find() || await effects.execute({
            id, work: { projectId: store.project.id, kind: 'retrospective', id: lesson.id }, attemptId: lesson.id,
            operation: 'github-issue-create', target: repository, authorization: 'joe-approved-lesson-issue',
            payload: { title, marker }, expectedState: { status: 'proposed' },
            preflight: async () => { if (store.state.knowledge?.lessons.find(item => item.id === lessonId)?.repositoryInstruction?.status !== 'proposed') throw new Error('The suggestion changed before filing'); },
            dispatch: async () => {
                const out = await execute('gh', ['issue', 'create', '--repo', repository, '--title', title, '--body-file', '-'], { cwd: store.project.repo, timeout: 60000, input: lessonIssueBody(store, lesson) });
                return { url: out.trim().split('\n').reverse().find(line => /^https:\/\/github\.com\/.+\/issues\/\d+$/.test(line.trim()))?.trim() || '' };
            },
            verify: async created => {
                if (!created.url) return false;
                const issue = JSON.parse(await execute('gh', ['issue', 'view', created.url, '--json', 'url,body'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
                return issue.url === created.url && String(issue.body || '').includes(marker);
            },
        });
    }
    store.transition('lesson-issue-filed', `AGENTS.md suggestion filed: ${receipt!.url}`, () => {
        const current = store.state.knowledge?.lessons.find(item => item.id === lessonId);
        if (current) current.repositoryInstruction = { status: 'filed', issueUrl: receipt!.url, filedAt: store.clock.now().toISOString() };
    }, 'knowledge');
    return receipt!.url;
}
