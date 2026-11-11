import { digest } from '../digest';
import type { SourceUnit } from './source-unit';
import type { SourceLedger } from './ledger';
export interface EvidenceRecord {
    id: string; sourceId: string; unitId: string; version: string; text: string; contentSha256: string; url: string;
    extraction?: { originalSha256:string; references:Record<string,number>[]; warnings:string[] };
    observedAt: string; admittedAt?:string; readerVersion: string; limitations: string[];
}
export const evidenceIdentity = (sourceId: string, unitId: string, version: string) => `source:${digest(JSON.stringify([sourceId, unitId, version]))}`;
/** Stores one immutable version of admitted source text. The caller sets the reader version and its limits. */
export function retainEvidence(ledger: SourceLedger, unit: SourceUnit): void {
    if (!unit.text.trim()) return;
    const id = evidenceIdentity(ledger.source.id, unit.id, unit.version), prior = ledger.get<EvidenceRecord>('evidence', id);
    if (prior) { if (prior.contentSha256 !== digest(unit.text)) throw Error('Immutable source version changed'); return; }
    ledger.put('evidence', id, { id, sourceId: ledger.source.id, unitId: unit.id, version: unit.version, text: unit.text, contentSha256: digest(unit.text), url: unit.url,
        observedAt: unit.observedAt, admittedAt:ledger.get<{at?:string}>('admission',`${unit.id}:${unit.version}`)?.at, readerVersion: 'pending', limitations: ['Source observation; independently unverified'] } satisfies EvidenceRecord);
}
