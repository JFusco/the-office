import { DEPARTMENTS, OWNER, type EmployeeId, type Persona } from '../contracts/people';
/** One org-chart node. `stack` lays the reports out vertically when none of them manage anyone,
    so a growing team gets taller rather than wider. */
export interface OrgNode {
    id: EmployeeId | typeof OWNER.id;
    persona?: Persona;
    reports: OrgNode[];
    stack: boolean;
}
export interface OrgTree { root: OrgNode; problems: string[] }
const byDepartmentThenName = (a: Persona, b: Persona) => DEPARTMENTS[a.department].order - DEPARTMENTS[b.department].order || a.name.localeCompare(b.name);
/** Builds the reporting tree under the owner. Bad data is reported in `problems`, never thrown:
    unknown managers, cycles and anyone unreachable from the owner are listed and left out. */
export function buildOrgTree(personas: readonly Persona[]): OrgTree {
    const problems: string[] = [];
    const ids = new Set(personas.map(persona => persona.id));
    const reportsOf = new Map<string, Persona[]>();
    for (const persona of personas) {
        if (persona.reportsTo === persona.id) { problems.push(`${persona.name} reports to themself.`); continue; }
        if (persona.reportsTo !== OWNER.id && !ids.has(persona.reportsTo)) { problems.push(`${persona.name} reports to an unknown manager (${persona.reportsTo}).`); continue; }
        reportsOf.set(persona.reportsTo, [...reportsOf.get(persona.reportsTo) ?? [], persona]);
    }
    const placed = new Set<string>();
    const node = (id: OrgNode['id'], persona?: Persona): OrgNode => {
        placed.add(id);
        const reports = (reportsOf.get(id) ?? []).filter(report => !placed.has(report.id)).sort(byDepartmentThenName).map(report => node(report.id, report));
        return { id, persona, reports, stack: reports.length > 0 && reports.every(report => report.reports.length === 0) };
    };
    const root = node(OWNER.id);
    const unplaced = personas.filter(persona => !placed.has(persona.id) && (persona.reportsTo === OWNER.id || ids.has(persona.reportsTo)) && persona.reportsTo !== persona.id);
    if (unplaced.length) problems.push(`Not connected to the owner (reporting cycle): ${unplaced.map(persona => persona.name).join(', ')}.`);
    return { root, problems };
}
