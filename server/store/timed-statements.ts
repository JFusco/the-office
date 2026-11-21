import type { DatabaseSync, StatementSync } from 'node:sqlite';
import type { StoreTimings } from './store-timings';

const NAMED = new Map<string, string>();
/**
 * The name a statement is timed under: its SQL on one bounded line, with every quoted text and number replaced
 * by `?`. SQL that was built from values therefore shares one name with its other values, and no value is shown.
 */
export function statementName(kind: 'sql' | 'exec', sql: string): string {
    const key = `${kind}\n${sql}`;
    let name = NAMED.get(key);
    if (!name) {
        name = `${kind}: ${sql.replace(/'(?:[^']|'')*'/g, '?').replace(/\b\d+\b/g, '?').replace(/\s+/g, ' ').trim().slice(0, 90)}`;
        if (NAMED.size >= 1000) NAMED.clear();
        NAMED.set(key, name);
    }
    return name;
}

const text = (values: unknown[]) => values.reduce<number>((sum, value) => sum + (typeof value === 'string' ? value.length : 0), 0);
const rowText = (row: unknown) => row && typeof row === 'object' ? text(Object.values(row)) : 0;

function timed(statement: StatementSync, name: string, timings: StoreTimings): StatementSync {
    const calls: Partial<Record<'get' | 'all' | 'run', unknown>> = {};
    return new Proxy(statement, {
        get(target, property) {
            if (property === 'get')
                return calls.get ??= (...values: never[]) => timings.time(name, () => target.get(...values), rowText);
            if (property === 'all')
                return calls.all ??= (...values: never[]) => timings.time(name, () => target.all(...values), rows => rows.reduce<number>((sum, row) => sum + rowText(row), 0));
            if (property === 'run')
                return calls.run ??= (...values: never[]) => timings.time(name, () => target.run(...values), () => text(values));
            // Everything else is the statement's own, called on the statement itself. iterate() is not timed.
            const value = Reflect.get(target, property, target);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });
}

/**
 * Times every statement this connection runs from now on, whoever prepares it: each get/all/run under its SQL
 * name with the characters of text it wrote or read, and each exec (BEGIN, COMMIT, PRAGMA) under its own.
 * What a statement does and returns is unchanged.
 */
export function timeStatements(db: DatabaseSync, timings: StoreTimings): void {
    const prepare = db.prepare.bind(db), exec = db.exec.bind(db);
    db.prepare = ((sql: string, ...rest: never[]) => timed(prepare(sql, ...rest), statementName('sql', sql), timings)) as typeof db.prepare;
    db.exec = (sql: string) => timings.time(statementName('exec', sql), () => exec(sql));
}
