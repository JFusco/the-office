import { z } from 'zod';
import { digest } from '../../store/readback-evidence';
import { sanitizeObject } from '../../office/security';
import type { EffectIntent } from '../../../src/shared';
import type { readStoppedBaseOriginal } from './stopped-base-original';
import type { readStoppedClaudeNative } from './stopped-base-native';

const Text = z.string().trim().min(1), Hash = z.string().regex(/^[a-f0-9]{64}$/);
const AuditRow = z.object({ id: Text, sha256: Hash, verified: z.boolean(), semanticsComplete: z.boolean(), redactionSafe: z.boolean(),
    classification: z.enum(['read-only', 'bounded-local', 'historical-verified', 'repository-source', 'publication', 'unknown']),
    continuationUnaffected: z.boolean(), evidence: z.array(Text).min(1).max(16), uncertainty: z.string() }).strict();
export const StoppedBaseAuditSchema = z.object({ outcome: z.enum(['passed', 'blocked']), originalWorkId: Text, nativeSha256: Hash,
    noRepositorySourceOrPublicationMutation: z.boolean(), summary: Text, rows: z.array(AuditRow).min(1).max(4096) }).strict();
type Kind = 'input' | 'result' | 'missing-result' | 'cwd' | 'durable-effect';
type CoverageRow = { id: string; kind: Kind; sha256: string; redacted: boolean; redactionBlocksSemantics: boolean; historicalVerified: boolean; view: unknown };
type Original = ReturnType<typeof readStoppedBaseOriginal>;
type Native = ReturnType<typeof readStoppedClaudeNative>;

function redact(value: unknown) {
    return JSON.parse(JSON.stringify(sanitizeObject(value), (key, item) => {
        if (/^(?:password|passwd|pwd|token|secret|api[_-]?key|access[_-]?key(?:id)?|secret[_-]?access[_-]?key|session[_-]?token|credentials?|authorization|cookie|[\w]+_(?:TOKEN|SECRET|KEY|PASSWORD|CREDENTIALS?))$/i.test(key)) return '[redacted]';
        if (typeof item !== 'string') return item;
        return item.replace(/((?:https?|socks5?):\/\/)[^\s/@]+@/gi, '$1[redacted]@')
            .replace(/(\b[A-Z0-9_]*(?:TOKEN|SECRET|KEY|PASSWORD|CREDENTIALS?)\s*=)[^\r\n]*/gi, '$1[redacted]')
            .replace(/\b(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+|xox[abpr]-[A-Za-z0-9-]+)\b/g, '[redacted]')
            .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, '[redacted]')
            .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[redacted]');
    }));
}

/** Full semantic views are redacted before they leave this reader. Hashes retain original bytes' identity. */
export function stoppedBaseAuditInput(original: Original, native: Native, effects: readonly EffectIntent[]) {
    const nativeSuffix = `/${original.candidate.path.replace(/[^a-zA-Z0-9-]/g, '-')}/${original.worker.sessionId}.jsonl`;
    if (!native.file.path.endsWith(nativeSuffix) || !native.calls.size ||
        native.orphanResults.length || native.issued.size !== native.calls.size)
        throw new Error('Complete exact original native inventory is required for the stopped audit');
    const rows: CoverageRow[] = [];
    const add = (id: string, kind: Kind, value: unknown, historicalVerified = false) => {
        const view = redact(value);
        // Redacting executable input text can hide a later operation. Such input
        // cannot earn a positive verdict merely by asserting redaction was safe.
        const redactionBlocksSemantics = kind === 'input' && digest((value as any).input) !== digest(view.input);
        rows.push({ id, kind, sha256: digest(value), redacted: digest(value) !== digest(view), redactionBlocksSemantics, historicalVerified, view });
    };
    for (const [id, call] of native.calls) {
        const issued = native.issued.get(id)!;
        if (issued.length !== 1 || call.input === undefined) throw new Error('One genuine issued invocation and complete input per audit call is required');
        const source = { id, name: call.name, issued, references: call.referenceProvenance || [] };
        add(`${id}:input:display`, 'input', { ...source, namespace: 'display', input: call.input });
        if (issued[0].wirePresent) add(`${id}:input:wire`, 'input', { ...source, namespace: 'wire', input: issued[0].wireInput });
        if (native.outputs.has(id)) {
            const records = native.genuineResults.get(id);
            if (!records?.length) throw new Error('Genuine paired result provenance is required');
            add(`${id}:result`, 'result', { callId: id, result: native.outputs.get(id), records });
        } else add(`${id}:missing-result`, 'missing-result', { callId: id, issued, result: null, limitation: 'No original result or completion is available' });
    }
    for (const cwd of native.recordedCwds) add(`cwd:${digest(cwd)}`, 'cwd', { cwd,
        invocations: [...native.issued.entries()].filter(([, records]) => records.some(record => record.cwd === cwd)).map(([id]) => id) });
    const effectIds = new Set<string>();
    for (const effect of effects) {
        if (!effect.id || effectIds.has(effect.id) || effect.work.projectId !== original.claim.work.projectId ||
            effect.work.kind !== 'delivery' || effect.work.id !== original.worker.requestId)
            throw new Error('Unique original-job effect coverage is required');
        effectIds.add(effect.id);
        const dispatched = Date.parse(effect.dispatchedAt), verified = Date.parse(effect.verifiedAt), started = Date.parse(original.worker.startedAt);
        const historical = effect.status === 'verified' && [dispatched, verified, started].every(Number.isFinite) && dispatched <= verified && verified < started;
        add(`effect:${effect.id}`, 'durable-effect', effect, historical);
    }
    const packet = { originalWorkId: original.worker.id, nativeSha256: native.file.sha256, nativeRecordCount: native.recordCount,
        originalArtifacts: original.files, rows };
    if (rows.length > 4096 || new Set(rows.map(row => row.id)).size !== rows.length || Buffer.byteLength(JSON.stringify(packet)) > 1024 * 1024)
        throw new Error('Stopped audit semantic context exceeds its bound; none was truncated');
    return packet;
}
export type StoppedBaseAuditInput = ReturnType<typeof stoppedBaseAuditInput>;

/** Exact row IDs/counts are response constraints, not an assertion that the effects were safe. */
export function stoppedBaseAuditResponseSchema(input: StoppedBaseAuditInput) {
    const ids = input.rows.map(row => row.id);
    if (!ids.length || ids.length > 4096 || new Set(ids).size !== ids.length) throw new Error('Unique original audit coverage required');
    return StoppedBaseAuditSchema.extend({ rows: z.array(AuditRow.extend({ id: z.enum(ids as [string, ...string[]]) }))
        .length(ids.length).refine(rows => new Set(rows.map(row => row.id)).size === rows.length, 'Every original coverage row is required once') }).strict();
}

/** A positive audit permits only later administrative reassessment, never completion or source acceptance. */
export function assertStoppedBaseAudit(input: StoppedBaseAuditInput, response: unknown) {
    const result = stoppedBaseAuditResponseSchema(input).parse(response);
    if (result.outcome !== 'passed' || result.originalWorkId !== input.originalWorkId || result.nativeSha256 !== input.nativeSha256 ||
        !result.noRepositorySourceOrPublicationMutation || input.rows.some(expected => {
            const row = result.rows.find(row => row.id === expected.id)!;
            return row.sha256 !== expected.sha256 || !row.verified || !row.semanticsComplete || !row.continuationUnaffected ||
                expected.redactionBlocksSemantics || expected.redacted && !row.redactionSafe ||
                !['read-only', 'bounded-local', 'historical-verified'].includes(row.classification) ||
                row.classification === 'historical-verified' && (expected.kind !== 'durable-effect' || !expected.historicalVerified) ||
                expected.kind === 'durable-effect' && (!expected.historicalVerified || row.classification !== 'historical-verified') ||
                expected.kind === 'missing-result' && (row.classification !== 'bounded-local' || !row.uncertainty.trim()) ||
                row.uncertainty.trim() !== '' && row.classification !== 'bounded-local';
        })) throw new Error('Positive complete original effects audit required; unknown effects remain stopped');
    return result;
}
