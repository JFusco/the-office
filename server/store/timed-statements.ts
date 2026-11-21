import type { StatementSync } from 'node:sqlite';
import type { StoreTimings } from './store-timings';

/** The SQL text a statement is timed under: one line, bounded. */
export const statementName = (sql: string) => `sql: ${sql.replace(/\s+/g, ' ').trim().slice(0, 90)}`;

/**
 * The same prepared statements, with each get/all/run timed under its SQL text. `run` also counts the characters of
 * the text it was given to write. Only these three methods are offered, as the statement cache already requires.
 */
export function timedStatements(statement: (sql: string) => StatementSync, timings: StoreTimings): (sql: string) => StatementSync {
    const timed = new Map<string, StatementSync>();
    return sql => {
        let wrapped = timed.get(sql);
        if (!wrapped) {
            const prepared = statement(sql), name = statementName(sql);
            const written = (values: unknown[]) => values.reduce<number>((sum, value) => sum + (typeof value === 'string' ? value.length : 0), 0);
            wrapped = {
                get: (...values: never[]) => timings.time(name, () => prepared.get(...values)),
                all: (...values: never[]) => timings.time(name, () => prepared.all(...values)),
                run: (...values: never[]) => timings.time(name, () => prepared.run(...values), () => written(values)),
            } as unknown as StatementSync;
            timed.set(sql, wrapped);
        }
        return wrapped;
    };
}
