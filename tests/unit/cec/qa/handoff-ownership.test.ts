import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { handoffOwnership } from '../../../../server/cec/qa/handoff-ownership';
const stores:Store[]=[];afterEach(()=>stores.splice(0).forEach(s=>s.close()));
const id='12345678-1234-4234-9234-123456789abc';
function fixture(){
    const store=new Store(':memory:',projectById('cec'));stores.push(store);
    const scope={project:'cec',issues:[900],prs:[],evidence:[{at:'2026-11-15T12:00:00Z',reference:'https://example.test/browse/CEC-900',kind:'reference',issue:900}]};
    const session:any={id,provider:'codex',status:'active',cwd:'/synthetic/operator-other-repository',title:'Operator',branch:'main',context:{activity:'active',scopes:[scope]}};
    const view:any={complete:true,fresh:true,observedAt:'2026-11-15T12:01:00Z',project:'cec',key:'CEC-900',ownership:{status:'uncertain',matches:[{id}]},sessions:[session]};
    const decision:any={key:'CEC-900',existingOwner:'',blocker:''};
    return{store,scope,session,view,decision};
}
test('recognizes only the explicitly coordinated reference after the independent PM decision, without changing the inventory',async()=>{
    const f=fixture(),before=structuredClone(f.view);
    const proof=await handoffOwnership(f.store,'CEC-900',async()=>f.view,id,f.decision);
    expect(proof).toMatchObject({kind:'coordinated',sessionId:id});expect(f.view).toEqual(before);
    expect('contextSha256'in proof&&proof.contextSha256).toMatch(/^[a-f0-9]{64}$/);
});
test.each(['missing-coverage','stale','owned','unknown','another-match','duplicate-row','missing-actor','unknown-activity','target-cwd',
    'target-worktree','target-project','live-ticket','request-owner','execution-evidence','another-issue','pr','no-evidence','wrong-project',
    'wrong-key','bad-time','model-owner','model-hold','missing-verdict','no-declaration','no-model'])('retains %s as a blocker',async reason=>{
    const f=fixture();
    if(reason==='missing-coverage')f.view.complete=false;if(reason==='stale')f.view.fresh=false;
    if(reason==='owned')f.view.ownership.status='owned';if(reason==='unknown')f.view.ownership.status='unavailable';
    if(reason==='another-match')f.view.ownership.matches.push({id:'another'});if(reason==='duplicate-row')f.view.sessions.push({...f.session});
    if(reason==='missing-actor')f.view.sessions=[];if(reason==='unknown-activity')f.session.context.activity='unknown';
    if(reason==='target-cwd')f.session.cwd=f.store.project.repo;if(reason==='target-worktree')f.session.cwd=f.store.project.repo+'/owned';
    if(reason==='target-project')f.session.project='cec';if(reason==='live-ticket')f.session.ticket='CEC-900';if(reason==='request-owner')f.session.requestId='other';
    if(reason==='execution-evidence')f.scope.evidence[0].kind='command';if(reason==='another-issue')f.scope.issues.push(901);
    if(reason==='pr')(f.scope.prs as number[]).push(1);if(reason==='no-evidence')f.scope.evidence=[];
    if(reason==='wrong-project')f.view.project='other';if(reason==='wrong-key')f.view.key='CEC-901';if(reason==='bad-time')f.view.observedAt='invalid';
    if(reason==='model-owner')f.decision.existingOwner='another writer';if(reason==='model-hold')f.decision.blocker='Missing access';
    if(reason==='missing-verdict')delete f.decision.existingOwner;
    await expect(handoffOwnership(f.store,'CEC-900',async()=>f.view,reason==='no-declaration'?undefined:id,reason==='no-model'?undefined:f.decision)).rejects.toThrow();
});
test('ordinary complete clear ownership retains its strict path; no coordinator exception is required',async()=>{
    const f=fixture();f.view.ownership={status:'clear',matches:[]};
    expect(await handoffOwnership(f.store,'CEC-900',async()=>f.view)).toMatchObject({kind:'clear'});
});
