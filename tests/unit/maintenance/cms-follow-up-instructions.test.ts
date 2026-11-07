import { expect, test } from 'vitest';
import { cmsFollowUpInstructions } from '../../../server/maintenance/cms-follow-up-instructions';

const text = cmsFollowUpInstructions({ unverifiedNote: 'EARLIER UNVERIFIED RUN(S) r1 stopped. ', githubProjectUrl: 'https://github.com/users/JFusco/projects/7', repository: 'JFusco/cms-field-vocabulary' });

test('the follow-up no longer carries the Dependabot merge rule and merges nothing', () => {
    expect(text).not.toMatch(/dependabot/i);
    expect(text).toContain('This stage merges no pull request and edits no PR.');
    expect(text).toContain('No merges, pipeline reruns/dispatches');
    expect(text).toContain('all PRs remain read-only');
});

test('Pin Courier pull requests are the dependency path and reach the Office through delivery adoption', () => {
    expect(text).toContain('pin-courier[bot]');
    expect(text).toContain('renovate/* branches');
    expect(text).toContain('delivery adoption and its guarded merge');
});

test('a [skip release] merge expects no release and never records one as missing', () => {
    expect(text).toContain('[skip release] publishes nothing');
    expect(text).toContain('expect no tag, GitHub release or npm version');
    expect(text).toContain('never record a missing release for it as a blocker');
});

test('the note, board and repository are carried into the text', () => {
    expect(text.startsWith('EARLIER UNVERIFIED RUN(S) r1 stopped. Read all open PRs/issues')).toBe(true);
    expect(text).toContain('Use ONLY https://github.com/users/JFusco/projects/7 and issues in JFusco/cms-field-vocabulary.');
});
