import { digest } from '../slack-intake/config';
import type { SourceUnit } from '../slack-intake/contracts';
import type { IntakeLedger } from '../slack-intake/ledger';
export interface EvidenceRecord {
    independent?:false;
    id: string; sourceId: string; unitId: string; version: string; text: string; contentSha256: string; url: string;
    extraction?: { originalSha256:string; references:Record<string,number>[]; warnings:string[] };
    observedAt: string; admittedAt?:string; readerVersion: string; limitations: string[];
}
export const evidenceIdentity = (sourceId: string, unitId: string, version: string) => `source:${digest(JSON.stringify([sourceId, unitId, version]))}`;
export function retainEvidence(ledger: IntakeLedger, unit: SourceUnit): void {
    if (!ledger.source || ['lookup', 'inventory'].includes(unit.kind) || !unit.text.trim()) return;
    const id = evidenceIdentity(ledger.source.id, unit.id, unit.version), prior = ledger.get<EvidenceRecord>('evidence', id);
    if (prior) { if (prior.contentSha256 !== digest(unit.text)) throw Error('Immutable source version changed'); return; }
    ledger.put('evidence', id, { id, sourceId: ledger.source.id, unitId: unit.id, version: unit.version, text: unit.text, contentSha256: digest(unit.text), url: unit.url,
        observedAt: unit.observedAt, admittedAt:ledger.get<{at?:string}>('admission',`${unit.id}:${unit.version}`)?.at, readerVersion: 'slack-native-v1',...(unit.authorship?{independent:false as const}:{}), limitations: [...(unit.authorship?['Confirmed Office-authored digest or identified repost; not independent corroboration']:[]),unit.evidence === 'formatted-excerpt' ? 'Participant report from a formatted excerpt; independently unverified' : 'Native source observation; independently unverified', ...unit.references.map(r => `Reference ${r.kind}:${r.id}; separate content and permission checks apply`)] } satisfies EvidenceRecord);
}
