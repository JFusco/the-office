import { HOST_ENVIRONMENT, type QualificationEnvironment } from '../../workers/launch-qualification';
import type { Agents } from '../../workers/agents';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenanceRun } from '../../../src/shared';
import type { MaintenanceOwner } from './maintenance-effect';
import { UNREVIEWED_LINT_ISOLATION, type LintIsolation } from './lint-isolation';

/** What a weekly CMS run's #612 publication reads from its pump: the run, its directory and its replay position. */
export interface WeeklyContext {
    store: Store;
    agents: Pick<Agents, 'run'>;
    execute: typeof command;
    run: MaintenanceRun;
    root: string;
    /** The pump's cursor: the position the next step takes. */
    at: () => number;
    qualification: QualificationEnvironment;
    /** Whether candidate-defined draft lint may run; production refuses until its isolation is reviewed (`lint-isolation.ts`). */
    lintIsolation: LintIsolation;
}

export function weeklyContext(maintenance: { store: Store; agents: Pick<Agents, 'run'> & { qualification?: QualificationEnvironment }; execute: typeof command; lintIsolation?: LintIsolation }, run: MaintenanceRun, root: string, at: () => number): WeeklyContext {
    return { store: maintenance.store, agents: maintenance.agents, execute: maintenance.execute, run, root, at, qualification: maintenance.agents.qualification ?? HOST_ENVIRONMENT,
        lintIsolation: maintenance.lintIsolation ?? UNREVIEWED_LINT_ISOLATION };
}

/** A weekly run's writes belong to its maintenance claim; only a pause stops them beyond the shared ownership checks. */
export function cmsOwner(ctx: WeeklyContext, subject: string, issue?: number): MaintenanceOwner {
    return { run: ctx.run, claim: 'maintenance', subject, issue, current: () => ctx.store.state.paused ? 'Project paused before a maintenance write' : undefined };
}

/** Whether the step saved at this position ran under the #612 contract. */
export const versionedAt = (ctx: Pick<WeeklyContext, 'run'>, position: number) => ctx.run.steps[position]?.publicationVersion === 1;
