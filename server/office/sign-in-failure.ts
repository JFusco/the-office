import { redactEvidence } from '../incidents/redact-evidence';

/** A longer failure than this may be the end of a longer output, where a credential can have lost the start that marks it. */
const WHOLE_MESSAGE = 1500;

/**
 * The provider's own words for a refused sign-in check, safe to show: credentials removed (the office-wide
 * redaction and the provider token formats it does not cover), on one line, at most 400 characters. Empty when
 * the failure is long enough to be a cut-off fragment, which is not quoted at all.
 */
export function signInFailure(error: unknown): string {
    const text = String(error);
    if (text.length > WHOLE_MESSAGE) return '';
    return redactEvidence(text).replace(/\s+/g, ' ').trim().slice(0, 400);
}
