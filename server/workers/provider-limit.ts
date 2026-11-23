const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** Codex's own refusal, as the first thing in the failure the runner reports for it (`workerFailure`). */
const CODEX_LIMIT = /^codex exited \d+: You['’]ve hit your usage limit\./;
/** A reset on another day names the date; one later the same day gives only the time. */
const RESET = / try again at (?:([A-Z][a-z]{2}) (\d{1,2})(?:st|nd|rd|th), (\d{4}) )?(\d{1,2}):(\d{2}) (AM|PM)\.?\s*$/;

/**
 * Whether a failed command's message is the provider refusing work because the account reached its usage limit,
 * and when the provider says to try again. Matched narrowly: the provider's own sentence at the start of the
 * runner's message for that program, never the same words elsewhere in a run's output.
 *
 * `retryAt` is present only when the message states a reset time. The provider prints no zone, so the time is
 * read as this machine's local time; a time with no date is the next such time after `now`. A time the local
 * calendar or clock does not hold (Feb 31st, an hour skipped for daylight saving) is not what the provider
 * said, and gives no `retryAt`.
 */
export function providerLimit(program: string, message: string, now = new Date()): { retryAt?: string } | undefined {
    if (program !== 'codex' || !CODEX_LIMIT.test(message)) return undefined;
    const at = message.match(RESET);
    if (!at || Number(at[4]) < 1 || Number(at[4]) > 12 || Number(at[5]) > 59) return {};
    const hour = Number(at[4]) % 12 + (at[6] === 'PM' ? 12 : 0), minute = Number(at[5]);
    const dated = at[1] !== undefined, month = dated ? MONTHS.indexOf(at[1]) : now.getMonth(), day = dated ? Number(at[2]) : now.getDate();
    if (month < 0) return {};
    let reset = new Date(dated ? Number(at[3]) : now.getFullYear(), month, day, hour, minute);
    const held = () => reset.getHours() === hour && reset.getMinutes() === minute;
    if (dated ? reset.getMonth() !== month || reset.getDate() !== day || !held() : !held()) return {};
    if (!dated && reset.getTime() <= now.getTime()) {
        reset = new Date(now.getFullYear(), month, day + 1, hour, minute);
        if (!held()) return {};
    }
    return { retryAt: reset.toISOString() };
}
