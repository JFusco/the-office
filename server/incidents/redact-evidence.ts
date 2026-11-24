import { sanitize, TOKEN_START } from '../office/security';

const CREDENTIAL_NAME = '(?:access|refresh|id|auth|bearer|session|api)?[_-]?token|client[_-]?secret|secret|password|passwd|api[_-]?key|private[_-]?key|authorization|cookie';
const ASSIGNMENT = String.raw`(?<![\w-])(?:${CREDENTIAL_NAME})\s*[=:]\s*`;
// The same unescaped quote closes the value. A saved fragment may end mid-value or mid-escape.
const QUOTED_CREDENTIAL = new RegExp(String.raw`(["'](?:${CREDENTIAL_NAME})["']\s*:\s*|${ASSIGNMENT})(["'])(?:(?!\2)[^\\]|\\(?:[\s\S]|$))*(?:\2|$)`, 'gi');
const BARE_CREDENTIAL = new RegExp(String.raw`(${ASSIGNMENT})(?!\[redacted\])[^\s&,;}"']+`, 'gi');
const PROVIDER_TOKEN = new RegExp(String.raw`${TOKEN_START}(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+|xox[abprs]-[A-Za-z0-9-]+)`, 'g');
const AWS_KEY_ID = new RegExp(String.raw`${TOKEN_START}(?:AKIA|ASIA)[A-Z0-9]{16}\b`, 'g');
const JSON_WEB_TOKEN = new RegExp(String.raw`${TOKEN_START}eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`, 'g');

function redactUnquoted(text: string): string {
    return sanitize(text)
        .replace(/((?:https?|socks5?):\/\/)[^\s/@]+@/gi, '$1[redacted]@')
        .replace(BARE_CREDENTIAL, '$1[redacted]')
        .replace(PROVIDER_TOKEN, '[redacted]')
        .replace(AWS_KEY_ID, '[redacted]')
        .replace(JSON_WEB_TOKEN, '[redacted]');
}

/**
 * Removes credentials from text before any of it is kept: the office-wide redaction, and the
 * provider token formats it does not cover (fine-grained GitHub tokens, Slack tokens, AWS key IDs,
 * JSON web tokens, credentials inside a URL), and the value of a credential property in pasted
 * JSON or key-value text, whatever the value looks like.
 */
export function redactEvidence(text: string): string {
    // Hide the quoted syntax from the shared sanitizer so its unquoted rules keep their scope.
    const quoted: string[] = [];
    const masked = text.replaceAll('\0', '\0\0').replace(QUOTED_CREDENTIAL, (_, prefix: string, quote: string) => {
        const index = quoted.length;
        quoted.push(`${prefix}${quote}[redacted]${quote}`);
        return `\0${index}\0`;
    });
    return redactUnquoted(masked).replace(/\0(\d*)\0/g, (_, index: string) => index ? quoted[Number(index)] : '\0');
}
