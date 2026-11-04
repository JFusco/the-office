import type { HealthReport, ITState, ServiceHealth } from '../shared';

/** Prefer newer background evidence and expire saved observations even when HTTP refresh fails. */
export function currentServices(report?: HealthReport | null, it?: ITState, now = Date.now()): ServiceHealth[] {
    const rows = new Map((report?.services || []).map(s => [s.id, s]));
    for (const saved of it?.services || []) {
        const existing = rows.get(saved.id);
        if (!existing || Date.parse(it!.checkedAt) > Date.parse(report?.checkedAt || '') && (Date.parse(saved.checkedAt) || 0) >= (Date.parse(existing.checkedAt) || 0)) rows.set(saved.id, saved);
    }
    return [...rows.values()].map(service => {
        if (!service.expiresAt || now < Date.parse(service.expiresAt)) return service;
        return { ...service, status: 'unknown', statusLabel: service.kind === 'activity' ? 'Previously working' : 'Update overdue', detail: service.kind === 'activity' ? service.detail : `Saved result: ${service.detail} A fresh check is overdue.` };
    });
}
