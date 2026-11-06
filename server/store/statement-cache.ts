import type { DatabaseSync, StatementSync } from 'node:sqlite';
/**
 * Prepares each fixed SQL text once per connection. Callers pass literal SQL only, so the cache stays bounded.
 * Use get/all/run only: a shared statement reused inside its own iterate() loop is silently reset.
 */
export function statementCache(db: DatabaseSync): (sql: string) => StatementSync {
    const statements = new Map<string, StatementSync>();
    return sql => {
        let statement = statements.get(sql);
        if (!statement)
            statements.set(sql, statement = db.prepare(sql));
        return statement;
    };
}
