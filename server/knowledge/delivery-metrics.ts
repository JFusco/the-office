import type { DeliveryMetrics } from '../../src/shared';
import type { Store } from '../store/store';
import { findSubject } from './retrospective-subject';

const median = (values: number[]) => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const round = (value: number | null, places = 1) => value === null ? null : Math.round(value * 10 ** places) / 10 ** places;

/**
 * One window of delivery, counted from Harper's own trigger log and the jobs and runs it names.
 * Deterministic and model-free: these are the numbers the weekly roll-up reports and trends.
 */
export function deliveryMetrics(store: Store, from: Date, to: Date): DeliveryMetrics {
    const start = from.getTime(), end = to.getTime(), within = (at?: string) => !!at && Date.parse(at) >= start && Date.parse(at) < end;
    const knowledge = store.state.knowledge, records = (knowledge?.retrospectives || []).filter(record => within(record.eventAt || record.at));
    const count = (trigger: string) => records.filter(record => record.trigger === trigger).length;
    let repairAttempts = 0, reroutes = 0, ciRepairs = 0, stillParked = 0;
    for (const record of records.filter(record => record.trigger === 'completed' || record.trigger === 'retired')) {
        const subject = findSubject(store, record.id);
        if (!subject) continue;
        repairAttempts += subject.repairCycle?.attempts || 0; reroutes += subject.reroutes; ciRepairs += subject.ciRepairs.length;
    }
    // Block dwell: from the park to the next stage the scheduler claimed for that job or run.
    const dwell: number[] = [];
    for (const record of records.filter(record => record.trigger === 'parked')) {
        const subject = findSubject(store, record.id), parkedAt = Date.parse(record.eventAt || record.at);
        const resumed = subject?.timing.map(timing => Date.parse(timing.claimedAt)).filter(at => at > parkedAt).sort((a, b) => a - b)[0];
        if (resumed) dwell.push((resumed - parkedAt) / 3600000); else stillParked++;
    }
    const queue = [...(store.state.coordination?.jobs || []), ...store.state.tickets].flatMap(work => work.timing || []).filter(timing => within(timing.claimedAt)).map(timing => timing.queueMs / 60000);
    const lessons = knowledge?.lessons || [];
    return {
        from: from.toISOString(), to: to.toISOString(),
        completed: count('completed'), retired: count('retired'), parked: count('parked'), repairBudgets: count('repair-budget'),
        repairAttempts, reroutes, ciRepairs,
        medianQueueMinutes: round(median(queue)), medianBlockHours: round(median(dwell)), stillParked,
        retrospectives: records.length,
        lessonsAdded: lessons.filter(lesson => within(lesson.createdAt)).length,
        lessonsRetired: lessons.filter(lesson => within(lesson.retiredAt)).length,
        recurrences: lessons.flatMap(lesson => lesson.recurrences || []).filter(recurrence => within(recurrence.at)).length,
    };
}
