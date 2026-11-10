import { randomUUID } from 'node:crypto';
import type { Store } from '../../store/store';
import type { KnowledgeSource } from '../sources/source-record';
const DERIVED = new Set(['meta', 'report-hash']);

/** Intake records deliberately never enter Store.state or the Office snapshot. */
export class IntakeLedger {
    constructor(readonly store: Store, readonly source?: Pick<KnowledgeSource, 'id' | 'homeProjectId'>) {
        if (source ? source.homeProjectId !== store.project.id : store.project.id !== 'brain') throw Error('Intake ledger home mismatch');
        store.db.exec('CREATE TABLE IF NOT EXISTS slack_intake (kind TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, PRIMARY KEY(kind,id))');
    }
    private kind(kind: string): string { return this.source ? `${this.source.id}:${kind}` : kind; }
    get<T>(kind: string, id: string): T | undefined {
        const row = this.store.db.prepare('SELECT body FROM slack_intake WHERE kind=? AND id=?').get(this.kind(kind), id) as { body: string } | undefined;
        return row ? JSON.parse(row.body) : undefined;
    }
    all<T>(kind: string): T[] {
        return (this.store.db.prepare('SELECT body FROM slack_intake WHERE kind=? ORDER BY rowid').all(this.kind(kind)) as { body: string }[]).map(row => JSON.parse(row.body));
    }
    /** Metadata-only projection, still bound to this exact source namespace. */
    columns<T>(kind:string,fields:string[]):T[] {
        if(!fields.length||fields.some(f=>!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f)))throw Error('Invalid intake metadata projection');
        return this.store.db.prepare(`SELECT ${fields.map(f=>`json_extract(body,'$.${f}') AS "${f}"`).join(',')} FROM slack_intake WHERE kind=? ORDER BY rowid`).all(this.kind(kind)) as T[];
    }
    /** Rows whose JSON body has `path` equal to `value`, so callers need not parse unrelated source text. */
    where<T>(kind: string, path: string, value: string): T[] {
        return (this.store.db.prepare('SELECT body FROM slack_intake WHERE kind=? AND json_extract(body,?)=? ORDER BY rowid').all(this.kind(kind), path, value) as { body: string }[]).map(row => JSON.parse(row.body));
    }
    put(kind: string, id: string, body: unknown): void {
        const { changes } = this.store.db.prepare('INSERT INTO slack_intake VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body WHERE body IS NOT excluded.body').run(this.kind(kind), id, JSON.stringify(body));
        // Identical rewrites and derived bookkeeping never invalidate revision-gated reconciliation.
        if (Number(changes) && !DERIVED.has(kind)) this.store.db.prepare("INSERT INTO slack_intake VALUES(?,'revision',?) ON CONFLICT(kind,id) DO UPDATE SET body=excluded.body").run(this.kind('meta'), JSON.stringify(randomUUID()));
    }
    /** Opaque token that changes on every effective record write. */
    revision(): string { return this.get<string>('meta', 'revision') || ''; }
    transaction<T>(fn: () => T): T { return this.store.transaction(fn); }
    id(): string { return randomUUID(); }
}
