import { LaunchQualificationRefusal } from '../../workers/launch-qualification';

/** The qualification candidate-defined draft lint needs: its own reviewed isolation, separate from every worker launch record. */
export const DRAFT_LINT_ISOLATION = 'draft-lint-isolation';

/**
 * A refused draft lint. Typed like a launch refusal (an `authority` stop that names the stage, the qualification and
 * the mismatch), but it is not cleared by requalifying a worker policy: it needs the isolation review.
 */
export class LintIsolationRefusal extends LaunchQualificationRefusal {
    constructor(mismatch: string) {
        super('draft-pr', DRAFT_LINT_ISOLATION, mismatch);
        this.name = 'LintIsolationRefusal';
        this.message = `Draft PR lint is not qualified (${DRAFT_LINT_ISOLATION}): ${mismatch}. No candidate script ran and no fresh Effect was sent. Installing worker qualification records does not open it; it needs its own reviewed isolation qualification (docs/maintenance-launch-qualification.md).`;
    }
}

/** Whether candidate-defined draft lint may run now: a refusal, or undefined. */
export type LintIsolation = () => LintIsolationRefusal | undefined;

/**
 * The production gate (#612 B-B). `lintPRContent` runs the candidate's own `lint:pr` script and commitlint
 * configuration under `confined-runner.ts`, before the push, and that profile allows by default (Mach lookups,
 * `security`, LaunchServices, `launchctl`, `osascript`, the pasteboard), inherits the service environment and leaves
 * the keychains readable. No isolation for it has been reviewed, so every route that would run candidate lint refuses
 * at dispatch, whatever project reaches it and whatever worker records are installed.
 */
export const UNREVIEWED_LINT_ISOLATION: LintIsolation = () =>
    new LintIsolationRefusal('candidate-defined draft lint has no reviewed isolation qualification; worker qualification records do not open it');
