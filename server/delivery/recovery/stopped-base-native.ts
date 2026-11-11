import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { rootArtifact } from '../../store/readback-evidence';
import { scanClaudeToolRecords } from '../../workers/claude-tool-inventory';
import type { WorkTime } from '../../../src/shared';

// These are the retained Claude record forms inspected for this recovery. An
// unknown form cannot silently become positive coverage of a stopped writer.
const recordTypes = new Set(['assistant', 'user', 'api-request-blob', 'queue-operation', 'attachment',
    'atis-latch', 'last-prompt', 'api-request-shape', 'api-request', 'tools-used']);
const contentTypes = new Set(['text', 'thinking', 'redacted_thinking', 'image', 'document', 'tool_use', 'tool_result']);

/** Inventory only: original completion and a no-effects verdict are never synthesized here. */
export function readStoppedClaudeNative(work: Pick<WorkTime, 'id' | 'sessionId' | 'provider'>, cwd: string,
    root = resolve(homedir(), '.claude', 'projects'), readBytes: (path: string) => Buffer = readFileSync, registeredPrimary?: string) {
    if (work.provider !== 'claude' || !/^[a-zA-Z0-9-]+$/.test(work.id) || work.sessionId !== work.id || cwd !== resolve(cwd) ||
        registeredPrimary !== undefined && registeredPrimary !== resolve(registeredPrimary))
        throw new Error('Exact original stopped Claude identity required');
    const path = resolve(root, cwd.replace(/[^a-zA-Z0-9-]/g, '-'), `${work.id}.jsonl`);
    const file = rootArtifact(root, path), bytes = readBytes(file.path);
    if (bytes.length > 8 * 1024 * 1024 || createHash('sha256').update(bytes).digest('hex') !== file.sha256)
        throw new Error('Stopped native bytes changed or exceeded the bound');
    const lines = bytes.toString('utf8').trim().split('\n');
    if (!bytes.length || !lines.length || lines.length > 10_000) throw new Error('Stopped native record coverage exceeds its bound');
    const records = lines.map(line => JSON.parse(line));
    const recordedCwds = new Set<string>(), identities = new Map<string, { cwd: string; messageId: unknown }>();
    for (const record of records) {
        if (!record || typeof record !== 'object' || Array.isArray(record) || !recordTypes.has(record.type))
            throw new Error('Unknown stopped native record format');
        const content = record.message?.content;
        if (content !== undefined && typeof content !== 'string' && !Array.isArray(content))
            throw new Error('Unknown stopped native message format');
        if (Array.isArray(content) && content.some(item => !item || typeof item !== 'object' || !contentTypes.has(item.type)))
            throw new Error('Unknown stopped native content format');
        if (record.cwd) recordedCwds.add(record.cwd);
        if (typeof record.uuid === 'string' && Array.isArray(content) && content.some(item => ['tool_use', 'tool_result'].includes(item.type))) {
            const identity = { cwd: record.cwd, messageId: record.message?.id }, prior = identities.get(record.uuid);
            if (prior && !isDeepStrictEqual(prior, identity)) throw new Error('Conflicting stopped native record identity');
            identities.set(record.uuid, identity);
        }
    }
    // The registry-bound primary can appear in historical diagnostic records.
    // Preserve it as evidence; it never becomes a source-worker fallback or an
    // authorization to write there. The eventual audit must assess every CWD.
    const inventory = scanClaudeToolRecords(records, work.sessionId, value => value === cwd || registeredPrimary !== undefined && value === registeredPrimary);
    if (!inventory.calls.size || inventory.calls.size > 512 || inventory.orphanResults.length)
        throw new Error('Stopped native invocation coverage is incomplete');
    for (const id of inventory.calls.keys()) {
        const issued = inventory.issued.get(id), results = inventory.genuineResults.get(id) || [];
        if (issued?.length !== 1) throw new Error('One genuine original invocation is required for every stopped call');
        if (inventory.outputs.has(id) && !results.length || results.some(result =>
            result.index <= issued[0].index || result.parentUuid !== issued[0].uuid ||
            !isDeepStrictEqual(result.value, inventory.outputs.get(id))))
            throw new Error('Stopped native result lacks its original invocation parent');
    }
    if (!isDeepStrictEqual(rootArtifact(root, path), file)) throw new Error('Stopped native evidence identity or bytes changed');
    // Internal raw values must be redacted before a later audit prompt or saved
    // projection. Their presence is not a positive semantic audit of effects.
    return { file, recordCount: records.length, recordedCwds: [...recordedCwds], ...inventory };
}
