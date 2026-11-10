import type { Store } from '../../store/store';
import { digest } from '../slack-intake/config';
export function retainOutboundBody(store:Store,id:string,text:string):string {
    if(!text.trim()||text.length>5000)throw Error('Invalid outbound knowledge body');
    store.db.exec('CREATE TABLE IF NOT EXISTS knowledge_outbound_bodies(id TEXT PRIMARY KEY,sha256 TEXT NOT NULL,body TEXT NOT NULL)');
    const sha256=digest(text);store.db.prepare('INSERT INTO knowledge_outbound_bodies VALUES(?,?,?)').run(id,sha256,text);return sha256;
}
/** Private reconciliation proof is retained even after grants change; it grants no ordinary delivery. */
export function outboundBody(store:Store,id:string,sha256?:string):string|undefined {
    try {const row=store.db.prepare('SELECT sha256,body FROM knowledge_outbound_bodies WHERE id=?').get(id) as {sha256:string;body:string}|undefined;
        if(!row||row.body.length>5000||digest(row.body)!==row.sha256||sha256&&row.sha256!==sha256)return;return row.body;
    }catch{return;}
}
