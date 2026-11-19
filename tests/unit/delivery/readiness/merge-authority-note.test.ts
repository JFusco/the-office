import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { mergeAuthorityNote } from '../../../../server/delivery/readiness/merge-authority-note';
import { stagePrompt } from '../../../../server/delivery/pipeline/stage-prompts';
afterEach(cleanupFakes);

test('under a harness policy the review is told the Office merges and that a repository document is not the authority', () => {
    const f = fakeGitHub();
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-10-28T00:00:00Z' };
    const note = mergeAuthorityNote(f.store);
    expect(note).toContain('MERGE AUTHORITY: This project\'s Office policy is merge=harness, and merges are enabled.');
    expect(note).toContain('That policy decides who merges, not this review and not a repository document');
    expect(note).toContain('describes sessions outside the Office and is not a blocker here');
    // What still stops a merge is named.
    expect(note).toContain('A configured hold, a required human approval on the pull request and a failed requirement still are.');
});

test('with merges switched off the review is told a merge also needs an exact-head approval', () => {
    const f = fakeGitHub();
    f.store.state.coordination!.merges = { enabled: false, authorizedAt: '' } as any;
    expect(mergeAuthorityNote(f.store)).toContain('merges are not enabled, so a merge also needs an exact-head approval');
});

test('under a human policy the review is told a person merges and the Office will not', () => {
    const f = fakeGitHub(), human = { project: { ...f.store.project, id: 'other', provider: 'azure' } as any, state: f.store.state };
    const note = mergeAuthorityNote(human);
    expect(note).toBe('MERGE AUTHORITY: This project\'s Office policy is merge=human. A person merges and the Office will not. Assess readiness only and say when the pull request is ready for that person.');
    expect(note).not.toContain('authorized the Office to merge');
});

test('the readiness review prompt carries the project\'s merge authority, and no other stage does', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', pr: 200, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/200' });
    const prompt = (stage: string) => stagePrompt({ store: f.store, project: f.store.project, job: { ...job, stage } as any, root: f.artifactRoot(job), issue: { number: 5, title: 't', body: '' }, readyChecks: false });
    expect(prompt('lead-pr')).toContain(mergeAuthorityNote(f.store));
    expect(prompt('lead-pr')).toContain('preserve other acceptance, release and human hold requirements');
    expect(prompt('prepare-pr')).not.toContain('MERGE AUTHORITY');
});
