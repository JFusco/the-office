import { ContextReadChanged } from './session-context-lines';

/** Fixed failure categories only: never publish native stderr, transcript text, paths or credentials. */
export function sessionInventoryFailureDetail(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
    let reason = '';
    if (error instanceof ContextReadChanged)
        reason = '[context-changing] A session log changed during the bounded read.';
    else if (message === 'Codex session context contains an incomplete record')
        reason = '[context-record] A session log record is incomplete or malformed.';
    else if (message === 'Session context scan exceeded its read deadline')
        reason = '[context-deadline] A session context scan exceeded its bounded read deadline.';
    else if (message === 'A live Codex session has no metadata')
        reason = '[session-metadata] Matching persisted metadata for a live Codex process is unavailable.';
    else if (message === 'Session context file identity changed during its read' || message === 'Codex rollout identity does not match the loaded session')
        reason = '[context-identity] A loaded session and its context-file identity did not match.';
    else if (message === 'Session context record coverage is unavailable')
        reason = '[context-record-limit] A session log record exceeds the bounded reader limit.';
    else if (code === 'ENOENT')
        reason = '[inventory-missing] A required local inventory file or executable is unavailable.';
    else if (code === 'EACCES' || code === 'EPERM')
        reason = '[inventory-permission] The inventory reader was denied a required local read.';
    else if (code === 'ERR_SQLITE_ERROR' || code === 'SQLITE_BUSY' || code === 'SQLITE_LOCKED')
        reason = '[metadata-database] The native session metadata database could not be read.';
    else if (/^lsof exited [0-9]+:/.test(message))
        reason = '[descriptor-read] Native Codex descriptor listing did not complete.';
    const deadline = /timed? out|timeout/i.test(message) || message === 'Session context scan exceeded its read deadline';
    return `Session inventory could not complete${deadline ? ' within its read deadline' : ''}. ${reason ? reason + ' ' : ''}Ownership remains unverified; this does not establish a login failure.`;
}
