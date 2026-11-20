import { sanitize } from '../office/security';

/**
 * Removes credentials from text before any of it is kept: the office-wide redaction, and the
 * provider token formats it does not cover (fine-grained GitHub tokens, Slack tokens, AWS key IDs,
 * JSON web tokens, credentials inside a URL).
 */
export function redactEvidence(text: string): string {
    return sanitize(text)
        .replace(/((?:https?|socks5?):\/\/)[^\s/@]+@/gi, '$1[redacted]@')
        .replace(/\b(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+|xox[abprs]-[A-Za-z0-9-]+)/g, '[redacted]')
        .replace(/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, '[redacted]')
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted]');
}
