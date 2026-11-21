import { createHash } from 'node:crypto';
import type { DatabaseSync, SQLInputValue, SQLTagStore, StatementSync } from 'node:sqlite';
import type { StoreTimings } from './store-timings';

const NAMED = new Map<string, string>();
const MAX_SQL_NAME_LENGTH = 90;
const DIGITS = /\d(?:_?\d)*/.source;
// Consume comments, values and identifiers as whole tokens so their contents cannot start another match.
const SQL_TOKEN = new RegExp([
    /(--[^\n]*|\/\*[\s\S]*?(?:\*\/|$))/.source,
    `(${[
        /x?'(?:[^']|'')*(?:'|$)/.source,
        /"(?:[^"]|"")*(?:"|$)/.source,
        /`(?:[^`]|``)*(?:`|$)|\[[^\]]*(?:\]|$)/.source,
        /0x[\da-f](?:_?[\da-f])*/.source,
        `(?:${DIGITS}(?:\\.(?:${DIGITS})?)?|\\.${DIGITS})(?:e[+-]?${DIGITS})?`,
    ].join('|')})`,
    /[a-z_$\u0080-\uffff][\w$\u0080-\uffff]*|[?:@]\d+/.source,
].join('|'), 'gi');

/**
 * The name a statement is timed under: its SQL on one bounded line, with every quoted text and number replaced
 * by `?`. SQL that was built from values therefore shares one name with its other values, and no value is shown.
 */
export function statementName(kind: 'sql' | 'exec', sql: string): string {
    const key = `${kind}\n${sql}`;
    let name = NAMED.get(key);
    if (!name) {
        let normalized = sql.replace(SQL_TOKEN, (token, comment, value) => comment ? ' ' : value ? '?' : token)
            .replace(/\s+/g, ' ').trim();
        if (normalized.length > MAX_SQL_NAME_LENGTH) {
            const suffix = ` [${createHash('sha256').update(normalized).digest('hex').slice(0, 16)}]`;
            normalized = normalized.slice(0, MAX_SQL_NAME_LENGTH - suffix.length) + suffix;
        }
        name = `${kind}: ${normalized}`;
        if (NAMED.size >= 1000) NAMED.clear();
        NAMED.set(key, name);
    }
    return name;
}

const text = (values: unknown[]) => values.reduce<number>((sum, value) => sum + (typeof value === 'string' ? value.length : 0), 0);
const rowText = (row: unknown) => row && typeof row === 'object' ? text(Object.values(row)) : 0;
const rowsText = (rows: unknown[]) => rows.reduce<number>((sum, row) => sum + rowText(row), 0);

function timedRun(statement: StatementSync, name: string, timings: StoreTimings, values: never[]) {
    const first: unknown = values[0];
    if (!first || typeof first !== 'object' || ArrayBuffer.isView(first))
        return timings.time(name, () => statement.run(...values), () => text(values));

    // Observe values as SQLite binds them so accessor-backed parameters are read only once.
    const namedValues: unknown[] = [];
    const named = new Proxy(first as Record<string, SQLInputValue>, {
        get(target, property) {
            const value = Reflect.get(target, property, target);
            namedValues.push(value);
            return value;
        },
    });
    const positional = values.slice(1);
    return timings.time(name, () => statement.run(named, ...positional), () => text(namedValues) + text(positional));
}

function timed(statement: StatementSync, name: string, timings: StoreTimings): StatementSync {
    const calls: Partial<Record<'get' | 'all' | 'run', unknown>> = {};
    return new Proxy(statement, {
        get(target, property) {
            if (property === 'get')
                return calls.get ??= (...values: never[]) => timings.time(name, () => target.get(...values), rowText);
            if (property === 'all')
                return calls.all ??= (...values: never[]) => timings.time(name, () => target.all(...values), rowsText);
            if (property === 'run')
                return calls.run ??= (...values: never[]) => timedRun(target, name, timings, values);
            // Everything else is the statement's own, called on the statement itself. iterate() is not timed.
            const value = Reflect.get(target, property, target);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });
}

function timeTag<T>(timings: StoreTimings, strings: TemplateStringsArray, work: () => T, chars: (result: T) => number): T {
    if (!Array.isArray(strings)) return work(); // Let SQLite reject invalid tag arguments.
    return timings.time(statementName('sql', strings.join('?')), work, chars);
}

function timedTagStore(tag: SQLTagStore, timings: StoreTimings): SQLTagStore {
    const { get, all, run } = tag;
    tag.get = function (strings, ...values) {
        return timeTag(timings, strings, () => get.call(this, strings, ...values), rowText);
    };
    tag.all = function (strings, ...values) {
        return timeTag(timings, strings, () => all.call(this, strings, ...values), rowsText);
    };
    tag.run = function (strings, ...values) {
        return timeTag(timings, strings, () => run.call(this, strings, ...values), () => text(values));
    };
    return tag;
}

/**
 * Times every statement this connection runs from now on, whoever prepares it: each get/all/run under its SQL
 * name with the characters of text it wrote or read, and each exec (BEGIN, COMMIT, PRAGMA) under its own.
 * What a statement does and returns is unchanged.
 */
export function timeStatements(db: DatabaseSync, timings: StoreTimings): void {
    const prepare = db.prepare.bind(db), exec = db.exec.bind(db);
    const createTagStore = db.createTagStore.bind(db);
    db.prepare = ((sql: string, ...rest: never[]) => timed(prepare(sql, ...rest), statementName('sql', sql), timings)) as typeof db.prepare;
    db.exec = (sql: string) => timings.time(statementName('exec', sql), () => exec(sql), () => sql.length);
    db.createTagStore = (...args) => timedTagStore(createTagStore(...args), timings);
}
