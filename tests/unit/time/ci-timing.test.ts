import { expect, test } from 'vitest';
import { initialSnapshot } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { rememberCi } from '../../../server/time/ci-timing';
import type { AzureBuild, AzurePR } from '../../../src/shared';

const pr: AzurePR = { id: 3, title: 'CEC-12 with GH-7, XCEC-9, CEC-12x and OTHER-5', draft: false, status: 'active', source: 'refs/heads/codex/cec-13-fixture', target: 'refs/heads/staging', commit: 'a'.repeat(40), mergeCommit: 'b'.repeat(40), url: '', policies: [{ name: 'Build', status: 'approved', buildId: 9 }] };
const build: AzureBuild = { id: 9, name: 'Synthetic CI', status: 'completed', result: 'succeeded', commit: pr.mergeCommit, branch: 'refs/pull/3/merge', url: 'https://example.org/9', durationMs: 1000, queueMs: 0, stages: [] };

test('a build links only the ticket keys of its own project, whatever their case', () => {
    const state = initialSnapshot();
    rememberCi(projectById('cec'), state, [{ ...build }], [pr]);
    expect(state.ciHistory![0].linkedTickets).toEqual(['CEC-12', 'CEC-13']);
});

test('another project reading the same text links its own prefix and none of CEC’s', () => {
    const state = initialSnapshot();
    rememberCi(projectById('brain'), state, [{ ...build }], [pr]);
    expect(state.ciHistory![0].linkedTickets).toEqual(['GH-7']);
});
