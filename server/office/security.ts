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
const PROVIDER_TOKEN = new RegExp(String.raw`${TOKEN_START}(?:sk-[\w-]+|gh[oprs]_[\w]+)\b`, 'g');
export const BEARER_CREDENTIAL = /(?:Bearer\s+)(?:\\(?:[\s\S]|$)|[^\s"'\\])+/gi;
export const POSTGRES_URL = /postgres(?:ql)?:\/\/(?:\\(?:[\s\S]|$)|[^\s"'\\])+/gi;
export const HEADER_OPERAND = String.raw`(?:\\(?:[\s\S]|$)|[^\n,}"\\])+`;
const HEADER_CREDENTIAL = new RegExp(String.raw`((?:password|api[_-]?key|secret|authorization|cookie|connection[_-]?string)\s*[=:]\s*)("?)${HEADER_OPERAND}`, 'gi');
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
  return value
    // First, so its offset is the original string's: a `b` after an odd run of backslashes in JSON text is the `\b` escape.
    .replace(BEARER_CREDENTIAL, (match: string, at: number) => match[0] === 'b' && escapedAt(value, at) && isJson() ? 'bearer [redacted]' : 'Bearer [redacted]')
    .replace(PROVIDER_TOKEN,'[redacted]')
    .replace(/([?&](?:token|sig|key|secret|code|access_token|client_secret|password)=)(?:\\(?:[\s\S]|$)|[^&\s"'\\])+/gi,'$1[redacted]')
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
