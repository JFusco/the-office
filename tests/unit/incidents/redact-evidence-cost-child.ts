// Run in its own process by redact-evidence-cost.test.ts, so a redaction that never finishes can be killed on a budget.
// Prints one line of JSON: whether the complete output matched, and how long the redaction took.
import { redactEvidence } from '../../../server/incidents/redact-evidence';

const B = '\\';
const MIB = 1 << 20;
const message = (s: string) => JSON.stringify({ m: s });
const wrap = (s: string) => JSON.stringify({ d: s, n: 1 });
const key = 'aToken'.repeat(Math.ceil(MIB / 'aToken'.length));
const pair = (value: string, quoted: string) => `token=${value} token='${quoted}' `;
const repeats = Math.ceil(MIB / pair('x', 'a' + B + "'b").length);

const fixtures: Record<string, [string, string]> = {
    // Every `aToken` is a candidate name; only the last one is closed, so the scan back to its quote runs once.
    'closed-key': [`{"${key}":"fixture"}`, `{"${key}":"[redacted]"}`],
    'cut-key': [`{"${key}`, `{"${key}`],
    // Many bare and single-quoted assignments two levels down: each looks its layer up instead of reading from the start.
    'many-assignments': [wrap(message(pair('x', 'a' + B + "'b").repeat(repeats))), wrap(message(pair('[redacted]', '[redacted]').repeat(repeats)))],
};

const [input, expected] = fixtures[process.argv[2]];
const started = performance.now();
const output = redactEvidence(input);
process.stdout.write(JSON.stringify({ matched: output === expected, ms: Math.round(performance.now() - started), bytes: input.length }));
