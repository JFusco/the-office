import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LearningSubject, LessonExposure } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';
import type { LessonSelection } from './lesson-selection';

/** The manifest is immutable; dispatch is recorded separately in the store. */
export function prepareExposure(store: Store, dir: string, id: string, stage: string, selection: LessonSelection, subject?: LearningSubject): void {
    const record: LessonExposure = { id, stage, subject, at: store.clock.now().toISOString(), digest: createHash('sha256').update(selection.text).digest('hex'), eligible: selection.eligible, selected: selection.selected, omitted: selection.omitted };
    writeFileSync(resolve(dir, 'lessons.json'), JSON.stringify(record), { flag: 'wx', mode: 0o600 });
    if (store.state.knowledge) { (store.state.knowledge.exposures ??= []).push(record); store.save(); }
}
export function dispatchExposure(store: Store, id: string): void {
    const record = store.state.knowledge?.exposures?.find(entry => entry.id === id);
    if (record && !record.dispatchedAt) { record.dispatchedAt = store.clock.now().toISOString(); store.save(); }
}
export function assignmentSubject(store: Store, requestId = '', ticket = '', featureId?: string): LearningSubject | undefined {
    if (featureId) return { kind: 'feature', id: featureId };
    const job = store.state.coordination?.jobs?.find(job => job.id === requestId || job.key === ticket);
    if (job) return { kind: 'job', id: job.id };
    const maintenance = store.state.maintenance?.runs.find(run => run.id === requestId);
    if (maintenance) return { kind: 'maintenance', id: maintenance.id };
    const run = store.state.tickets.find(run => run.key === ticket);
    return run?.runId ? { kind: 'ticket', id: run.runId } : undefined;
}
