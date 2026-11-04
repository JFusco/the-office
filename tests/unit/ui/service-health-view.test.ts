import { expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { currentServices } from '../../../src/health/service-health-view';
import { ServiceHealthRow } from '../../../src/health/ServiceHealthRow';
import type { HealthReport, ITState, ServiceHealth } from '../../../src/shared';

test('saved green ages even when refresh is unavailable and retains the source timestamp', () => {
    const service: ServiceHealth = { id: 'provider:openai', name: 'OpenAI', kind: 'provider', status: 'connected', detail: 'All systems operational.', checkedAt: '2026-11-04T20:00:00Z', expiresAt: '2026-11-04T20:02:30Z' };
    const report = { services: [service] } as HealthReport;
    expect(currentServices(report, undefined, Date.parse('2026-11-04T20:01:00Z'))[0].status).toBe('connected');
    expect(currentServices(report, undefined, Date.parse('2026-11-04T20:03:00Z'))[0]).toMatchObject({ status: 'unknown', statusLabel: 'Update overdue', checkedAt: service.checkedAt });
    expect(service.status).toBe('connected');
});
test('newer background Slack receipt supersedes empty panel evidence without losing other rows', () => {
    const report = { checkedAt: '2026-11-04T20:00:00Z', services: [{ id: 'slack', checkedAt: '', status: 'unknown' }, { id: 'sessions:1', checkedAt: '' }] } as HealthReport;
    const it = { checkedAt: '2026-11-04T20:01:00Z', services: [{ id: 'slack', checkedAt: '2026-11-04T20:00:30Z', status: 'connected' }] } as ITState;
    expect(currentServices(report, it).map(s => s.id)).toEqual(['slack', 'sessions:1']);
    expect(currentServices(report, it)[0].status).toBe('connected');
});
test('row shows evidence labels, no invented date, and a provider source link', () => {
    const empty = renderToStaticMarkup(createElement(ServiceHealthRow, { service: { id: 'slack', name: 'Slack', status: 'unknown', detail: 'No delivery', checkedAt: '', checkedLabel: 'Last confirmed delivery', statusLabel: 'No delivery evidence' } }));
    expect(empty).toContain('Last confirmed delivery: Not recorded'); expect(empty).not.toContain('Invalid Date');
    const provider = renderToStaticMarkup(createElement(ServiceHealthRow, { service: { id: 'provider:openai', name: 'OpenAI', status: 'connected', statusLabel: 'Operational', detail: 'Public status', checkedAt: '2026-11-04T20:00:00Z', sourceUrl: 'https://status.openai.com/' } }));
    expect(provider).toContain('Operational'); expect(provider).toContain('href="https://status.openai.com/"');
});
