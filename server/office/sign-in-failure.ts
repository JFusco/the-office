import { redactEvidence } from '../incidents/redact-evidence';

export const MAX_SIGN_IN_DIAGNOSTIC_LENGTH = 1500;

/**
 * Redact the complete provider diagnostic before shortening it for display.
 * Empty or oversized diagnostics are omitted.
 */
export function signInFailure(text = ''): string {
    if (text.length > MAX_SIGN_IN_DIAGNOSTIC_LENGTH) return '';
    return redactEvidence(text).replace(/\s+/g, ' ').trim().slice(0, 400);
}
