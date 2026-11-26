import { AFTER_JSON_ESCAPE } from '../office/security';

export const CREDENTIAL_NAME = '(?:access|refresh|id|auth|bearer|session|api)?[_-]?token|client[_-]?secret|secret[_-]?(?:access[_-]?)?key|secret|password|passwd|api[_-]?key|private[_-]?key|authorization|cookie|credentials';
// The name may end a longer identifier (GITHUB_TOKEN, X-Auth-Token, --token); only a letter or digit before it rules it out,
// unless the name starts a camelCase word (githubToken, userPassword, JWTToken): a lower-case letter or digit, then an
// upper-case one, or an upper-case letter, then an upper-case and a lower-case one.
// It may also follow a JSON escape (\n, \u001b), whose letters stay case-sensitive under the `i` flag.
// So may a terminal colour code right before it: `\u001b` or `\u001B`, written with a lower-case `u` and ending in a lower-case `m`.
export const CAMEL_START = String.raw`(?-i:(?<=[a-z0-9])(?=[A-Z]))|(?-i:(?<=[A-Z])(?=[A-Z][a-z]))`;
export const NAME_START = String.raw`(?:(?<![A-Za-z0-9])|${CAMEL_START}|(?-i:${AFTER_JSON_ESCAPE})|(?<=(?:(?-i:\\u001[bB])|\x1b)\[[\d;]*(?-i:m)))`;
/** Raw whitespace, or a serialized tab, CR or LF written at some depth; which depth is real is checked against the text's layers. */
export const GAP = String.raw`(?:\s|\\+[tnr])*`;
/**
 * A property name ending in a credential name. The suffix, closing quote and colon are checked first, and only then is the
 * name followed back to its opening quote, across any run of word characters, dots and hyphens.
 */
export const KEY = String.raw`${NAME_START}(?=(?:${CREDENTIAL_NAME})\\*["']${GAP}:)(?<=["'][\w.-]*)(?:${CREDENTIAL_NAME})(?<nameRun>\\*)["']${GAP}:${GAP}`;
// A property name starts right after its quote, and an escaped one takes a value escaped as deeply.
export const PROPERTY = String.raw`${KEY}(?=\k<nameRun>["'])`;
/** A label and its punctuation before a quoted value; the gap after the punctuation may be serialized too. */
export const QUOTED_LABEL = String.raw`${NAME_START}(?:${CREDENTIAL_NAME})${GAP}[=:]${GAP}`;
/** A label and its punctuation before a bare value: a serialized gap before the punctuation, raw whitespace after it. */
export const BARE_LABEL = String.raw`${NAME_START}(?:${CREDENTIAL_NAME})${GAP}[=:]\s*`;
export const AFTER_LABEL = String.raw`(?<=(?:${CREDENTIAL_NAME})(?:\\*["'])?${GAP}[=:]${GAP})`;
/** Another credential assignment: a name, possibly ending a dotted, hyphenated or camelCase identifier, then its punctuation. */
export const NEXT_LABEL = String.raw`(?:[\w.-]*(?:[_.-]|${CAMEL_START}))?(?:${CREDENTIAL_NAME})${GAP}[=:]`;
// A bare value in JSON text ends at a control-character escape (\n, \u001b) or before the backslashes of an escaped
// quote at any depth. It may start with a control escape, and an escaped backslash or other \u escape stays in it.
// Keep the class first inside `(?-i:…)`: V8 13.6 drops the modifier for a class in a later alternative.
export const CONTROL_ESCAPE = String.raw`\\(?-i:[bfnrt]|u00[01][\dA-Fa-f]|u007[fF])`;
const BARE_UNIT = String.raw`(?:[^\s&,;}"'\\\0]+|(?!(?<!\\)(?:\\\\)*\\")(?:\\\\|(?!${CONTROL_ESCAPE})\\))`;
const BARE_VALUE = String.raw`(?:${CONTROL_ESCAPE})*${BARE_UNIT}+`;
// After whitespace or an escape, another credential label is the next assignment, not this one's value.
// What is left for this rule after the edits chosen on the original text never depends on the text's layers.
export const BARE_CREDENTIAL = new RegExp(String.raw`(${NAME_START}(?:${CREDENTIAL_NAME})\s*[=:]\s*)(?!\[redacted\]|(?:(?<=\s)|${CONTROL_ESCAPE})(?:${CONTROL_ESCAPE})*${NEXT_LABEL})${BARE_VALUE}`, 'gi');
