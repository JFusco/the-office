import { STAGES } from '../../src/shared';

export const WORK_GROUPS = ['delivery', 'readback', 'planning', 'intake', 'messaging', 'maintenance', 'knowledge', 'leadership', 'it', 'other'] as const;
export type WorkGroup = typeof WORK_GROUPS[number];

const JOB_STAGES = ['ci-recovery', 'implement', 'scope-repair', 'update-base', 'review', 'validate', 'draft', 'lead-pr', 'prepare-pr', 'merge', 'closeout', 'ci-diagnosis', 'pr-metadata-assessment'];
const DELIVERY = new Set<string>([...STAGES, ...JOB_STAGES.map(stage => `github-${stage}`), 'ci-recovery', 'harness-validate', 'transition']);
/** Maintenance stages reach the runtime with bare names on GitHub projects only (as in lesson selection). */
const MAINTENANCE = new Set(['follow-up', 'vendor-review', 'proposal', 'proposal-plan', 'proposal-plan-review', 'proposal-review', 'package-verification', 'browser-verification', 'draft-pr']);
const READBACK = /readback|reconcil|recover|resum|continuation|adoption|audit|forward-source|refresh-acceptance/;

/** Coarse purpose of a worker stage. Exact stage names are matched before any pattern. */
export function workGroup(stage: string, provider: 'azure' | 'github' = 'azure'): WorkGroup {
    if (provider === 'github' && MAINTENANCE.has(stage)) return 'maintenance';
    if (DELIVERY.has(stage)) return 'delivery';
    if (READBACK.test(stage)) return 'readback';
    if (/^feature-/.test(stage)) return 'planning';
    if (/^knowledge-|retrospective/.test(stage)) return 'knowledge';
    if (/maintenance/.test(stage) || MAINTENANCE.has(stage)) return 'maintenance';
    if (/^(assignment-review|intake|planning-assessment)$/.test(stage)) return 'intake';
    if (/^(deferred-)?conversation$|^slack-/.test(stage)) return 'messaging';
    if (stage === 'daily-cto') return 'leadership';
    if (stage === 'it-investigation') return 'it';
    return 'other';
}
