import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RunAccounting } from '../../src/contracts/telemetry';
import { codexHome } from './codex-rollout-file';
import { claudeAccounting, codexAccounting } from './run-accounting';

export const HELPER_STDOUT_MAX_BYTES = 64 * 1024 * 1024;

/**
 * Accounting for one terminated feature-review helper call (an independently launched
 * provider invocation). Claude calls carry their `result` event in stdout; Codex calls are
 * read from their rollout like ordinary workers.
 */
export function helperAccounting(folder: string, provider: string, session: string, startedAt: string, at: string, home = codexHome()): RunAccounting | null {
    if (provider === 'codex') return { ...codexAccounting(home, session, startedAt, at), provenance: 'helper-import' };
    if (provider !== 'claude') return null;
    const source = { evidenceId: `claude:${session || 'no-session'}`, sourcePath: null as string | null, sourceSha256: null as string | null, at, provenance: 'helper-import' as const };
    const path = resolve(folder, 'stdout.log');
    let bytes: Buffer;
    try {
        const info = lstatSync(path);
        if (!info.isFile() || info.size > HELPER_STDOUT_MAX_BYTES) return gap(claudeAccounting(null, source), 'helper-output-unusable');
        bytes = readFileSync(path);
    }
    catch { return gap(claudeAccounting(null, source), 'helper-output-missing'); }
    let result: Record<string, any> | null = null;
    for (const line of bytes.toString('utf8').split('\n')) {
        try {
            const event = JSON.parse(line);
            if (event?.type === 'result' && session && event.session_id === session) result = event;
        } catch { /* an unfinished line is not evidence */ }
    }
    return claudeAccounting(result, { ...source, sourcePath: path, sourceSha256: createHash('sha256').update(bytes).digest('hex') });
}

function gap(accounting: RunAccounting, reason: string): RunAccounting {
    accounting.usage.reasons = [reason];
    accounting.cost.reasons = [reason];
    return accounting;
}
