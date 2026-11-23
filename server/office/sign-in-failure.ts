import { redactEvidence } from '../incidents/redact-evidence';
import { sanitize } from './security';

export const MAX_SIGN_IN_DIAGNOSTIC_LENGTH = 1500;

/**
 * Redact the complete provider diagnostic before shortening it for display.
 * Empty or oversized diagnostics are omitted.
 */
export function signInFailure(text = '', prefix = ''): string {
    if (text.length > MAX_SIGN_IN_DIAGNOSTIC_LENGTH) return '';
    return (prefix + redactEvidence(text)).replace(/\s+/g, ' ').trim().slice(0, 400);
}

/** Decode the same stdout event forms as workerFailure, before its sanitization and length cap. */
function stdoutMessage(program: string, line: string): string | undefined {
    try {
        const event = JSON.parse(line);
        if (!['error', 'turn.failed'].includes(event.type) && !(program === 'claude' && ['result', 'assistant'].includes(event.type)))
            return;

        let message = event.error?.message || event.message;
        if (program === 'claude' && event.type === 'result' && (event.is_error || String(event.subtype || '').startsWith('error')))
            message = event.errors?.join('; ') || event.result || event.subtype;
        if (program === 'claude' && event.type === 'assistant' && (event.isApiErrorMessage || event.error))
            message = event.message?.content?.filter((part: { type: string }) => part.type === 'text').map((part: { text: string }) => part.text).join(' ') || event.error;
        if (typeof message !== 'string') return;

        try {
            const nested = JSON.parse(message);
            message = nested?.error?.message || nested?.message || message;
        } catch { /* The message is plain text. */ }
        return typeof message === 'string' ? message : undefined;
    } catch { /* This line did not supply a runner diagnostic. */ }
}

export function stdoutSignInFailure(program: string, runnerError: string, stdout: string): string {
    const prefix = /^Error: \S+ exited (?:\d+|null): /.exec(runnerError)?.[0];
    if (!prefix) return stdout ? '' : signInFailure(runnerError);

    for (const line of stdout.trim().split('\n').reverse()) {
        const message = stdoutMessage(program, line);
        if (message === undefined) continue;
        const failure = signInFailure(message, prefix);
        // Confirm the decoded event supplied the runner's message. Only the redacted quote leaves this function.
        return failure && sanitize(prefix + message) === runnerError ? failure : '';
    }
    return '';
}
