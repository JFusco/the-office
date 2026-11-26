import type { RunnerPaths } from './config';
import { readLauncherState } from './launcher-state';

/**
 * How long this pass may take, from the deadline the launcher registered for its helper before
 * authorizing it (state/launcher.json), so the launcher's own startup counts against it. A pass
 * the launcher did not start takes `manualMs`. A launched pass whose deadline cannot be read has
 * none: it reports nothing extra and says why.
 */
export function passAllowance(paths: RunnerPaths, { launched, parent, now, manualMs }: { launched: boolean; parent: number; now: Date; manualMs: number }): { ms: number } | { unknown: string } {
    if (!launched) return { ms: manualMs };
    const read = readLauncherState(paths);
    if (!('state' in read)) return { unknown: 'absent' in read ? `${paths.launcherState} is absent` : `${paths.launcherState} cannot be read (${read.unreadable})` };
    const current = read.state.current;
    if (current?.phase !== 'registered' || current.pid !== parent) return { unknown: `${paths.launcherState} does not register this pass's helper` };
    return { ms: Math.max(0, Date.parse(current.deadline) - now.getTime()) };
}

export type Phase = 'forward' | 'observe' | 'report';

/**
 * The pass's time, split once on the monotonic clock. The last `finalizeMs` is kept for saving its
 * records. Of the rest, forwarding gets at most the first quarter (and never more than
 * `forwardMaxMs`), observation ends by three quarters, and the halt report has what remains. A
 * phase that ends early hands its time to the next at once; no request starts in a phase that is spent.
 */
export function passBudget(allowanceMs: number, { monotonic, finalizeMs, forwardMaxMs }: { monotonic: () => number; finalizeMs: number; forwardMaxMs: number }) {
    const start = monotonic(), usable = Math.max(0, allowanceMs - finalizeMs);
    const ends: Record<Phase, number> = { forward: start + Math.min(usable / 4, forwardMaxMs), observe: start + usable * 3 / 4, report: start + usable };
    let phase: Phase = 'forward';
    return {
        enter(next: Phase) { phase = next; },
        remaining: () => Math.max(0, ends[phase] - monotonic()),
    };
}
export type PassBudget = ReturnType<typeof passBudget>;
