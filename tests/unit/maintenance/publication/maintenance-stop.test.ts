import { expect, test } from 'vitest';
import { MaintenanceStop, maintenanceStopOf } from '../../../../server/maintenance/publication/maintenance-stop';
import { LaunchQualificationRefusal } from '../../../../server/workers/launch-qualification';
import { EffectUncertainError } from '../../../../server/store/effects';
import { stopCause } from '../../../../server/scheduling/stop-cause';

test('a refused launch is an authority stop naming stage, qualification and mismatch; an unsettled write is uncertain-effect', () => {
    const refusal = maintenanceStopOf(new LaunchQualificationRefusal('proposal', 'claude-editor', 'the pinned executable binary digest changed'), 'now');
    expect(refusal).toEqual({ kind: 'authority', at: 'now', qualification: { stage: 'proposal', qualification: 'claude-editor', mismatch: 'the pinned executable binary digest changed' } });
    expect(stopCause({ stop: refusal })).toBe('needs-decision');
    expect(maintenanceStopOf(new EffectUncertainError('e', 'x'), 'now')).toEqual({ kind: 'uncertain-effect', at: 'now' });
    expect(maintenanceStopOf(new MaintenanceStop('authority', 'moved'), 'now')).toEqual({ kind: 'authority', at: 'now' });
    expect(maintenanceStopOf(new Error('plain'), 'now')).toBeUndefined();
});
