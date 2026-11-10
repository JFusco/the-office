import type { KnowledgeSourceBinding, LearningSubject, LessonEvidence } from '../../../src/contracts/knowledge';
import type { Store } from '../../store/store';
import { digest } from '../slack-intake/config';
import { exposureBindings,requestSourceBindings } from '../lookup/exposure-bindings';

/** Potential quotation is scoped by every supplied/retrieved source, regardless of application claims. */
export function acceptedSourceBindings(store: Store, subject: LearningSubject): KnowledgeSourceBinding[] {
    const knowledge = store.state.knowledge;
    const exposures = (knowledge?.exposures || []).filter(e => e.dispatchedAt && e.subject?.kind === subject.kind && e.subject.id === subject.id);
    const bindings=[...exposures.flatMap(e=>exposureBindings(knowledge,e)),...(subject.kind==='message'?requestSourceBindings(store.state,subject.id):[])];
    return [...new Map(bindings.map(binding=>[JSON.stringify(binding),binding])).values()];
}

/** Exact accepted bytes stay outside ordinary state; the event keeps a digest-bound reference. */
export function retainAcceptedResult(store: Store, id: string, value: unknown, summary: string, bindings: KnowledgeSourceBinding[]): LessonEvidence {
    const body = JSON.stringify({ result: value, summary });
    if (Buffer.byteLength(body) > 1024 * 1024) throw Error('Accepted learning result exceeds private retention bound');
    const sha256 = digest(body);
    store.db.exec('CREATE TABLE IF NOT EXISTS knowledge_accepted_results(id TEXT PRIMARY KEY,sha256 TEXT NOT NULL,body TEXT NOT NULL)');
    store.db.prepare('INSERT OR IGNORE INTO knowledge_accepted_results VALUES(?,?,?)').run(id, sha256, body);
    const retained = readAcceptedResult(store, { id, sha256 });
    if (!retained) throw Error('Accepted learning result binding changed');
    return { kind: 'learning', ref: id, url: '', detail: 'Scoped accepted result; exact bytes retained privately', sourceBindings: bindings, acceptedResult: { id, sha256 } };
}
export function readAcceptedResult(store: Store, reference: { id: string; sha256: string }): { result: unknown; summary: string } | undefined {
    try {
        const row = store.db.prepare('SELECT sha256,body FROM knowledge_accepted_results WHERE id=?').get(reference.id) as { sha256: string; body: string } | undefined;
        if (!row || row.sha256 !== reference.sha256 || Buffer.byteLength(row.body) > 1024 * 1024 || digest(row.body) !== reference.sha256) return;
        const value = JSON.parse(row.body);
        if (typeof value.summary !== 'string') return;
        return value;
    } catch { return; }
}
