import { DEPARTMENTS, OWNER, PERSONAS, type Department, type EmployeeId, type ManagerId } from '../contracts/people';
import type { Activity, OfficeSnapshot, Role } from '../shared';
export interface DirectoryRow {
    id: EmployeeId;
    name: string;
    title: string;
    department: Department;
    managerId: ManagerId;
    managerName: string;
    directReports: number;
    activity: Activity;
    task: string;
    runtime: string;
}
export interface DirectoryGroup { department: Department; label: string; rows: DirectoryRow[] }
type People = Pick<OfficeSnapshot, 'agents'>;
export function hasDesk(id: EmployeeId, snapshot: People): boolean {
    return snapshot.agents.some(agent => agent.id === id);
}
/** The name shown for an employee: the live agent's name (which carries the cast easter egg), then `names`. */
export function personName(id: ManagerId, snapshot: People, names: Record<Role, string>): string {
    return id === OWNER.id ? OWNER.name : snapshot.agents.find(agent => agent.id === id)?.name || names[id];
}
function runtime(agent: OfficeSnapshot['agents'][number] | undefined): string {
    if (!agent?.provider) return '';
    const provider = agent.provider === 'claude' ? 'Claude' : 'Codex';
    return agent.model ? `${provider} · ${agent.model}` : provider;
}
/** Directory rows from the persona registry, merged with live agent state. */
export function directoryRows(snapshot: People, names: Record<Role, string>): DirectoryRow[] {
    const personas = Object.values(PERSONAS);
    return personas.map(persona => {
        const agent = snapshot.agents.find(candidate => candidate.id === persona.id);
        return {
            id: persona.id, name: personName(persona.id, snapshot, names), title: persona.title, department: persona.department,
            managerId: persona.reportsTo, managerName: personName(persona.reportsTo, snapshot, names),
            directReports: personas.filter(report => report.reportsTo === persona.id).length,
            activity: agent?.activity ?? 'disconnected', task: agent?.task ?? '', runtime: runtime(agent),
        };
    });
}
/** Case-insensitive match on name, title or department label. */
export function matchesQuery(row: DirectoryRow, query: string): boolean {
    const needle = query.trim().toLowerCase();
    return !needle || [row.name, row.title, DEPARTMENTS[row.department].label].some(text => text.toLowerCase().includes(needle));
}
/** Rows filtered by the query and grouped by department in department order; empty groups are dropped. */
export function directoryGroups(rows: readonly DirectoryRow[], query = ''): DirectoryGroup[] {
    return (Object.keys(DEPARTMENTS) as Department[])
        .sort((a, b) => DEPARTMENTS[a].order - DEPARTMENTS[b].order)
        .map(department => ({ department, label: DEPARTMENTS[department].label, rows: rows.filter(row => row.department === department && matchesQuery(row, query)).sort((a, b) => a.name.localeCompare(b.name)) }))
        .filter(group => group.rows.length > 0);
}
