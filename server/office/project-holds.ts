import type { OfficeProject } from '../../src/shared';
import { HOLDS } from './config';
import { projectPolicy } from './project-policy';
import type { ProjectPolicyInput } from './project-policy-config';

type Project = Pick<OfficeProject, 'id' | 'provider'>;
type Inputs = ReadonlyMap<string, ProjectPolicyInput>;

const own = (holds: Readonly<Record<string, string>>, key: string) => Object.hasOwn(holds, key) ? holds[key] : undefined;

/** Why `key` is held by the top-level `holds`, which apply to every project. Only a snapshot that names no project reads this alone. */
export function topLevelHold(key: string): string | undefined {
    return own(HOLDS, key);
}

/** Why `key` is held for this project: its own `policy.holds` entry first, then the top-level `holds`. */
export function holdReason(project: Project, key: string, inputs?: Inputs): string | undefined {
    return own(projectPolicy(project, inputs).holds, key) ?? topLevelHold(key);
}

/** Every hold that applies to this project, with the same precedence as `holdReason`, as a read-only snapshot. */
export function holdsFor(project: Project, inputs?: Inputs): Readonly<Record<string, string>> {
    return Object.freeze(Object.assign(Object.create(null) as Record<string, string>, HOLDS, projectPolicy(project, inputs).holds));
}
