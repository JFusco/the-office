import type { Store } from '../../store/store';
import type { KnowledgeContext } from '../context';
import type { KnowledgeDigest,KnowledgeDigestDetail } from '../../../src/contracts/knowledge-digests';
import { knowledgeSnapshot } from '../knowledge-snapshot';
import { digest } from '../digest';
/** Private body and metadata share the owning Store transaction; immutable IDs never overwrite. */
export function prepareDigestBodies(store:Store):void {store.db.exec('CREATE TABLE IF NOT EXISTS knowledge_digest_bodies(id TEXT PRIMARY KEY,body TEXT NOT NULL)');}
export function retainDigestBody(store:Store,record:KnowledgeDigest,text:string):void {
    if(text.length>6000||digest(text)!==record.sha256)throw Error('Invalid knowledge digest body');
    store.db.prepare('INSERT INTO knowledge_digest_bodies(id,body) VALUES(?,?)').run(record.id,JSON.stringify({text}));
}
export function digestKnowledge(context:KnowledgeContext,project:string,id:string):KnowledgeDigestDetail|undefined {
    const store=context.stores.get(project);if(!store)return;
    const record=knowledgeSnapshot(context.registry,project,store.state.knowledge)?.digests?.find(d=>d.id===id);if(!record)return;
    try{const row=store.db.prepare('SELECT body FROM knowledge_digest_bodies WHERE id=?').get(id) as {body:string}|undefined;
        if(!row||Buffer.byteLength(row.body)>32768)return;const {text}=JSON.parse(row.body);
        if(typeof text!=='string'||text.length>6000||digest(text)!==record.sha256)return;return {...record,text};
    }catch{return;}
}
