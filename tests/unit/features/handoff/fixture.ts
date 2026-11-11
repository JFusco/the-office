import {fixture} from '../test-store';
import {FEATURE_PLANNING} from '../../../../server/office/config';
export function handoffFixture(id='brain'){
 const f=fixture(id);FEATURE_PLANNING[id]={progression:'automatic',assessment:{enabled:true}};
 f.store.db.exec('CREATE TABLE IF NOT EXISTS feature_assessments(id TEXT PRIMARY KEY,project_id TEXT NOT NULL,ticket_key TEXT NOT NULL,body TEXT NOT NULL); CREATE TABLE IF NOT EXISTS feature_evidence_captures(project_id TEXT NOT NULL,target TEXT NOT NULL,body TEXT NOT NULL,PRIMARY KEY(project_id,target));');
 let now=new Date('2026-11-10T12:00:00Z');f.store.clock={...f.store.clock,now:()=>now};
 return {...f,advance(ms:number){now=new Date(now.getTime()+ms)},close(){delete FEATURE_PLANNING[id];f.close();}};
}
