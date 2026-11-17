import { projectPolicy } from '../../office/project-policy';
import type { Store } from '../../store/store';

export const HUMAN_MERGE = 'Project policy requires human merge';

/** Project policy is a ceiling: no runtime switch or saved approval lets the Office merge above it. */
export function harnessMayMerge(store: Pick<Store, 'project'>): boolean {
    return projectPolicy(store.project).merge === 'harness';
}

export function assertHarnessMayMerge(store: Pick<Store, 'project'>): void {
    if (!harnessMayMerge(store)) throw new Error(HUMAN_MERGE);
}
