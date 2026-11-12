import { randomBytes,createHash,timingSafeEqual } from 'node:crypto';
import type { Store } from '../../store/store';
import type { KnowledgeContext } from '../context';
import type { LearningSubject } from '../../../src/contracts/knowledge';
import type { KnowledgeLookupResponse } from '../../../src/contracts/knowledge-lookups';
import { retrieve } from '../retrieval';
import { boundEvidence } from '../task-briefing';
import { referenceVisible } from './reference-scope';
import { lookupJournal,type LookupJournal } from './receipts';
import { lookupInstructions } from './instructions';

interface Binding {
    id:string; tokenHash:Buffer; context:KnowledgeContext; store:Store; claimId?:string;
    snapshot:string|null; active:()=>boolean; journal:LookupJournal; count:number; closed:boolean;
}
export class AssignmentLookups {
    private bindings=new Map<string,Binding>();
    constructor(private journal:typeof lookupJournal=lookupJournal) {}
    issue(input:{id:string;context:KnowledgeContext;store:Store;dir:string;stage:string;subject?:LearningSubject;claimId?:string;snapshot:string|null;active:()=>boolean}) {
        if(this.bindings.has(input.id))throw Error('Lookup assignment already registered');
        const token=randomBytes(32).toString('base64url');
        const binding:Binding={...input,tokenHash:createHash('sha256').update(token).digest(),journal:this.journal(input.store,input.dir,input.id,input.stage,input.subject),count:0,closed:false};
        if(!this.live(binding))throw Error('Lookup assignment is inactive');
        this.bindings.set(input.id,binding);
        return {instructions:lookupInstructions(input.id,token),close:()=>{binding.closed=true;this.bindings.delete(input.id);binding.journal.finish();}};
    }
    private live(b:Binding):boolean {
        return !b.closed&&b.active()&&b.store.state.workLog?.some(w=>w.id===b.id&&w.status==='running')===true&&(!b.claimId||b.store.activeClaims().some(c=>c.id===b.claimId&&c.status==='running'&&c.work.projectId===b.store.project.id));
    }
    async route(req:Request,url:URL):Promise<Response> {
        const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'private, no-store'}});
        const binding=this.bindings.get(url.searchParams.get('assignment')||''),token=req.headers.get('X-Office-Knowledge')||'';
        if(req.method!=='GET')return json({error:'GET required'},405);
        if(!binding||!token||token.length>128||!timingSafeEqual(binding.tokenHash,createHash('sha256').update(token).digest())||!this.live(binding))return json({error:'Knowledge lookup unavailable'},404);
        const query=url.searchParams.get('q')||'';
        if(!query.trim()||query.length>1000)return json({error:'Query must contain 1 to 1000 characters'},400);
        if(binding.count>=20)return json({error:'Assignment lookup limit reached'},429);
        // Reserve synchronously before the first await: parallel requests cannot exceed the limit.
        const index=++binding.count,project=binding.store.project.id;
        let response:KnowledgeLookupResponse={assignment:binding.id,index,at:binding.store.clock.now().toISOString(),outcome:'unavailable',text:'',textSha256:'',selected:[],snapshot:binding.snapshot,technicalStatus:'unavailable'};
        try {
            // A missing initial snapshot stays unavailable; lookups must never silently repin to HEAD.
            const unavailable=async():Promise<never>=>{throw Error('No pinned snapshot');};
            const context=binding.snapshot?binding.context:{...binding.context,brain:{snapshot:unavailable,search:unavailable,read:unavailable}};
            const evidence=boundEvidence(await retrieve(context,project,query,{snapshot:binding.snapshot||undefined}));
            if(!this.live(binding))return json({error:'Knowledge lookup expired'},404);
            if(evidence.selected.every(s=>referenceVisible(binding.context,project,s.reference)))response={...response,...evidence,outcome:evidence.selected.length?'served':'unavailable'};
        } catch { /* Fail closed without exposing provider or filesystem diagnostics. */ }
        if(!this.live(binding))return json({error:'Knowledge lookup expired'},404);
        response.textSha256=createHash('sha256').update(response.text).digest('hex');
        if(Buffer.byteLength(JSON.stringify(response))>16384)response={...response,outcome:'unavailable',text:'',textSha256:createHash('sha256').update('').digest('hex'),selected:[]};
        try { binding.journal.append(query,response); }
        catch { binding.closed=true;this.bindings.delete(binding.id);return json({error:'Knowledge lookup recording unavailable'},503); }
        return json(response);
    }
}
/** Restart intentionally drops all capabilities. No token is stored in public state. */
export const assignmentLookups=new AssignmentLookups();
