import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LessonEvidence } from '../../src/shared';
import type { RetrospectiveSubject } from './retrospective-subject';

/** The section's own budget, catalog entries included; the generic sections keep the packet under PACKET_LIMIT. */
export const MAINTENANCE_LIMIT = 8000, ARTIFACT_LIMIT = 20, LEDGER_STEPS = 4;
const LEDGER = 1000, TEXT = 1000, SHORT = 120;
const clip = (text: string, limit: number) => text.length <= limit ? text : `${text.slice(0, limit)}…`;

/** Entry names in natural order (`2-…` before `10-…`), newest kept. Names only: Harper reads a file by absolute path when a lesson needs it. */
export function maintenanceArtifacts(root: string): string[] {
    try { return existsSync(root) ? readdirSync(root).sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).slice(-ARTIFACT_LIMIT) : []; }
    catch { return []; }
}

export interface MaintenancePacketSection {
    weekly: boolean;
    error: string;
    artifactsRoot: string;
    /** Catalogued files Harper may cite by ref; the path is harness-known, never model-supplied. */
    artifacts: { ref: string; name: string }[];
    /** Ledger excerpts only for the last few steps: each ledger is cumulative, so the latest carries the history. */
    steps: { index: number; role: string; at: string; ledger: string; candidates: number; checks: number }[];
    omitted: { ledgers: number; artifacts: number };
}

/** The maintenance section of a retrospective packet, registering artifact evidence in the catalog. Lists the run's artifact folder; reads no file contents. */
export function maintenanceFacts(job: RetrospectiveSubject, catalog: Record<string, LessonEvidence>, listArtifacts = maintenanceArtifacts): MaintenancePacketSection | undefined {
    const facts = job.maintenance;
    if (!facts) return undefined;
    const artifacts = listArtifacts(facts.artifactsRoot).map(name => {
        const ref = `artifact:${job.id}:${name}`;
        catalog[ref] = { kind: 'artifact', ref, url: '', detail: clip(resolve(facts.artifactsRoot, name), 300) };
        return { ref, name: clip(name, SHORT) };
    });
    const first = Math.max(0, facts.steps.length - LEDGER_STEPS);
    const section: MaintenancePacketSection = { weekly: facts.weekly, error: clip(facts.error, TEXT), artifactsRoot: facts.artifactsRoot, artifacts,
        steps: facts.steps.map((step, index) => ({ index, role: step.role, at: step.at, ledger: index >= first ? clip(step.ledger, LEDGER) : '', candidates: step.candidates, checks: step.checks })), omitted: { ledgers: 0, artifacts: 0 } };
    const size = () => JSON.stringify(section).length + section.artifacts.reduce((total, artifact) => total + JSON.stringify(catalog[artifact.ref]).length + artifact.ref.length + 4, 0);
    // Artifact names are only pointers, so they go first, oldest first; then the oldest ledgers (the latest carries the history).
    while (size() > MAINTENANCE_LIMIT && section.artifacts.length) {
        delete catalog[section.artifacts.shift()!.ref];
        section.omitted.artifacts++;
    }
    for (const step of section.steps) {
        if (size() <= MAINTENANCE_LIMIT) break;
        if (step.ledger) { step.ledger = ''; section.omitted.ledgers++; }
    }
    return section;
}
