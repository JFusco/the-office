import {expect,test,vi} from 'vitest';
import {ProjectProgress} from '../../server/project-progress';
import {initialSnapshot} from '../../server/store';
import {projectById} from '../../server/projects';
function setup(){
 const state=initialSnapshot();state.project=projectById('brain');state.github={status:'idle',error:'',observedAt:'',issues:[],prs:[],runs:[],board:{items:[{number:255,repository:'JFusco/brain',status:'In progress'}]} as any};
 const store:any={state,project:state.project,save:vi.fn(),emit:vi.fn()},job:any={id:'job',key:'GH-255',stage:'review',head:'a'.repeat(40),status:'working',steps:[]};
 let lane='progress',writes=0,timeout=false,foreign=false;
 const execute=async(_program:string,_args:string[],opts?:any)=>{const {query}=JSON.parse(opts.input);let data:any;
  if(query.startsWith('mutation')){writes++;if(timeout)throw new Error('timeout after send');lane='review';data={};}
  else if(query.includes('fields(first'))data={user:{projectV2:{id:'project',fields:{nodes:[{id:'status',name:'Status',options:[{id:'progress',name:'In progress'},{id:'review',name:'In review'},{id:'backlog',name:'Backlog'}]}],pageInfo:{hasNextPage:false}}}}};
  else if(query.includes('items(first'))data={node:{items:{nodes:[{id:'item',content:{number:255,repository:{nameWithOwner:foreign?'wrong/repo':'JFusco/brain'}}}],pageInfo:{hasNextPage:false}}}};
  else data={node:{id:'item',fieldValues:{nodes:[{field:{id:'status'},optionId:lane}],pageInfo:{hasNextPage:false}}}};
  return JSON.stringify({data});
 };
 return {store,job,progress:new ProjectProgress(store,execute),writes:()=>writes,lane:(v:string)=>lane=v,timeout:()=>timeout=true,foreign:()=>foreign=true};
}
test('only a claimed review moves its existing exact-repository card, with read-back',async()=>{
 const a=setup();a.job.status='queued';await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('claimed');expect(a.writes()).toBe(0);
 a.job.status='working';await a.progress.reviewStarted(a.job);expect(a.writes()).toBe(1);expect(a.job.boardUpdates[0].status).toBe('verified');expect(a.store.state.github.board.items[0].status).toBe('In review');
 await a.progress.reviewStarted(a.job);expect(a.writes()).toBe(1);
});
test('an uncertain board write is read back on its original identity and never replayed',async()=>{
 const a=setup();a.timeout();await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('read-back');expect(a.job.boardUpdates[0].status).toBe('uncertain');
 await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('remains uncertain');expect(a.writes()).toBe(1);
 a.lane('review');await a.progress.reviewStarted(a.job);expect(a.writes()).toBe(1);expect(a.job.boardUpdates.every((u:any)=>u.status==='verified')).toBe(true);
});
test('a same-number foreign card or a Backlog hold cannot be moved by review dispatch',async()=>{
 const a=setup();a.foreign();await expect(a.progress.reviewStarted(a.job)).rejects.toThrow('no existing card');expect(a.writes()).toBe(0);
 const b=setup();b.lane('backlog');await expect(b.progress.reviewStarted(b.job)).rejects.toThrow('deferred');expect(b.writes()).toBe(0);
});
