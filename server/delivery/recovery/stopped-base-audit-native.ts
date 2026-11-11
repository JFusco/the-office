import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { createHash } from 'node:crypto';
import { rootArtifact } from '../../store/readback-evidence';
import { StoppedBaseAuditSchema, type StoppedBaseAuditInput } from './stopped-base-audit';
import type { WorkTime } from '../../../src/shared';

export const stoppedBaseAuditMarker = 'STOPPED_BASE_AUDIT_INPUT\n';

/** Custom audit response binding. The caller must also verify the saved worker's
 * completion, original reconciliation assignment and capability artifacts. */
export function readStoppedBaseAuditNative(work: WorkTime, cwd: string, input: StoppedBaseAuditInput,
    savedResult: unknown, root = resolve(homedir(), '.codex', 'sessions')) {
    if (work.provider !== 'codex' || !work.sessionId || !/^[a-zA-Z0-9-]+$/.test(work.sessionId) ||
        work.role !== 'lead' || work.stage !== 'stopped-base-update-audit' ||
        !Number.isFinite(Date.parse(work.startedAt)) || !work.endedAt || !Number.isFinite(Date.parse(work.endedAt)) ||
        Date.parse(work.endedAt) < Date.parse(work.startedAt) || cwd !== resolve(cwd))
        throw new Error('Exact completed stopped-audit native identity required');
    const matches: string[] = [];
    for (const delta of [-1, 0, 1]) {
        const day = new Date(Date.parse(work.startedAt) + delta * 86400000).toISOString().slice(0, 10).replaceAll('-', '/');
        const directory = resolve(root, day);
        if (!existsSync(directory)) continue;
        const names = readdirSync(directory);
        if (names.length > 10000) throw new Error('Stopped audit native directory exceeds its bound');
        matches.push(...names.filter(name => name.endsWith(`-${work.sessionId}.jsonl`)).map(name => resolve(directory, name)));
    }
    if (matches.length !== 1) throw new Error('One exact stopped-audit native session is required');
    const file = rootArtifact(root, matches[0]);
    const bytes = readFileSync(file.path), lines = bytes.toString('utf8').trim().split('\n');
    if (!bytes.length || bytes.length > 8 * 1024 * 1024 || lines.length > 10000 ||
        createHash('sha256').update(bytes).digest('hex') !== file.sha256)
        throw new Error('Stopped audit native session changed or exceeds its bound');
    const records = lines.map(line => JSON.parse(line));
    const metadata = records.filter(record => record.type === 'session_meta');
    const terminal = records.at(-1);
    if (metadata.length !== 1 || metadata[0].payload?.id !== work.sessionId || metadata[0].payload.cwd !== cwd ||
        terminal?.type !== 'event_msg' || terminal.payload?.type !== 'task_complete')
        throw new Error('Stopped audit native session or terminal response differs');
    const messages = records.filter(record => record.type === 'response_item' && record.payload?.type === 'message' && record.payload.role === 'user')
        .map(record => {
            if (!Array.isArray(record.payload.content)) throw new Error('Malformed stopped audit native input');
            return record.payload.content.map((part: { text?: string }) => part.text || '').join('');
        }).filter(text => text.includes(stoppedBaseAuditMarker));
    // WorkerRuntime adds its capability and lesson briefing after the issued task.
    // Bind the exact JSON and its boundary while allowing that appended briefing.
    const expected = stoppedBaseAuditMarker + JSON.stringify(input);
    const task = messages[0] || '', start = task.indexOf(expected), tail = task.slice(start + expected.length);
    if (messages.length !== 1 || start < 0 || task.split(stoppedBaseAuditMarker).length !== 2 || tail && !tail.startsWith('\n'))
        throw new Error('Original stopped audit issued input differs');
    const result = StoppedBaseAuditSchema.parse(JSON.parse(terminal.payload.last_agent_message));
    if (!isDeepStrictEqual(result, savedResult) || result.originalWorkId !== input.originalWorkId || result.nativeSha256 !== input.nativeSha256)
        throw new Error('Original stopped audit native result differs');
    if (!isDeepStrictEqual(rootArtifact(root, file.path), file)) throw new Error('Stopped audit native file changed');
    return { file, result };
}
