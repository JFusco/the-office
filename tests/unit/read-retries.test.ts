import {expect,test,afterEach} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {planReadRetry,reconcileReadRetries} from '../../server/read-retries';
import {Store} from '../../server/store';
import {projectById} from '../../server/projects';
import {coordination} from '../../server/coordination';
const roots:string[]=[],stores:Store[]=[];afterEach(()=>{stores.forEach(s=>s.close());roots.forEach(r=>rmSync(r,{recursive:true,force:true}));stores.length=roots.length=0;});
test('temporary reads back off, retain failures, and stop after three retries',()=>{
 const item:any={status:'blocked',detail:'Error: gh timed out'};let now=new Date('2026-10-28T19:00Z');
 for(let i=0;i<3;i++){expect(planReadRetry(item,now)).toBe(true);expect(item.status).toBe('blocked');now=new Date(item.retry.nextAt);expect(planReadRetry(item,now)).toBe(true);expect(item.status).toBe('queued');expect(item.retry.attempts).toBe(i+1);item.status='blocked';item.detail='Error: gh timed out';}
 planReadRetry(item,now);expect(item.retry.exhausted).toBe(true);expect(item.retry.history).toHaveLength(3);expect(item.retry.nextAt).toBe('');
 for(const detail of ['OAuth token refresh timed out','Permission denied; connection failed','Explicit Backlog hold; error connecting','Uncertain mutation timed out'])expect(planReadRetry({status:'blocked',detail},now)).toBe(false);
});
test('restart recovery restores the original same-session read-only result without bypassing its hold',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'office-read-recovery-'));roots.push(root);const store=new Store(':memory:',projectById('brain'),root);stores.push(store);store.state.coordination=coordination();store.state.paused=false;
 const review:any={id:'r',key:'GH-70',status:'interrupted',detail:'PM review interrupted',owner:''};store.state.coordination.listener.reviews=[review];store.state.workLog=[{id:'w',requestId:'r',stage:'assignment-review',status:'blocked',sessionId:'s'}] as any;
 const dir=resolve(root,'sessions/w');mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'provider.json'),JSON.stringify({project:'brain',readOnly:true}));writeFileSync(resolve(dir,'result.json'),JSON.stringify({session:'s',result:{outcome:'held',ownershipChecked:false,owner:'',summary:'Preserve Backlog hold.',evidence:['Explicit human deferral.']}}));
 reconcileReadRetries(store);expect(review.status).toBe('held');expect(review.detail).toContain('Preserve Backlog hold');expect(review.retry.attempts).toBe(0);
 review.status='interrupted';writeFileSync(resolve(dir,'provider.json'),JSON.stringify({project:'brain',readOnly:false}));reconcileReadRetries(store);expect(review.status).toBe('interrupted');
});
test('writer stages and uncertain effects never become automatic retries',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'office-read-retry-'));roots.push(root);const store=new Store(':memory:',projectById('brain'),root);stores.push(store);store.state.paused=false;store.state.coordination=coordination();store.state.coordination.jobs=['prepare-pr','draft','closeout','merge','implement','review'].map(stage=>({id:stage,key:'GH-1',stage,status:'blocked',detail:'Error: gh timed out',steps:stage==='review'?[{result:{receipts:[{uncertain:true,verified:false,action:'PATCH'}]}}]:[]})) as any;
 reconcileReadRetries(store);expect(store.state.coordination.jobs!.every(j=>!j.retry)).toBe(true);
});
test('native model capacity retries only existing read-only stages with the same bounded backoff',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'office-capacity-retry-'));roots.push(root);const store=new Store(':memory:',projectById('brain'),root);stores.push(store);store.state.paused=false;store.state.coordination=coordination();
 const detail='Error: codex exited 1: Selected model is at capacity. Please try a different model.';
 const jobs=['review','lead-pr','validate','implement','draft'].map(stage=>({id:stage,key:'GH-1',stage,status:'blocked',detail,steps:[]}));store.state.coordination.jobs=jobs as any;
 let now=new Date('2026-10-30T00:00Z');
 for(let i=0;i<3;i++){reconcileReadRetries(store,now);now=new Date(now.getTime()+[30000,120000,300000][i]);reconcileReadRetries(store,now);for(const j of jobs.slice(0,2)){expect(j.status).toBe('queued');j.status='blocked';j.detail=detail;}}
 reconcileReadRetries(store,now);expect(jobs.slice(0,2).every((j:any)=>j.retry.exhausted&&j.retry.attempts===3)).toBe(true);expect(jobs.slice(2).every((j:any)=>!j.retry&&j.status==='blocked')).toBe(true);
});
