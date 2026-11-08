import type { TelemetryRow } from '../contracts/telemetry';
import { durationLabel } from '../timing/timing';
import { cx, linkClass } from '../ui';
import { CostBar } from './CostBars';
import { coverage, pricedLabel } from './format';

const cell = 'border-b border-telemetry-row px-2 py-2 text-left align-middle';

/** Native table with a caption and scoped headers; rows can be selected to drill in. */
export function BreakdownTable({ caption, rows, limit = 12, onSelect }: { caption: string; rows: TelemetryRow[]; limit?: number; onSelect?: (row: TelemetryRow) => void }) {
  if (!rows.length) return null;
  const max = Math.max(...rows.map(row => row.microUsd)), shown = rows.slice(0, limit);
  return <table className="mt-5 w-full border-collapse text-12">
    <caption className="pb-1 text-left text-13 font-semibold">{caption}</caption>
    <thead><tr className="text-11 text-muted">
      <th scope="col" className={cell}>Name</th><th scope="col" className={cx(cell, 'text-right')}>Runs</th>
      <th scope="col" className={cx(cell, 'text-right')}>Model time</th><th scope="col" className={cx(cell, 'text-right')}>Est. cost</th>
      <th scope="col" className={cx(cell, 'w-1/4')}><span className="sr-only">Share of cost</span></th><th scope="col" className={cell}>Coverage</th>
    </tr></thead>
    <tbody>{shown.map(row => <tr key={row.id}>
      <th scope="row" className={cx(cell, 'font-normal')}>{onSelect ? <button type="button" className={linkClass} onClick={() => onSelect(row)}>{row.label}</button> : row.label}</th>
      <td className={cx(cell, 'text-right tabular-nums')}>{row.runs}</td>
      <td className={cx(cell, 'text-right tabular-nums')}>{durationLabel(row.modelMs)}</td>
      <td className={cx(cell, 'text-right tabular-nums')}>{pricedLabel(row)}</td>
      <td className={cell}><CostBar value={row.microUsd} max={max} /></td>
      <td className={cx(cell, 'text-11 text-muted')}>{coverage(row.partialRuns, row.unpricedRuns) || 'Priced'}</td>
    </tr>)}</tbody>
    {rows.length > limit ? <tfoot><tr><td colSpan={6} className="pt-1.5 text-11 text-muted">{rows.length - limit} more not shown</td></tr></tfoot> : null}
  </table>;
}
