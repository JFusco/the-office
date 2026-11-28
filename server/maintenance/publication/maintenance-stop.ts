import { EffectUncertainError } from '../../store/effects';
import { LaunchQualificationRefusal } from '../../workers/launch-qualification';
import type { StopReason } from '../../../src/contracts/work';
import type { MaintenanceQualificationStop } from '../../../src/shared';

/** A stop the maintenance harness classified itself: its existing kind and the detail its record shows. */
export class MaintenanceStop extends Error {
    constructor(public kind: 'authority' | 'uncertain-effect', detail: string) { super(detail); this.name = 'MaintenanceStop'; }
}

/**
 * The typed stop a versioned run or Brain follow-up records for a failure, or undefined for one the harness did not
 * classify. A refused launch is `authority` with the stage, qualification and mismatch; an unsettled write is
 * `uncertain-effect`. The detail stays in the record's existing error or detail field.
 */
export function maintenanceStopOf(error: unknown, at: string): (StopReason & { qualification?: MaintenanceQualificationStop }) | undefined {
    if (error instanceof LaunchQualificationRefusal)
        return { kind: 'authority', at, qualification: { stage: error.stage, qualification: error.qualification, mismatch: error.mismatch } };
    if (error instanceof MaintenanceStop) return { kind: error.kind, at };
    if (error instanceof EffectUncertainError) return { kind: 'uncertain-effect', at };
}
