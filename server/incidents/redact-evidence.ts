import { AFTER_JSON_ESCAPE, isJsonText, sanitize, TOKEN_START } from '../office/security';

const CREDENTIAL_NAME = '(?:access|refresh|id|auth|bearer|session|api)?[_-]?token|client[_-]?secret|secret|password|passwd|api[_-]?key|private[_-]?key|authorization|cookie';
// The name may end a longer identifier (GITHUB_TOKEN, X-Auth-Token, --token); only a letter or digit before it rules it out.
// It may also follow a JSON escape (\n, \u001b), whose letters stay case-sensitive under the `i` flag.
// So may a terminal colour code (\u001b[33m) right before it.
const NAME_START = String.raw`(?:(?<![A-Za-z0-9])|(?-i:${AFTER_JSON_ESCAPE})|(?<=(?:\\u001b|\x1b)\[[\d;]*m))`;
const ASSIGNMENT = String.raw`${NAME_START}(?:${CREDENTIAL_NAME})\s*[=:]\s*`;
// A property name starts right after its quote, and an escaped one takes a value escaped as deeply.
const PROPERTY = String.raw`${NAME_START}(?=${CREDENTIAL_NAME})(?<=["'][\w-]{0,64})(?:${CREDENTIAL_NAME})(?<nameRun>\\*)["']\s*:\s*(?=\k<nameRun>["'])`;
// A quote escaped n times (n = 0, 1, 3, 7… in JSON inside JSON) is closed by the same quote after
// n + k·2(n + 1) backslashes, which for an unescaped quote is any even run. A run that is not n modulo n + 1
// belongs to an enclosing string, so the value ends before it. A saved fragment may end mid-value or mid-escape.
const OPEN = String.raw`(?<open>(?<run>(?:\\(?:\\\\)*)?)(?<quote>["']))`;
const AFTER_LABEL = String.raw`(?<=(?:${CREDENTIAL_NAME})(?:\\*["'])?\s*[=:]\s*)`;
const quotedCredential = (json: boolean) => {
    // A quote right after another credential label opens that label's value, so it does not end this one.
    // In JSON text an unescaped quote is certain, so only an escaped one is checked.
    const notLabel = json ? String.raw`(?:(?!\\)|(?!${AFTER_LABEL}))` : String.raw`(?!${AFTER_LABEL})`;
    const close = String.raw`(?<!\\)${notLabel}(?:\k<run>\k<run>\\\\)*\k<run>\k<quote>`;
    // In JSON text an unescaped double quote also ends a single-quoted value: it closes the string that holds it.
    const enclosing = String.raw`(?<!\\)${notLabel}(?:\k<run>\\)*(?!\k<run>)\\*\k<quote>${json ? String.raw`|(?<!\\)(?:\\\\)*"` : ''}`;
    return new RegExp(String.raw`(?<prefix>${PROPERTY}|${ASSIGNMENT})${OPEN}(?:[^\\"']+|(?!${close}|${enclosing})[\s\S])*(?:${close}|(?=${enclosing})|$)`, 'gi');
};
const QUOTED_CREDENTIAL = quotedCredential(false);
const QUOTED_CREDENTIAL_IN_JSON = quotedCredential(true);
// A bare value in JSON text ends at a control-character escape (\n, \u001b) or before the backslashes of an escaped
// quote at any depth. It may start with a control escape, and an escaped backslash or other \u escape stays in it.
// Keep the class first inside `(?-i:…)`: V8 13.6 drops the modifier for a class in a later alternative.
const CONTROL_ESCAPE = String.raw`\\(?-i:[bfnrt]|u00[01][\dA-Fa-f]|u007[fF])`;
const BARE_UNIT = String.raw`(?:[^\s&,;}"'\\\0]+|(?!(?<!\\)(?:\\\\)*\\")(?:\\\\|(?!${CONTROL_ESCAPE})\\))`;
const BARE_VALUE = String.raw`(?:${CONTROL_ESCAPE})*${BARE_UNIT}+`;
// After whitespace or an escape, another credential label is the next assignment, not this one's value.
const BARE_CREDENTIAL = new RegExp(String.raw`(${ASSIGNMENT})(?!\[redacted\]|(?:(?<=\s)|${CONTROL_ESCAPE})(?:${CONTROL_ESCAPE})*(?:[\w-]*[_-])?(?:${CREDENTIAL_NAME})\s*[=:])${BARE_VALUE}`, 'gi');
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
 * JSON (JSON inside JSON too) or key-value text, whatever the value looks like.
 */
export function redactEvidence(text: string): string {
    try {
        return redactCredentials(text);
    } catch (error) {
        // A value too large for the regex stack keeps nothing rather than throwing past the caller.
        if (error instanceof RangeError) return '[redacted]';
        throw error;
    }
}

function redactCredentials(text: string): string {
    // Hide the quoted syntax from the shared sanitizer so its unquoted rules keep their scope.
    const quoted: string[] = [];
    const json = isJsonText(text);
    const masked = text.replaceAll('\0', '\0\0').replace(json ? QUOTED_CREDENTIAL_IN_JSON : QUOTED_CREDENTIAL, (...match) => {
        const { prefix, open, nameRun } = match[match.length - 1] as { prefix: string; open: string; nameRun?: string };
        const index = quoted.length;
        // In JSON text a bare label lies inside a string, so a plain double quote right after it closes that string.
        // Only the label is hidden, so the shared sanitizer leaves it alone too.
        if (nameRun === undefined && open === '"' && json) {
            quoted.push(prefix);
            return `\0${index}\0${(match[0] as string).slice(prefix.length)}`;
        }
        quoted.push(`${prefix}${open}[redacted]${open}`);
        return `\0${index}\0`;
    });
    return redactUnquoted(masked).replace(/\0(\d*)\0/g, (_, index: string) => index ? quoted[Number(index)] : '\0');
}
