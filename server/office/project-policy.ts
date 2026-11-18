import type { OfficeProject } from '../../src/shared';
import { PROJECT_POLICY_INPUTS } from './projects';
import type { ProjectPolicyInput } from './project-policy-config';

/** How the Office treats one project, with every key resolved. */
export interface ProjectPolicy {
    /** Who may merge. `harness` is a ceiling: the runtime merge switch or an exact-head approval is still required. */
    merge: 'human' | 'harness';
    /** The harness, not a model, performs candidate creation, publication, promotion and closeout. */
    handsOff: boolean;
    /** Daily checkpoint, in America/New_York. */
    checkpoint: { hour: number; weekends: boolean };
    /** Human holds for this project only, by ticket key. The top-level `holds` still applies to every project. */
    holds: Readonly<Record<string, string>>;
}

type Project = Pick<OfficeProject, 'id' | 'provider'>;

/**
 * What these three projects did before policy was configurable. It fills omitted keys only,
 * so an unchanged office-config.json keeps its behaviour. Policy consumers read the resolved value, never these ids.
 */
const BEFORE_POLICY = new Map<string, ProjectPolicyInput>([
    ['cec', { checkpoint: { hour: 9, weekends: false } }],
    ['cms-field-vocabulary', { handsOff: true, checkpoint: { hour: 15 } }],
    ['brain', { handsOff: true, checkpoint: { hour: 17 } }],
]);

export function resolveProjectPolicy(project: Project, input: ProjectPolicyInput = {}): ProjectPolicy {
    const before = BEFORE_POLICY.get(project.id) || {};
    return Object.freeze({
        merge: input.merge ?? (project.provider === 'github' ? 'harness' : 'human'),
        handsOff: input.handsOff ?? before.handsOff ?? false,
        checkpoint: Object.freeze({
            hour: input.checkpoint?.hour ?? before.checkpoint?.hour ?? 17,
            weekends: input.checkpoint?.weekends ?? before.checkpoint?.weekends ?? true,
        }),
        holds: Object.freeze(Object.fromEntries(Object.entries(input.holds ?? {}))),
    });
}

/** The policy configured for this project at start-up. */
export function projectPolicy(project: Project, inputs: ReadonlyMap<string, ProjectPolicyInput> = PROJECT_POLICY_INPUTS): ProjectPolicy {
    return resolveProjectPolicy(project, inputs.get(project.id));
}
