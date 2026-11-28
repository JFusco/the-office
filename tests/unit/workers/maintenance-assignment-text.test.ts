import { expect, test } from 'vitest';
import { MAINTENANCE_IMPLEMENTER_TEXT, MAINTENANCE_OWNERSHIP_TEXT, maintenanceIdentityText, maintenancePolicyText } from '../../../server/workers/maintenance-assignment-text';
import { handoffGuidance } from '../../../server/workers/handoff-guidance';

test('a confined launch is told its policy and gets its evidence inline, never an Office endpoint or file to fetch', () => {
    const editor = maintenancePolicyText({ version: 1, kind: 'editor', cwd: '/w', candidate: { worktree: '/w', branch: 'codex/1-x', gitDir: '', gitCommonDir: '' }, registry: ['registry.npmjs.org:443'] }, '/scratch');
    expect(editor).toContain('only through Bash inside /w on branch codex/1-x');
    expect(editor).toContain('the harness publishes');
    expect(MAINTENANCE_OWNERSHIP_TEXT).not.toMatch(/GET http|api\/sessions/);
    expect(MAINTENANCE_IMPLEMENTER_TEXT).not.toMatch(/TWG|Azure CLI/);
    expect(maintenanceIdentityText({ session: 's', projectId: 'p', requestId: 'r', role: 'developer' })).toContain('provider session s');
    expect(handoffGuidance('/data/a.json', '/data/s.json', true)).not.toContain('/data/');
    expect(handoffGuidance('/data/a.json', '/data/s.json')).toContain('/data/a.json');
});
