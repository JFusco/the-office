import { expect, test } from 'vitest';
import { REQUIRED_CONTROLS } from '../../../../server/workers/qualification/required-controls';

test('every policy pairs denials with working controls and covers Git transports, REST, GraphQL, compound and interpreter commands, remotes, credentials, local services and protected paths', () => {
    expect(Object.keys(REQUIRED_CONTROLS).sort()).toEqual(['claude-editor', 'claude-reader', 'codex-checks', 'codex-checks-browser', 'codex-reader']);
    for (const [policy, controls] of Object.entries(REQUIRED_CONTROLS)) {
        const ids = controls.map(control => control.id);
        for (const id of ['structured-output', 'git-push-https', 'git-push-ssh', 'github-rest-mutation', 'github-graphql-mutation', 'alternate-remote-push', 'credential-helper-read', 'local-service-request'])
            expect(ids, `${policy}: ${id}`).toContain(id);
        for (const denial of controls.filter(control => control.kind === 'deny'))
            expect(controls.find(control => control.id === denial.pairedWith), `${policy}: ${denial.id}`).toMatchObject({ kind: 'allow', facility: denial.facility });
    }
    expect(REQUIRED_CONTROLS['claude-editor'].map(control => control.id)).toEqual(expect.arrayContaining(['local-commit-with-hooks', 'required-checks', 'registry-read', 'compound-push', 'interpreter-network-write', 'write-git-config', 'write-git-hooks', 'write-git-pointer', 'write-other-ref', 'write-office-data']));
    expect(REQUIRED_CONTROLS['codex-checks-browser'].map(control => control.id)).toEqual(expect.arrayContaining(['browser-fixture', 'browser-external', 'required-checks']));
});
