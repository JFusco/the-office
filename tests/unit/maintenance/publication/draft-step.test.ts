import { expect, test } from 'vitest';
import { MaintenanceSchema } from '../../../../server/maintenance/maintenance';
import { draftContentSchema, draftInstructions, draftSpec, publishVersionedDraft } from '../../../../server/maintenance/publication/draft-step';
import { MaintenanceStop } from '../../../../server/maintenance/publication/maintenance-stop';
import { LintIsolationRefusal, UNREVIEWED_LINT_ISOLATION } from '../../../../server/maintenance/publication/lint-isolation';

const proposal = { issue: 5, branch: 'codex/5-x', head: 'a'.repeat(40), worktree: '/w', summary: '' };
const group = (saved: boolean, versioned: boolean, lintIsolation: () => unknown = () => undefined): any => ({ versioned, proposalStep: 0, binding: { worktree: '/w' }, progress: { key: 'k' }, observed: () => ({ targets: {}, progress: {} }),
    ctx: { store: { project: { repo: '/repo' } }, run: { id: 'r', steps: [{ stage: 'proposal', result: { outcome: 'passed', summary: '', checks: [] } }, ...(saved ? [{ stage: 'draft-pr', result: { outcome: 'passed' }, publicationVersion: versioned ? 1 : undefined }] : [])], publication: { evidence: [] } }, at: () => 1, lintIsolation } });
/** The cursor after the draft step returned, as the publication call sees it. */
const after = (g: any) => { g.ctx.at = () => 2; return g; };

test('the draft step asks for content only, parses its exact title and body, and a legacy group never reaches publication', async () => {
    expect(draftInstructions(proposal, { plan: 'none' } as any)).toMatch(/exact head a{40}/);
    expect(draftInstructions(proposal, { plan: 'none' } as any)).not.toMatch(/Push normally|open ONE/);
    expect(() => draftContentSchema(MaintenanceSchema).parse({ outcome: 'passed', approach: null, checks: [], summary: '', ledger: '', blocker: '', receipts: [], candidates: [] })).toThrow();
    expect(draftSpec(group(false, true), proposal, MaintenanceSchema).launch().policy).toMatchObject({ kind: 'reader', cwd: '/w' });
    let stop: unknown; try { draftSpec(group(false, false), proposal, MaintenanceSchema); } catch (error) { stop = error; }
    expect(stop).toBeInstanceOf(MaintenanceStop);
    expect(() => draftSpec(group(true, false), proposal, MaintenanceSchema)).not.toThrow();
    expect(await publishVersionedDraft(after(group(true, false)), {} as any, proposal, {} as any, async () => {})).toBe(false);
    await expect(publishVersionedDraft(after(group(true, true)), {} as any, proposal, {} as any, async () => {})).rejects.toThrow(/no content to publish/);
});

test('an unstarted versioned draft stops before its worker launches while the lint isolation is unreviewed; a saved one goes on to publication', () => {
    let stop: unknown; try { draftSpec(group(false, true, UNREVIEWED_LINT_ISOLATION), proposal, MaintenanceSchema); } catch (error) { stop = error; }
    expect(stop).toBeInstanceOf(LintIsolationRefusal);
    expect(() => draftSpec(group(true, true, UNREVIEWED_LINT_ISOLATION), proposal, MaintenanceSchema)).not.toThrow();
    // A legacy group keeps its own stop first.
    expect(() => draftSpec(group(false, false, UNREVIEWED_LINT_ISOLATION), proposal, MaintenanceSchema)).toThrow(MaintenanceStop);
});
