import type { IncidentState } from '../../src/contracts/incidents';
import type { IncidentRow } from './office-client';
import { SUMMARY_LIMIT, type InFlight, type IncidentSummary, type PassRecord } from './runner-state';

/**
 * Which incident the runner works on: one at a time. Pure, over a complete research list. In
 * this phase choosing it is the only stage a pass advances.
 */

/** States with no repair in progress and no settled outcome. A recurred incident keeps its old repair and is selectable. */
export const SELECTABLE: readonly IncidentState[] = ['observed', 'triaged', 'recurred'];

/** Why an incident may not be worked on now, or null when it may. Runner failures are left to the runner's own repair (phase 11). */
export function ineligibility(row: IncidentRow): string | null {
    if (!row.researchEligible) return 'not-research-eligible';
    if (row.source === 'runner') return 'runner-source';
    if (!SELECTABLE.includes(row.state)) return `state:${row.state}`;
    return null;
}

const time = (value: string | null) => value === null ? Infinity : Date.parse(value);

/** Earliest research time first, an incident with none last, then by ID. */
export function researchOrder(a: IncidentRow, b: IncidentRow): number {
    const byTime = time(a.researchAt) - time(b.researchAt);
    if (byTime) return byTime;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export interface Selection {
    inFlight: InFlight | null;
    selected?: NonNullable<PassRecord['selected']>;
    released?: NonNullable<PassRecord['released']>;
}

/**
 * Keeps the incident in flight while it is still eligible, refreshing its revision and state.
 * Otherwise releases it, saying why, and picks at most one eligible incident in research order.
 */
export function selectIncident(rows: readonly IncidentRow[], inFlight: InFlight | null, now: Date): Selection {
    let released: Selection['released'];
    if (inFlight) {
        const row = rows.find(candidate => candidate.id === inFlight.incident), why = row ? ineligibility(row) : 'not-research-eligible';
        if (row && !why) return {
            inFlight: { ...inFlight, revision: row.revision, state: row.state },
            selected: { incident: row.id, revision: row.revision, state: row.state, kept: true },
        };
        released = { incident: inFlight.incident, reason: why! };
    }
    const pick = rows.filter(row => !ineligibility(row)).sort(researchOrder)[0];
    if (!pick) return { inFlight: null, ...(released && { released }) };
    return {
        inFlight: { incident: pick.id, selectedAt: now.toISOString(), revision: pick.revision, state: pick.state },
        selected: { incident: pick.id, revision: pick.revision, state: pick.state, kept: false },
        ...(released && { released }),
    };
}

/** At most 50 summaries in research order, always including the incident in flight. */
export function incidentSummaries(rows: readonly IncidentRow[], inFlight: string | null): IncidentSummary[] {
    const ordered = [...rows].sort(researchOrder), kept = ordered.slice(0, SUMMARY_LIMIT);
    const current = inFlight ? ordered.find(row => row.id === inFlight) : undefined;
    if (current && !kept.includes(current)) kept[SUMMARY_LIMIT - 1] = current;
    return kept.map(row => ({ id: row.id, state: row.state, revision: row.revision, source: row.source, researchAt: row.researchAt, openSubjects: row.openSubjects }));
}
