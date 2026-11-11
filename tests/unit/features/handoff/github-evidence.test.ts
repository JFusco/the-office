import {expect,test,vi} from 'vitest';
import {githubEvidence} from '../../../../server/features/handoff/github-evidence';
import {handoffFixture} from './fixture';
test('GitHub reads explicit paginated endpoints and only provider attachment references',async()=>{
 const f=handoffFixture();try{
 const execute=vi.fn(async(_program:string,args:string[])=>JSON.stringify(args[1].includes('/comments?')?[{id:1,body:'See https://github.com/user-attachments/assets/a and https://evil.invalid/private'}]:args[1].includes('/sub_issues?')?[{number:2,html_url:'https://github.com/JFusco/brain/issues/2',title:'Child',body:'Keep it'}]:{number:1,html_url:'https://github.com/JFusco/brain/issues/1',title:'Feature',body:'Requirements',labels:[{name:'feature'}]}));
 const result=await githubEvidence(f.store.project,'GH-1',{execute,signal:new AbortController().signal,directory:f.root,download:async()=>{}});
 expect(result.comments).toHaveLength(1);expect(result.children[0].key).toBe('GH-2');expect(result.attachments).toHaveLength(1);expect(result.coverage.comments.state).toBe('complete');expect(execute.mock.calls.every(c=>c[0]==='gh')).toBe(true);
 }finally{f.close();}
});
test('pagination exhaustion cannot claim complete coverage',async()=>{
 const f=handoffFixture();try{
 const execute=async(_p:string,args:string[])=>JSON.stringify(args[1].includes('/comments?')?Array.from({length:100},(_,id)=>({id:id+1,body:'comment'})):args[1].includes('/sub_issues?')?[]:{number:1,html_url:'https://github.com/JFusco/brain/issues/1',title:'Feature',body:''});
 const result=await githubEvidence(f.store.project,'GH-1',{execute,signal:new AbortController().signal,directory:f.root,download:async()=>{}});expect(result.coverage.comments.state).toBe('truncated');
 }finally{f.close();}
});
