const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Codex's own refusal, as the first thing in the failure the runner reports for it (`workerFailure`). */
const CODEX_LIMIT = /^codex exited \d+: You['’]ve hit your usage limit\./;
const RESET = / try again at ([A-Z][a-z]{2}) (\d{1,2})(?:st|nd|rd|th), (\d{4}) (\d{1,2}):(\d{2}) (AM|PM)\.?\s*$/;

/**
 * Whether a failed command's message is the provider refusing work because the account reached its usage limit,
 * and when the provider says to try again. Matched narrowly: the provider's own sentence at the start of the
 * runner's message for that program, never the same words elsewhere in a run's output.
 *
 * `retryAt` is present only when the message states a reset time in the form the provider prints, which carries
 * no zone and is read as this machine's local time.
 */
export function providerLimit(program: string, message: string): { retryAt?: string } | undefined {
    if (program !== 'codex' || !CODEX_LIMIT.test(message)) return undefined;
    const at = message.match(RESET);
    if (!at) return {};
    const month = MONTHS.indexOf(at[1]), day = Number(at[2]), hour = Number(at[4]) % 12 + (at[6] === 'PM' ? 12 : 0), minute = Number(at[5]);
    const reset = new Date(Number(at[3]), month, day, hour, minute);
    // A date the calendar does not hold (Feb 31st) rolls over; it is not what the provider said.
    if (month < 0 || Number(at[4]) < 1 || Number(at[4]) > 12 || minute > 59 || reset.getMonth() !== month || reset.getDate() !== day) return {};
    return { retryAt: reset.toISOString() };
}
