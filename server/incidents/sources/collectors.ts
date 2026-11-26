import type { IncidentSource } from '../../../src/contracts/incidents';
import type { IncidentCollector } from '../observation';
import { improvements } from './improvements';
import { itInvestigations } from './it-investigations';
import { itRecoveries } from './it-recoveries';
import { outboxItems } from './outbox-items';
import { providerErrors } from './provider-errors';
import { slackDeliveries } from './slack-deliveries';
import { stoppedWork } from './stopped-work';
import { workerFailures } from './worker-failures';

/**
 * Every source of incident signals, in the order their reports are trusted when two describe the
 * same stop: the stopped record itself first, the outbox last. The repair runner's own failures
 * have no collector: the runner reports them over HTTP (record-runner-failure.ts), and observation
 * leaves its subject as those reports left it.
 */
export const COLLECTORS: readonly IncidentCollector[] = [stoppedWork, workerFailures, itRecoveries, itInvestigations, improvements, providerErrors, slackDeliveries, outboxItems];

/** The source each collector reports as, so a collector that fails freezes only its own subjects. */
export const SOURCE_OF: ReadonlyMap<IncidentCollector, IncidentSource> = new Map<IncidentCollector, IncidentSource>([
    [stoppedWork, 'stopped-work'], [workerFailures, 'worker-failure'], [itRecoveries, 'it-recovery'], [itInvestigations, 'it-investigation'],
    [improvements, 'improvement'], [providerErrors, 'provider-error'], [slackDeliveries, 'slack-delivery'], [outboxItems, 'outbox'],
]);
