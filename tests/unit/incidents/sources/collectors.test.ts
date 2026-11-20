import { expect, test } from 'vitest';
import { COLLECTORS } from '../../../../server/incidents/sources/collectors';

test('the collectors are listed with the stopped record first and the outbox last', () => {
    expect(COLLECTORS.map(collector => collector.name)).toEqual(['stoppedWork', 'workerFailures', 'itRecoveries', 'itInvestigations', 'improvements', 'providerErrors', 'slackDeliveries', 'outboxItems']);
});
