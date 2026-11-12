import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import { ITFollowUps } from '../../../src/health/ITFollowUps';
import { OutboxMaintenanceStatus } from '../../../src/conversations/OutboxMaintenanceStatus';
import type { ITState, OfficeSnapshot } from '../../../src/shared';

test('retired diagnostics remain visibly incomplete and do not conceal an unrelated current fault', () => {
    const retirement = { kind: 'incomplete-history', reason: 'Joe accepted the missing historical snapshots.', at: '2026-11-12T20:00:00Z', requestId: 'disposition', recordSha256: 'a'.repeat(64) };
    const it = { investigations: [{ id: 'old-case', source: { id: 'old-worker', ticket: 'GH-350' }, attempts: 3, status: 'blocked', retirement }] } as ITState;
    const html = renderToStaticMarkup(createElement(ITFollowUps, { it, followUps: [{ id: 'unrelated', owner: 'You', detail: 'Current provider needs access' }] }));
    expect(html).toContain('historical warnings acknowledged by Joe');
    expect(html).toContain('causes remain unresolved');
    expect(html).toContain('Original status: blocked');
    expect(html).toContain('3 diagnosis attempts retained');
    expect(html).toContain('Current provider needs access');
    expect(html).not.toContain('investigations remain unresolved');
    const snapshot = { maintenance: { runs: [{ id: 'old-run', status: 'blocked', retirement }] } } as unknown as OfficeSnapshot;
    const maintenance = renderToStaticMarkup(createElement(OutboxMaintenanceStatus, { snapshot, actionId: 'maintenance:old-run' }));
    expect(maintenance).toContain('Retired as incomplete history');
    expect(maintenance).toContain('not completed or retried');
    expect(maintenance).not.toContain('ask Morgan');
});
