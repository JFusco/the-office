import type { EvidenceSelection } from './task-briefing';
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LearningSubject, LessonExposure } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';
import type { LessonSelection } from './lesson-selection';

/** The manifest is immutable; dispatch is recorded separately in the store. */
export function prepareExposure(store: Store, dir: string, id: string, stage: string, selection: LessonSelection, subject?: LearningSubject, evidence?:EvidenceSelection): void {
    const record: LessonExposure = { id, stage, subject, at: store.clock.now().toISOString(), digest: createHash('sha256').update(selection.text).digest('hex'), eligible: selection.eligible, selected: selection.selected, omitted: selection.omitted,...(evidence?{evidence:evidence.selected,evidenceDigest:createHash('sha256').update(evidence.text).digest('hex'),brainSnapshot:evidence.snapshot,suppliedTextSha256:createHash('sha256').update([selection.text,evidence.text].filter(Boolean).join('\n')).digest('hex')}:{}) };
    const bytes=JSON.stringify({...record,lessonText:selection.text,sourceEvidenceText:evidence?.text||''});if(Buffer.byteLength(bytes)>65536)throw Error('Knowledge exposure exceeds its private artifact bound');
    writeFileSync(resolve(dir, 'lessons.json'), bytes, { flag: 'wx', mode: 0o600 });
    if (store.state.knowledge) { (store.state.knowledge.exposures ??= []).push(record); store.save(); }
}
export function dispatchExposure(store: Store, id: string): void {
    const record = store.state.knowledge?.exposures?.find(entry => entry.id === id);
    if (record && !record.dispatchedAt) { record.dispatchedAt = store.clock.now().toISOString(); store.save(); }
}
export function assignmentSubject(store: Store, requestId = '', ticket = '', featureId?: string): LearningSubject | undefined {
    if (featureId) return { kind: 'feature', id: featureId };
    const jobs=store.state.coordination?.jobs||[],exact=jobs.find(job=>job.id===requestId);
    if(exact)return {kind:'job',id:exact.id};
    const maintenance = store.state.maintenance?.runs.find(run => run.id === requestId);
    if (maintenance) return { kind: 'maintenance', id: maintenance.id };
    const exactRun=store.state.tickets.find(run=>run.runId===requestId||`ticket:${run.key}`===requestId);
    if(exactRun?.runId)return {kind:'ticket',id:exactRun.runId};
    if(requestId&&store.state.messages.some(m=>m.requestId===requestId||m.id===requestId))return {kind:'message',id:requestId};
    const matches=jobs.filter(job=>ticket&&job.key===ticket),job=matches.length===1?matches[0]:undefined;
    if (job) return { kind: 'job', id: job.id };
    const run = store.state.tickets.find(run => run.key === ticket);
    return run?.runId ? { kind: 'ticket', id: run.runId } : undefined;
}
