import { createHash } from 'node:crypto';
import type { LearningOpportunity, LearningSubject } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';
import { recordAcceptedKnowledge } from './outcomes/accepted';
import { acceptedSourceBindings, retainAcceptedResult } from './outcomes/private-result';

export const learningDigest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Called only at a domain's accepted boundary, inside its save/transaction. */
export function recordLearningOpportunity(store: Store, event: LearningOpportunity): void {
    const knowledge = store.state.knowledge;
    if (!knowledge || event.origin === 'harper') return;
    const consumed = knowledge.learningConsumed ??= [];
    if (consumed.includes(event.id)) return;
    consumed.push(event.id);
    if (!knowledge.enabled) return;
    let batch = knowledge.pending.find(item => item.trigger === 'learning' && !item.frozen && item.source?.kind === event.subject.kind && item.source.id === event.subject.id);
    const fresh = !batch;
    if (!batch) {
        batch = { id: `learning:${learningDigest([event.subject, event.id])}`, jobId: event.subject.id, key: event.key, source: event.subject, subject: event.subject.kind, trigger: 'learning', createdAt: event.at, event: { stage: event.stage, head: event.digest, steps: 0, reason: event.summary.slice(0, 500) }, attempts: 0, nextAt: '', lastError: '', opportunities: [], eventIds: [] };
        knowledge.pending.push(batch);
    }
    batch.eventIds!.push(event.id);
    if (batch.opportunities!.length === 20) { batch.opportunities!.shift(); batch.omittedEvents = (batch.omittedEvents || 0) + 1; }
    batch.opportunities!.push(structuredClone(event));
    // A boundary already reached stays due; otherwise each event restarts the quiet window.
    if (event.phaseBoundary) batch.nextAt = '';
    else if (fresh || batch.nextAt) batch.nextAt = new Date(Date.parse(event.at) + 30 * 60000).toISOString();
}
/** Snapshot accepted content now; later source pruning cannot turn an unaccepted file into evidence.
 * Only real phase or terminal boundaries dispatch at once; other events wait for 30 quiet minutes. */
export function captureLearning(store: Store, subject: LearningSubject, key: string, stage: string, identity: string, result: unknown, summary: string, origin: 'work' | 'harper' = 'work', phaseBoundary = false): void {
    const keyNumber = key.replace(/^GH-/, '');
    if (store.state.coordination?.jobs?.some(job => job.id === subject.id && job.improvementId) || store.state.tickets.some(ticket => ticket.runId === subject.id && ticket.improvementId)) origin = 'harper';
    if (store.state.knowledge?.improvements?.some(item => item.providerId && [key, keyNumber].includes(item.providerId))) origin = 'harper';
    const digest = learningDigest(result), id = `${subject.kind}:${subject.id}:${stage}:${identity}:${digest}`;
    if(origin==='work')recordAcceptedKnowledge(store,subject,stage,id,result);
    const bindings = acceptedSourceBindings(store, subject), text = JSON.stringify(result);
    const evidence: LearningOpportunity['evidence'] = bindings.length ? [retainAcceptedResult(store, id, result, summary, bindings)] : [{ kind: 'learning', ref: id, url: '', detail: text.length > 1500 ? text.slice(0, 1450) + '\n[Accepted result excerpt; remainder omitted]' : text }];
    recordLearningOpportunity(store, { id, subject, key, stage, digest, at: store.clock.now().toISOString(), disposition: 'accepted', origin, phaseBoundary, summary: bindings.length ? 'Accepted work with scoped knowledge; details retained privately' : summary.slice(0, 1500), evidence });
}
