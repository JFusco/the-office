export function isJsonText(text: string): boolean {
  try { JSON.parse(text); return true; } catch { return false; }
}
/** True when an odd run of backslashes ends just before `at`, so the character there is escaped. */
function escapedAt(text: string, at: number): boolean {
  let count = 0;
  while (at - count > 0 && text[at - count - 1] === '\\') count++;
  return count % 2 === 1;
}
/**
 * A lookbehind that passes right after a JSON escape (`\n`, `\u001b`): in JSON text the escape's last letter or digit
 * is not part of the word that follows. The spelling counts even after a literal backslash or for a `\u` escape of a
 * word character, so a token there is redacted too.
 */
export const AFTER_JSON_ESCAPE = String.raw`(?<=\\[bfnrt]|\\u[\dA-Fa-f]{4})`;
/** Where a provider token can start: not inside a word, or right after a JSON escape. Use it in place of a leading `\b`. */
export const TOKEN_START = String.raw`(?:(?<!\w)|${AFTER_JSON_ESCAPE})`;
// A whole GitHub token, including a stateless installation token's dotted segments, and a fine-grained PAT.
const PROVIDER_TOKEN = new RegExp(String.raw`${TOKEN_START}(?:sk-[\w-]+|gh[oprsu]_\w+(?:[.-][\w-]+)*|github_pat_\w+)\b`, 'g');
/** A signed JWT, such as the App's own signing JWT: three base64url segments, the first two JSON objects. */
const SIGNED_JWT = new RegExp(String.raw`${TOKEN_START}eyJ[\w-]+\.eyJ[\w-]+\.[\w-]+`, 'g');
/**
 * A PEM private key, multiline or serialized with `\n` escapes, through its END line. An unterminated block stops
 * before an unescaped quote, so JSON text holding it stays JSON.
 */
const PEM_KEY = /-----BEGIN [A-Z ]*PRIVATE KEY-----(?:(?!-----END)(?:[^"\\]|\\[\s\S]))*(?:-----END [A-Z ]*PRIVATE KEY-----)?/g;
export const BEARER_CREDENTIAL = /(?:Bearer\s+)(?:\\(?:[\s\S]|$)|[^\s"'\\])+/gi;
export const POSTGRES_URL = /postgres(?:ql)?:\/\/(?:\\(?:[\s\S]|$)|[^\s"'\\])+/gi;
export const QUERY_PREFIX = String.raw`[?&](?:token|sig|key|secret|code|access_token|client_secret|password)=`;
const QUERY_CREDENTIAL = new RegExp(String.raw`(${QUERY_PREFIX})(?:\\(?:[\s\S]|$)|[^&\s"'\\])+`, 'gi');
export const HEADER_PREFIX = String.raw`(?:password|api[_-]?key|secret|authorization|cookie|connection[_-]?string)\s*[=:]\s*`;
export const HEADER_OPERAND = String.raw`(?:\\(?:[\s\S]|$)|[^\n,}"\\])+`;
const HEADER_CREDENTIAL = new RegExp(String.raw`(${HEADER_PREFIX})("?)${HEADER_OPERAND}`, 'gi');
/**
 * Redacts credentials in a string. A value never ends inside an escape (`\` takes the next character with it)
 * or takes an unescaped `"`, so JSON text stored in the string stays JSON. Whether the whole string is JSON
 * text is checked once, only when a quote or a `\b` escape is ambiguous.
 */
export function sanitize(value: string): string {
  let json: boolean | undefined;
  return sharedRedaction(value, () => json ??= isJsonText(value));
}
/**
 * The same redaction for a caller that already knows whether the text it came from is JSON text: a string that holds
 * placeholders in place of some of that text no longer parses, so its JSON mode cannot be read from it.
 */
export function sanitizeInMode(value: string, json: boolean): string {
  return sharedRedaction(value, () => json);
}
function sharedRedaction(value: string, isJson: () => boolean): string {
  // A key block first: nothing inside it is offered to the patterns below.
  const keyless = value.replace(PEM_KEY, '[private key redacted]');
  return keyless
    // Next, so its offset is the original string's: a `b` after an odd run of backslashes in JSON text is the `\b` escape.
    .replace(BEARER_CREDENTIAL, (match: string, at: number) => match[0] === 'b' && escapedAt(keyless, at) && isJson() ? 'bearer [redacted]' : 'Bearer [redacted]')
    .replace(SIGNED_JWT,'[redacted]')
    .replace(PROVIDER_TOKEN,'[redacted]')
    .replace(QUERY_CREDENTIAL,'$1[redacted]')
    // In JSON text a label lies inside a string, so a quote right after it closes that string and is kept as it is.
    .replace(HEADER_CREDENTIAL,
      (match: string, label: string, quote: string) => quote && isJson() ? match : `${label}${quote}[redacted]`)
    .replace(POSTGRES_URL,'[database redacted]');
}
/** The JSON text of a value with every string in it redacted: what `sanitizeObject` parses, for a caller that only needs the text. */
export function redactedText(value: unknown): string {
  return JSON.stringify(value,(_key,item)=>typeof item==='string'?sanitize(item):item);
}
export function sanitizeObject<T>(value:T):T {
  return JSON.parse(redactedText(value));
}
export function safeOrigin(request: Request): boolean {
  const url = new URL(request.url);
  if (!['127.0.0.1','localhost'].includes(url.hostname)) return false;
  const origin = request.headers.get('origin');
  return !origin || origin === url.origin;
}
export function safeWebUrl(value: string): boolean {
  try { const u=new URL(value); return u.protocol==='https:' || (u.protocol==='http:' && ['127.0.0.1','localhost'].includes(u.hostname)); } catch { return false; }
}
