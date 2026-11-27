/** gh's own wording of a stopped request, in the formats the publication command reads (`read-command.ts`). */
const ghStatus = (codes: string) => new RegExp(`(?:\\bgh: HTTP (?:${codes})\\b|\\bgh: [^\\n]*\\(HTTP (?:${codes})\\)|(?:^|\\bgh exited \\d+: |\\n)(?:Error: )?HTTP (?:${codes}): )`, 'm');

/** A gh diagnostic for one of the HTTP statuses a later read can outlast: 408, 429, 499, 500, 502, 503 and 504. */
export const ghTransientStatus = ghStatus('408|429|499|500|502|503|504');
/** A gh diagnostic for a bare 429, which GitHub sends for a refusal it gives no wording for. */
export const ghTooManyRequests = ghStatus('429');
/** A GitHub server error reported by gh: 500, 502, 503 or 504. */
export const ghServerError = (text: string) => ghStatus('500|502|503|504').test(text) || /\bgh\b[^\n]*\bHTTP 50[0234]\b/.test(text);

/** A read-only worker cut off by the model's output limit produced no effects; re-running the read is safe. */
export function incompleteReadOutput(text: string) {
    return /codex exited 1: Incomplete response returned, reason: max_output_tokens/i.test(text);
}

/**
 * A read that failed for a reason a later read can outlast. A write whose outcome is unknown is never one:
 * its uncertainty wording, and every hold, permission and ownership word, excludes the text first.
 */
export function temporaryReadFailure(text: string) {
    return !/(?:hold|backlog|prerequisite|permission|denied|forbidden|unauthorized|oauth|token|ownership|active owner|uncertain|mutation|must be reconciled|external effects|needs read-back|cannot be resent|unverified after read-back)/i.test(text)
        && (ghTransientStatus.test(text) || /(?:timed? out|timeout|read stopped producing output|ECONNRESET|ECONNREFUSED|EAI_AGAIN|connection (?:reset|closed|failed)|error connecting|HTTP 50[234]|rate.limit|(?:Error: )?codex exited 1: Selected model is at capacity\. Please try a different model\.)/i.test(text));
}
