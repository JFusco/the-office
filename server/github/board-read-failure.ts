import { refusedByRateLimit } from './call-outcome';

const QUOTA = "Wait for GitHub's rate limit to clear before retrying the board read.";
const ACCESS = 'Run gh auth refresh -h github.com -s project in your terminal, then recheck Projects access in the Office account.';
const RETRY = 'Retry the read-only project refresh; the last verified board is retained.';
/** A Projects access failure, once a rate-limit refusal has been ruled out: a stated secondary 403 is a refusal. */
const ACCESS_FAILURE = /permission|forbidden|scope|resource not accessible by integration|403/i;

/**
 * The diagnostic a failed board read leaves on the board it retains. It names what failed, with the refusal the
 * metered runner matched for that read (`refusal`) once, appended when the caught text lacks it. A refusal, matched
 * by the runner or stated in the caught text, gets the wait instruction; an access failure the access hint; anything
 * else the retry. The wording decides nothing: the runner alone tells the quota governor.
 */
export function boardReadFailure(error: unknown, refusal?: string): string {
    const caught = String(error), detail = refusal && !caught.includes(refusal) ? `${caught}: ${refusal}` : caught;
    const advice = refusal !== undefined || refusedByRateLimit(caught) ? QUOTA : ACCESS_FAILURE.test(caught) ? ACCESS : RETRY;
    return `GitHub Project read failed: ${detail}${/[.!?]$/.test(detail) ? '' : '.'} ${advice}`;
}
