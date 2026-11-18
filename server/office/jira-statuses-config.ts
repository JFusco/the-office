import { z } from 'zod';
import { text } from './parse-config-block';
import type { JiraBinding, JiraStatusStage } from './project-bindings-config';

/** The stage statuses CEC has always used; a project's `jira.statuses.stages` overrides any of them. */
export const DEFAULT_STAGE_STATUSES: Readonly<Record<JiraStatusStage, string>> = Object.freeze({
    understand: 'In Progress', 'code-review': 'Code Review', 'repair-review': 'Code Review', preview: 'Ready for QA', qa: 'QA', retest: 'QA',
});
/** Stage order, which is also the order of a project's preflight statuses. */
export const STATUS_STAGES = Object.keys(DEFAULT_STAGE_STATUSES) as JiraStatusStage[];

const intakeStatus = z.strictObject({
    name: text,
    id: z.string({ error: 'must be a positive decimal string' }).regex(/^[1-9][0-9]*$/, 'must be a positive decimal string'),
}, { error: 'must be an object' });

export const statusesSchema = z.strictObject({
    intake: z.array(intakeStatus, { error: 'must be a non-empty array' }).min(1, 'must be a non-empty array'),
    stages: z.strictObject(Object.fromEntries(STATUS_STAGES.map(stage => [stage, text.optional()])) as Record<JiraStatusStage, z.ZodOptional<typeof text>>, { error: 'must be an object' }).optional(),
    readyForStaging: text.optional(),
    blocked: text.optional(),
}, { error: 'must be an object' });

/** A project's `jira.statuses`, with omitted stages, Ready for Staging and Blocked filled from the defaults. */
export function resolvedStatuses(statuses: z.infer<typeof statusesSchema>, fail: (reason: string) => never): JiraBinding['statuses'] {
    const names = statuses.intake.map(status => status.name), ids = statuses.intake.map(status => status.id);
    if (new Set(names).size !== names.length) fail('jira.statuses.intake names must be unique');
    if (new Set(ids).size !== ids.length) fail('jira.statuses.intake ids must be unique');
    const stages = Object.fromEntries(STATUS_STAGES.map(stage => [stage, statuses.stages?.[stage] ?? DEFAULT_STAGE_STATUSES[stage]])) as Record<JiraStatusStage, string>;
    const blocked = statuses.blocked ?? 'Blocked';
    if (names.includes(blocked) || Object.values(stages).includes(blocked)) fail('jira.statuses.blocked must differ from every intake and stage status');
    return {
        intake: statuses.intake.map(({ name, id }) => ({ name, id })),
        stages,
        readyForStaging: statuses.readyForStaging ?? 'Ready for Staging',
        blocked,
    };
}
