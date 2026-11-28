import { afterEach, expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { versionedAssignment } from '../../../../server/maintenance/publication/versioned-assignment';
import { maintenancePolicyEvidence } from '../../../../server/github/github-context';
afterEach(cleanupFakes);

test('a retained policy that tells the worker to publish never reaches a versioned assignment; ownership and holds do', () => {
    const f = fakeMaintenanceGitHub();
    mkdirSync(resolve(f.store.dataRoot, 'handover'), { recursive: true });
    writeFileSync(resolve(f.store.dataRoot, 'handover', 'policies.json'), JSON.stringify([{ id: 'cms-drift', prompt: 'Push normally and open ONE canonical issue-linked DRAFT GitHub PR. File issues with the issue-creator skill.', memory: 'Opened PR 194.' }]));
    f.store.state.maintenance = { runs: [], lastDaily: '', lastWeekly: '', ledger: 'Ledger.' };
    f.store.state.coordination!.jobs = [{ id: 'job', key: 'GH-112', status: 'blocked', stage: 'implement' } as any];
    const run = { id: 'r', steps: [] } as any;
    const text = versionedAssignment(f.store, { run, stage: 'draft-pr', instructions: 'Write ONLY the draft content.', candidates: [{ issue: 112, worktree: '/w', branch: 'b', head: 'h', summary: 's' }], policies: maintenancePolicyEvidence(f.store) });
    expect(text).not.toMatch(/Push normally|open ONE canonical|issue-creator|ISSUE FLOW|Opened PR 194/);
    expect(text).toContain('"id":"cms-drift"');
    expect(text).toContain('GH-112 is owned by delivery job job');
    expect(text).toContain('receipts=[]');
    expect(text).toContain('the harness alone files issues, pushes branches, opens pull requests');
});
