import { isJsonText, sanitizeInMode, TOKEN_START } from '../office/security';
import { credentialSpans } from './credential-spans';
import { BARE_CREDENTIAL, URL_USERINFO } from './credential-patterns';
import { JsonLayers } from './json-layers';

const PROVIDER_TOKEN = new RegExp(String.raw`${TOKEN_START}(?:github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9]+|xox[abprs]-[A-Za-z0-9-]+)`, 'g');
const AWS_KEY_ID = new RegExp(String.raw`${TOKEN_START}(?:AKIA|ASIA)[A-Z0-9]{16}\b`, 'g');
const JSON_WEB_TOKEN = new RegExp(String.raw`${TOKEN_START}eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`, 'g');

function redactUnquoted(text: string, json: boolean): string {
    return sanitizeInMode(text, json)
        .replace(URL_USERINFO, '$1[redacted]@')
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

/**
 * Every edit whose extent depends on the JSON strings of the text is chosen on the original text, against one map of
 * its layers, and the text is rendered once: each chosen span becomes a placeholder the shared sanitizer leaves alone,
 * and every other character is kept (a NUL doubled). The rules that do not depend on layers then run on the rendered
 * text, with the original text's JSON mode, and the placeholders are put back.
 */
function redactCredentials(text: string): string {
    const json = isJsonText(text);
    const kept: string[] = [];
    const parts: string[] = [];
    let at = 0;
    for (const span of credentialSpans(text, new JsonLayers(text), json)) {
        parts.push(text.slice(at, span.start).replaceAll('\0', '\0\0'), `\0${kept.length}\0`);
        kept.push(span.replacement);
        at = span.end;
    }
    parts.push(text.slice(at).replaceAll('\0', '\0\0'));
    return redactUnquoted(parts.join(''), json).replace(/\0(\d*)\0/g, (_, index: string) => index ? kept[Number(index)] : '\0');
}
