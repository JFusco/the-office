import { IntakeLedger } from './ledger';
import { newTask } from './collect';
import { digest } from './config';
import type { CollectionPolicy } from '../sources/collection-policy';
import { LIMITS, type SourceUnit, type ReadTask } from './contracts';
import { linkKey, type LinkRecord } from './read-links';
/** One load of units and tasks per reconsideration pass, reused for every reference. */
export interface ReferenceIndex { resources: Map<string, SourceUnit>; tasks: ReadTask[] }
/** File and canvas bodies are the only units a reference resolves to. */
const resourceUnits = (ledger: IntakeLedger) => [...ledger.where<SourceUnit>('unit', '$.kind', 'file'), ...ledger.where<SourceUnit>('unit', '$.kind', 'canvas')];
export function referenceIndex(ledger: IntakeLedger, units = resourceUnits(ledger), tasks = ledger.all<ReadTask>('task')): ReferenceIndex {
    const resources = new Map<string, SourceUnit>();
    for (const unit of units) if (unit.kind === 'file' || unit.kind === 'canvas') resources.set(`${unit.kind}:${unit.resource}`, unit);
    return { resources, tasks };
}
const unavailable = (id: string, reason: string) => ({ id, unavailable: reason, note: 'Not read; do not infer its content.' });
/** Undefined only while a reference is still pending; terminal gaps become explicit unavailable entries. */
export function readyReferences(ledger: IntakeLedger, unit: SourceUnit, index = referenceIndex(ledger)): unknown[] | undefined {
    const references: unknown[] = [];
    const link = (url: string): boolean => {
        const record = ledger.get<LinkRecord>('link', linkKey(`${unit.id}:${unit.version}`, url));
        if (!record || record.state === 'pending') return false;
        references.push(record.state === 'read' ? { url, result: record.result } : unavailable(url, record.reason || record.state));
        return true;
    };
    for (const ref of unit.references) {
        if (ref.kind === 'internal') references.push(unavailable(ref.id, 'internal-reference-not-dereferenced'));
        else if (ref.kind === 'link') {
            if (!link(ref.id)) return;
            for (const child of ledger.get<LinkRecord>('link', linkKey(`${unit.id}:${unit.version}`, ref.id))?.children || []) if (!link(child)) return;
        } else {
            const source = index.resources.get(`${ref.kind}:${ref.id}`);
            if (source && ledger.get<{ state: string }>('admission', `${source.id}:${source.version}`)?.state === 'admitted' && source.state !== 'inaccessible' && source.state !== 'error') { references.push({ id: source.id, version: source.version, text: source.text }); continue; }
            if (source) { references.push(unavailable(source.id, source.reason || source.state)); continue; }
            const reads = index.tasks.filter(t => t.kind === ref.kind && t.resource === ref.id && t.channel === unit.channel);
            if (!reads.length || reads.some(t => t.status === 'pending' || t.status === 'running')) return;
            references.push(unavailable(`${ref.kind}:${ref.id}`, reads.some(t => t.status === 'needs-attention') ? 'resource-read-needs-attention' : 'resource-body-unavailable'));
        }
    }
    return references;
}
export function queueReconsideration(ledger: IntakeLedger, config: CollectionPolicy, week: string, at: string): void {
    // Readiness depends only on ledger records, so an unchanged revision has nothing new to queue.
    if (ledger.get<string>('meta', 'reconsidered') === ledger.revision()) return;
    const tasks = ledger.all<ReadTask>('task'), index = referenceIndex(ledger, resourceUnits(ledger), tasks);
    for (const unit of ledger.where<SourceUnit>('unit', '$.state', 'deferred')) {
        if (unit.requests.length || !unit.references.length) continue;
        const references = readyReferences(ledger, unit, index); if (!references) continue;
        if (Buffer.byteLength(JSON.stringify([unit, references])) > LIMITS.text) continue;
        const identity = digest(JSON.stringify([unit.id, unit.version, references]));
        if (tasks.some(t => t.resource === identity && t.processing?.length)) continue;
        const task = newTask(config, unit.channel, 'channel', identity, '0.000000', unit.ts || '0.000000', week, at);
        task.processing = [`${unit.id}:${unit.version}`]; ledger.put('task', task.id, task); tasks.push(task);
    }
    // Recorded after this pass's own task writes: rerunning would only find the same identities.
    ledger.put('meta', 'reconsidered', ledger.revision());
}
