/** A proportional bar drawn with SVG geometry (no inline styles). Decorative: the value is in the adjacent cell. */
export function CostBar({ value, max }: { value: number; max: number }) {
  const width = max > 0 ? Math.max(value > 0 ? 1 : 0, Math.round(value / max * 100)) : 0;
  return <svg className="block h-2 w-full min-w-16" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
    <rect width="100" height="8" rx="2" className="fill-telemetry-track" />
    <rect width={width} height="8" rx="2" className="fill-telemetry-bar" />
  </svg>;
}
