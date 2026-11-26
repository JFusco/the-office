/** Issue numbers a PR body's closing directives name, in order and with repeats: the monitor's `linkedIssues`. */
export const closingDirectives = (body: unknown): number[] =>
    [...String(body || '').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi)].map(match => Number(match[1]));
