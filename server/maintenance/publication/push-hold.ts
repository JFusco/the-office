import type { OfficeProject } from '../../../src/shared';

/** The CMS project, by configured id and by repository, so renaming either one still holds the push. */
const CMS = { id: 'cms-field-vocabulary', repository: 'jfusco/cms-field-vocabulary' };

/**
 * Why a fresh maintenance push for this project is held, or undefined (#612 B-A). The CMS pre-push runs
 * candidate-defined verification (`pnpm run verify:ci`, `pnpm run test:packed`) with publication authority, and a
 * fresh worktree has no `.husky/_` yet, so an empty or absent hook chain compares equal at baseline and at push and
 * would let the operator route push with no pre-push hook at all. The hold is explicit and does not depend on what
 * the hook baseline, the policy surface or any receipt shows; it lifts only through a separately reviewed change.
 */
export function maintenancePushHold(project: Pick<OfficeProject, 'id' | 'repository'>): string | undefined {
    if (project.id === CMS.id || project.repository.toLowerCase() === CMS.repository)
        return 'CMS maintenance publication is held: its pre-push hook chain runs candidate-defined checks with publication authority and cannot be qualified yet, so the harness sends no fresh push (cutover blocker); an attempted push is only read back';
}
