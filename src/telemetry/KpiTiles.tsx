import type { TelemetryReport } from '../contracts/telemetry';
import { durationLabel } from '../timing/timing';
import { coverage, tokens, usd } from './format';

const tile = 'rounded-9 border border-telemetry-tile-line bg-telemetry-tile p-3.5';

export function KpiTiles({ totals }: { totals: TelemetryReport['totals'] }) {
  const gaps = coverage(totals.partialRuns, totals.unpricedRuns);
  const items: [string, string, string][] = [
    ['Est. cost', totals.microUsd === 0 && (totals.partialRuns || totals.unpricedRuns) ? 'Not priced' : usd(totals.microUsd), gaps ? `Subtotal · ${gaps}` : totals.runs ? 'All runs priced' : 'No finished runs'],
    ['Model time', durationLabel(totals.modelMs), 'Summed per run, not overlap-adjusted'],
    ['Runs', String(totals.runs), totals.inProgressRuns ? `${totals.inProgressRuns} in progress` : `${totals.completeRuns} fully priced`],
    ['Tokens', tokens(totals.tokens.uncachedInput + totals.tokens.cacheRead + totals.tokens.cacheWrite + totals.tokens.output), `${tokens(totals.tokens.cacheRead)} cache read · ${tokens(totals.tokens.output)} out`],
  ];
  return <dl className="grid grid-cols-4 gap-3 max-tablet:grid-cols-2" aria-label="Telemetry totals">
    {items.map(([label, value, detail]) => <div key={label} className={tile}>
      <dt className="text-11 text-muted">{label}</dt>
      <dd className="mt-1 text-21 font-semibold tabular-nums">{value}</dd>
      <dd className="mt-1 text-11 leading-body text-muted">{detail}</dd>
    </div>)}
  </dl>;
}
