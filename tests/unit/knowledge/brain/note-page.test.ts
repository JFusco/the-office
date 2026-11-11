import { expect,it } from 'vitest';
import { committedNotePage } from '../../../../server/knowledge/brain/note-page';
import { CommittedBrain,type BrainReader } from '../../../../server/knowledge/brain/reader';
import { digest } from '../../../../server/knowledge/digest';

it('reads selected committed sections without splitting Unicode or accepting a changed hash',async()=>{
    const snapshot='a'.repeat(40),path='knowledge/tooling/guide.md',text='x'.repeat(8191)+'🧠'+' saved committed content',hash=digest(text),calls:string[]=[];
    const brain:BrainReader={snapshot:async()=>{throw Error('Never repin');},search:async()=>[],read:async(revision,note)=>{calls.push(revision+':'+note);return {text,contentSha256:hash};}};
    const first=await committedNotePage(brain,snapshot,path,hash);expect(first!.text).toHaveLength(8191);expect(first!.nextOffset).toBe(8191);
    const second=await committedNotePage(brain,snapshot,path,hash,first!.nextOffset!);expect(first!.text+second!.text).toBe(text);expect(second!.nextOffset).toBeNull();expect(calls.every(x=>x===snapshot+':'+path)).toBe(true);
    expect(await committedNotePage(brain,snapshot,path,hash,8192)).toBeUndefined();expect(await committedNotePage(brain,snapshot,path,'b'.repeat(64))).toBeUndefined();
    const before=calls.length;expect(await committedNotePage(brain,snapshot,'../private.md',hash)).toBeUndefined();expect(calls).toHaveLength(before);
});
it('validates committed graph response identity and the finite CLI transport',async()=>{
    const snapshot='a'.repeat(40),calls:string[][]=[];
    const page={version:1,snapshot,nodes:[],edges:[],truncated:false,nextCursor:null};
    const reader=new CommittedBrain('/synthetic',async(_program,args)=>{calls.push(args);return JSON.stringify(page);});
    expect((await reader.graph(snapshot)).snapshot).toBe(snapshot);expect(calls[0]).toEqual(['scripts/brain.mjs','snapshot','--snapshot',snapshot]);
    page.snapshot='b'.repeat(40);await expect(reader.graph(snapshot)).rejects.toThrow('snapshot mismatch');
});
