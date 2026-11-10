import { sourceLaunchLimit } from './seed-budget';
import { easternDay } from '../../office/clock';
import type { SourceRegistry } from './registry';
export class IntakeBudget {
    constructor(private registry: SourceRegistry) {}
    used(day = easternDay(this.registry.clock.now())): number {
        // Unlaunched reservations survive midnight and crashes conservatively.
        return Number((this.registry.db.prepare("SELECT count(*) AS total FROM knowledge_launches WHERE (day=? AND state IN ('launched','uncertain')) OR state='reserved'").get(day) as { total: number }).total);
    }
    limit(sourceId:string):number { return sourceLaunchLimit(this.registry,sourceId); }
    reserve(attempt: string, sourceId: string): boolean {
        return this.registry.transaction(() => {
            const prior = this.registry.db.prepare('SELECT state FROM knowledge_launches WHERE attempt=?').get(attempt);
            if (prior) return false;
            const day = easternDay(this.registry.clock.now()); if (this.used(day) >= this.limit(sourceId)) return false;
            this.registry.db.prepare("INSERT INTO knowledge_launches VALUES(?,?,?,'reserved')").run(attempt, day, sourceId); return true;
        });
    }
    launched(attempt: string): void {
        this.registry.db.prepare("UPDATE knowledge_launches SET state='launched',day=? WHERE attempt=? AND state='reserved'").run(easternDay(this.registry.clock.now()), attempt);
    }
    notSpawned(attempt: string): void { this.registry.db.prepare("UPDATE knowledge_launches SET state='not-spawned' WHERE attempt=? AND state='reserved'").run(attempt); }
    /** Ownership absence settles uncertainty, never proves no spawn or authorizes replay. */
    settleOrphan(attempt:string):boolean {
        return this.registry.transaction(()=>{
            const row=this.registry.db.prepare("SELECT day,source_id FROM knowledge_launches WHERE attempt=? AND state='reserved'").get(attempt) as {day:string;source_id:string}|undefined;if(!row)return false;
            const day=easternDay(this.registry.clock.now());
            this.registry.db.prepare("UPDATE knowledge_launches SET state='uncertain' WHERE attempt=? AND state='reserved'").run(attempt);
            // Retain the original debit. A launch spanning an unobserved midnight may also belong to recovery day.
            if(day!==row.day)this.registry.db.prepare("INSERT OR IGNORE INTO knowledge_launches VALUES(?,?,?,'uncertain')").run(`uncertain-recovery:${attempt}:${day}`,day,row.source_id);
            this.registry.setMeta(`launch-recovery:${attempt}`,{reservationDay:row.day,settledDay:day,additionalConservativeCharge:day!==row.day});return true;
        });
    }
    backoff(workspace: string, appId: string, method: string): string | undefined {
        return (this.registry.db.prepare('SELECT until_at FROM knowledge_backoff WHERE id=?').get(JSON.stringify([workspace, appId, method])) as { until_at: string } | undefined)?.until_at;
    }
    defer(workspace: string, appId: string, method: string, until: string): void {
        this.registry.db.prepare('INSERT INTO knowledge_backoff VALUES(?,?) ON CONFLICT(id) DO UPDATE SET until_at=max(knowledge_backoff.until_at,excluded.until_at)').run(JSON.stringify([workspace, appId, method]), until);
    }
}
