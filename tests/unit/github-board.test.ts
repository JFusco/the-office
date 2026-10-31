import { afterEach, expect, test } from 'vitest';
import { Store } from '../../server/store';
import { projectById } from '../../server/projects';
import { GitHubMonitor } from '../../server/github';

const stores:Store[]=[];
afterEach(()=>stores.splice(0).forEach(s=>s.close()));
function setup(){const store=new Store(':memory:',projectById('brain'),'/tmp/office-board-fixture');stores.push(store);return store;}
function page(number:number,next=false){return JSON.stringify({data:{user:{projectV2:{title:'Brain fixture',url:'https://github.com/users/JFusco/projects/8',shortDescription:'Synthetic board',readme:'Fixture README',fields:{nodes:[{name:'Status',options:[{name:'Backlog'},{name:'Ready'}]}],pageInfo:{hasNextPage:false}},items:{nodes:[{id:`item-${number}`,content:{number,title:`Fixture ${number}`,url:`https://github.com/JFusco/brain/issues/${number}`,state:'OPEN',repository:{nameWithOwner:'JFusco/brain'}},fieldValues:{nodes:[{name:'Ready',field:{name:'Status'}}],pageInfo:{hasNextPage:false}}}],pageInfo:{hasNextPage:next,endCursor:next?'page-2':null}}}}}});}
test('Brain project reader collects all cards and only uses read queries against project 8',async()=>{
  const store=setup(),calls:string[][]=[];
  const monitor=new GitHubMonitor(store,async(program,args)=>{expect(program).toBe('gh');calls.push(args);expect(args).toContain('number=8');expect(args.join(' ')).not.toContain('mutation');return page(calls.length,calls.length===1);});
  const board=await monitor.board();expect(board?.items.map(i=>i.number)).toEqual([1,2]);expect(board?.lanes).toEqual(['Backlog','Ready']);expect(calls[1]).toContain('after=page-2');expect(board?.error).toBe('');
});
test('failed later page retains the entire last good board and exposes missing Projects access',async()=>{
  const store=setup();const good=await new GitHubMonitor(store,async()=>page(1)).board();
  store.state.github={status:'idle',observedAt:'',error:'',issues:[],prs:[],runs:[],board:good};let calls=0;
  const board=await new GitHubMonitor(store,async()=>{if(++calls===1)return page(2,true);throw new Error('INSUFFICIENT_SCOPES');}).board();
  expect(board?.items.map(i=>i.number)).toEqual([1]);expect(board?.observedAt).toBe(good?.observedAt);expect(board?.error).toContain('INSUFFICIENT_SCOPES');expect(board?.error).toContain('gh auth refresh');
});
test('project observation failure does not discard repository issues or claim empty lanes',async()=>{
  const store=setup();
  await new GitHubMonitor(store,async(_program,args)=>{
    if(args[1]==='graphql')throw new Error('Projects unavailable');
    if(args[1].includes('/issues?'))return JSON.stringify([[{number:255,title:'Fixture issue',state:'open',html_url:'https://github.com/JFusco/brain/issues/255',updated_at:'2026-10-28T00:00:00Z'}]]);
    if(args[1].includes('/pulls?'))return '[[]]';
    return '{"workflow_runs":[]}';
  }).poll();
  expect(store.state.github?.error).toBe('');expect(store.state.github?.issues[0].number).toBe(255);expect(store.state.github?.board?.observedAt).toBe('');expect(store.state.github?.board?.error).toContain('Projects unavailable');
});
