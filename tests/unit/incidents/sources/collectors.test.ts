import { expect, test } from 'vitest';
import { INCIDENT_SOURCES } from '../../../../src/contracts/incidents';
import { COLLECTORS, SOURCE_OF } from '../../../../server/incidents/sources/collectors';

test('the collectors are listed with the stopped record first and the outbox last', () => {
    expect(COLLECTORS.map(collector => collector.name)).toEqual(['stoppedWork', 'workerFailures', 'itRecoveries', 'itInvestigations', 'improvements', 'providerErrors', 'slackDeliveries', 'outboxItems']);
});

test('the order sources are trusted in, which rebuilds a subject\'s explanation, is the order the collectors run in', () => {
    expect(COLLECTORS.map(collector => SOURCE_OF.get(collector))).toEqual(INCIDENT_SOURCES.filter(source => source !== 'runner'));
});
