import {expect,test,vi} from 'vitest';
import {jiraEvidence} from '../../../../server/features/handoff/jira-evidence';
import {handoffFixture} from './fixture';
test('native v2 comment pagination retains top-level metadata even for a short first page', async () => {
 const f=handoffFixture();try{
 const cursors:string[]=[];
 const execute=async(_program:string,args:string[])=>{
  if(args.includes('get'))return JSON.stringify({data:[{key:'CEC-154',summary:'Feature'}]});
  if(args.includes('comment')){
   const after=args.includes('--after')?args[args.indexOf('--after')+1]:'';cursors.push(after);
   return JSON.stringify({data:[{id:after?'second':'first',body:'Preserved comment'}],pageInfo:{hasNextPage:!after,nextCursor:after?null:'next'}});
  }
  return JSON.stringify({data:[]});
 };
 const evidence=await jiraEvidence({...f.store.project,provider:'azure'},'CEC-154',{execute,signal:new AbortController().signal,directory:f.root,download:async()=>{}});
 expect(cursors).toEqual(['','next']);expect(evidence.comments.map(comment=>comment.id)).toEqual(['first','second']);
 expect(evidence.coverage.comments.state).toBe('complete');
 }finally{f.close();}
});
test.each(['object', 'array'])('Jira preserves ADF, comments and direct children from a %s issue response', async (shape) => {
 const f=handoffFixture();try{
 const description={type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'Structure'}]}]};
 const fields = { summary: 'Feature', description, issuetype: { name: 'Task' } };
 const issue = shape === 'array' ? [{ key: 'CEC-154', ...fields }] : { key: 'CEC-154', fields };
 const execute=vi.fn(async(_p:string,args:string[])=>JSON.stringify({data:args.includes('get')?issue:args.includes('comment')?{comments:{nodes:[{id:'comment',body:'Matt context'}],pageInfo:{hasNextPage:false}}}:args.includes('attachment')?{attachments:[]}:{issues:[{key:'CEC-155',summary:'Child',description:'Preserve',parent:{key:'CEC-154'}}]}}));
 const result=await jiraEvidence({...f.store.project,provider:'azure'},'CEC-154',{execute,signal:new AbortController().signal,directory:f.root,download:async()=>{}});
 expect(result.description).toEqual(description);expect(result.children[0].key).toBe('CEC-155');expect(result.comments[0].body).toBe('Matt context');expect(execute.mock.calls[0][1]).toContain('--full');expect(execute.mock.calls.some(c=>c[1].includes('parent = CEC-154'))).toBe(true);
 }finally{f.close();}
});
test('missing Jira cursors remain incomplete',async()=>{
 const f=handoffFixture();try{
 const execute=async(_p:string,args:string[])=>JSON.stringify({data:args.includes('get')?{key:'CEC-154',summary:'Feature'}:args.includes('comment')?{comments:{nodes:[{id:'1',body:'context'}],pageInfo:{hasNextPage:true}}}:args.includes('attachment')?{attachments:[]}:{issues:[]}});
 const result=await jiraEvidence({...f.store.project,provider:'azure'},'CEC-154',{execute,signal:new AbortController().signal,directory:f.root,download:async()=>{}});expect(result.coverage.comments.state).toBe('truncated');
 }finally{f.close();}
});

test('a single-issue read rejects an ambiguous Jira result before reading related records', async () => {
    const fixture = handoffFixture();
    try {
        const execute = vi.fn(async () => JSON.stringify({ data: [
            { key: 'CEC-154', summary: 'Requested issue' },
            { key: 'CEC-155', summary: 'Unexpected issue' },
        ] }));
        const result = await jiraEvidence({ ...fixture.store.project, provider: 'azure' }, 'CEC-154', {
            execute, signal: new AbortController().signal, directory: fixture.root, download: async () => {},
        });
        expect(result.coverage.issue.state).toBe('unreadable');
        expect(execute).toHaveBeenCalledTimes(1);
    } finally {
        fixture.close();
    }
});
