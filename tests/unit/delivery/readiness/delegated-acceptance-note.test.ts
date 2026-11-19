import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { delegatedAcceptanceNote } from '../../../../server/delivery/readiness/delegated-acceptance-note';
import { stagePrompt } from '../../../../server/delivery/pipeline/stage-prompts';
afterEach(cleanupFakes);

test('on a hands-off project the readiness review is told maintainer acceptance is its own to give, and what still binds', () => {
    const f = fakeGitHub(), note = delegatedAcceptanceNote(f.store);
    expect(note).toContain('DELEGATED ACCEPTANCE: This is a hands-off project.');
    expect(note).toContain('Joe has delegated that acceptance to this review (Joe, 2026-11-19)');
    expect(note).toContain('Do not return a human hold only because a maintainer has not accepted it.');
    expect(note).toContain('A configured hold, a required human approval on the pull request and a decision the issue explicitly reserves for Joe still bind.');
});

test('a project that is not hands-off gets no such note', () => {
    const f = fakeGitHub();
    expect(delegatedAcceptanceNote({ project: { ...f.store.project, id: 'cec', provider: 'azure' } as any })).toBe('');
});

test('only the readiness review prompt carries it', () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', pr: 200, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/200' });
    const prompt = (stage: string) => stagePrompt({ store: f.store, project: f.store.project, job: { ...job, stage } as any, root: f.artifactRoot(job), issue: { number: 5, title: 't', body: '' }, readyChecks: false });
    expect(prompt('lead-pr')).toContain(delegatedAcceptanceNote(f.store));
    expect(prompt('prepare-pr')).not.toContain('DELEGATED ACCEPTANCE');
});
