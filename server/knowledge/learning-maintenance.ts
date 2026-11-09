import { existsSync, readdirSync, readFileSync, lstatSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../store/store';
import type { RetrospectivePacket } from './retrospective-facts';
import { terminalCandidates } from './retrospective-triggers';
import { recordTrigger } from './record-trigger';
import { learningDigest } from './learning-events';

export const LEARNING_BASELINES = ['feature-readers', 'feature-reviews', 'delivery-stages', 'cec-stages', 'maintenance-stages', 'investigations', 'investigation-resolutions', 'recoveries', 'orchestration', 'office-alerts'].map(source => `learning-v1:${source}`);
/** Producers capture only new accepted transactions. These markers never replay source history. */
export function baselineLearning(store: Store): void {
    const knowledge = store.state.knowledge;
    if (!knowledge) return;
    knowledge.baselines = [...new Set([...(knowledge.baselines || []), ...LEARNING_BASELINES])];
    knowledge.learningStartedAt ??= store.clock.now().toISOString();
}
/** Record terminal contributions independently of model success, then coalesce with accepted stages. */
export function maintainLearning(store: Store): void {
    const knowledge = store.state.knowledge;
    if (!knowledge) return;
    const before = JSON.stringify(knowledge);
    baselineLearning(store);
    for (const event of terminalCandidates(knowledge, store.state.coordination?.jobs || [], store.state.tickets, store.state.maintenance?.runs || [])) {
        recordTrigger(store, { id: event.id, at: event.at, jobId: event.subjectId, key: event.key, subject: event.subject, trigger: event.trigger, event: { stage: event.stage, head: event.head, steps: event.steps, reason: event.reason } });
    }
    if (JSON.stringify(knowledge) !== before) store.save();
}
/** Reads one aged packet's own identities; undefined when its reference status cannot be established. */
function packetReferences(file: string, name: string): { subject: string; refs: string[] } | undefined {
    try {
        const packet = JSON.parse(readFileSync(file, 'utf8')) as Partial<RetrospectivePacket>;
        const { trigger, job, catalog } = packet;
        if (typeof trigger?.id !== 'string' || learningDigest(trigger.id) !== name || typeof job?.kind !== 'string' || typeof job.id !== 'string' || !catalog || typeof catalog !== 'object' || Array.isArray(catalog)) return undefined;
        return { subject: `${job.kind}:${job.id}`, refs: [...Object.keys(catalog), ...Object.values(catalog).map(item => item?.ref).filter((ref): ref is string => typeof ref === 'string')] };
    } catch { return undefined; }
}
/** Delete only this feature's frozen packets, never existing provider/source artifacts. Each packet is
 * checked against its own references, so trimmed display summaries never decide retention. */
export function expireLearningPackets(store: Store): void {
    const knowledge = store.state.knowledge, root = resolve(store.dataRoot, 'retrospectives');
    if (!knowledge || !existsSync(root)) return;
    const lessons = [...knowledge.lessons, ...(knowledge.officeLessons || [])].filter(item => item.status === 'active');
    const followups = (knowledge.followups || []).filter(item => item.disposition !== 'confirmed'), improvements = (knowledge.improvements || []).filter(item => item.status !== 'closed');
    const retained = new Set([
        ...knowledge.pending.map(item => item.id),
        ...lessons.flatMap(item => [item.sourceRetrospectiveId, ...(item.recurrences || []).map(recurrence => recurrence.retrospectiveId)]),
        ...(knowledge.officeRecurrences || []).map(item => item.retrospectiveId),
    ].map(learningDigest));
    // Unresolved subjects retain every packet naming them, even if no lesson was produced.
    const unresolved = new Set(followups.map(item => item.source.id));
    for (const record of knowledge.retrospectives) if (unresolved.has(record.jobId)) retained.add(learningDigest(record.id));
    const subjects = new Set([...followups.map(item => `${item.source.kind}:${item.source.id}`), ...improvements.flatMap(item => item.incidents || [])]);
    const cited = new Set([...followups, ...improvements, ...lessons].flatMap(item => (item.evidence || []).map(proof => proof.ref)));
    for (const name of readdirSync(root)) {
        if (!/^[a-f0-9]{64}$/.test(name) || retained.has(name)) continue;
        const dir = resolve(root, name), file = resolve(dir, 'facts.json');
        const folder = lstatSync(dir);
        if (folder.isSymbolicLink() || !folder.isDirectory() || !existsSync(file)) continue;
        const stat = lstatSync(file);
        if (stat.isSymbolicLink() || !stat.isFile() || store.clock.now().getTime() - stat.mtimeMs <= 90 * 86400000) continue;
        // Oversized, malformed or mismatched packets are retained: their references cannot be established.
        const references = stat.size <= 65536 ? packetReferences(file, name) : undefined;
        if (!references || subjects.has(references.subject) || references.refs.some(ref => cited.has(ref))) continue;
        unlinkSync(file); (knowledge.expiredPackets ??= []).push(name); store.save();
    }
}
