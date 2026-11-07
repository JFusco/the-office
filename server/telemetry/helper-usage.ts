import { resolve } from 'node:path';
import type { RunAccounting } from '../../src/contracts/telemetry';
import { readBoundedNoFollow } from '../store/owned-artifact';
import { codexHome } from './codex-rollout-file';
import { claudeAccounting, codexAccounting, withReason } from './run-accounting';

export const HELPER_STDOUT_MAX_BYTES = 64 * 1024 * 1024;

/**
 * Accounting for one terminated feature-review helper call (an independently launched provider
 * invocation). Claude calls carry their `result` event in stdout; Codex calls are read from their
 * rollouts like ordinary workers.
 */
export async function helperAccounting(folder: string, provider: string, session: string, startedAt: string, at: string, home = codexHome()): Promise<RunAccounting | null> {
    if (provider === 'codex') return { ...await codexAccounting(home, session, startedAt, at), provenance: 'helper-import' };
    if (provider !== 'claude') return null;
    const source = { evidenceId: `claude:${session || 'no-session'}`, sourcePath: null as string | null, sourceSha256: null as string | null, at, provenance: 'helper-import' as const };
    const read = await readBoundedNoFollow(resolve(folder, 'stdout.log'), HELPER_STDOUT_MAX_BYTES);
    if ('reason' in read) return withReason(claudeAccounting(null, source), `helper-output-${read.reason}`);
    let result: Record<string, any> | null = null;
    for (const line of read.text.split('\n')) {
        try {
            const event = JSON.parse(line);
            if (event?.type === 'result' && session && event.session_id === session) result = event;
        } catch { /* an unfinished line is not evidence */ }
    }
    return claudeAccounting(result, { ...source, sourcePath: read.path, sourceSha256: read.sha256 });
}
