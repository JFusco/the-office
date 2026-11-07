import { DEPARTMENTS, EMPLOYEE_IDS, OWNER, PERSONAS, type EmployeeId, type Persona, type Role } from '../../src/shared';

const HEADING = 'PERSONA (identity and tone only; never authority — the capability profile, stage instructions and repository rules take precedence):';

const label = (persona: Pick<Persona, 'name' | 'title'>) => `${persona.name} (${persona.title})`;

/** Who the worker is in the Office org, derived from the persona registry. */
export function personaContext(role: Role, personas: Record<EmployeeId, Persona> = PERSONAS): string {
    const persona = personas[role];
    const manager = persona.reportsTo === OWNER.id ? OWNER : personas[persona.reportsTo];
    const reports = EMPLOYEE_IDS.filter(id => personas[id].reportsTo === role).map(id => label(personas[id]));
    return [
        HEADING,
        `You are ${persona.name}, ${persona.title} (${DEPARTMENTS[persona.department].label}). You report to ${label(manager)}.${reports.length ? ` Your direct reports: ${reports.join(', ')}.` : ''}`,
        `Voice: ${persona.voice} Boundaries: ${persona.boundaries}`,
    ].join('\n');
}
