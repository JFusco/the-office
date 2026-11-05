import {expect,test} from 'vitest';
import {targetObservation} from '../../../server/features/target-observation';
test('target observations require one exact remote branch instead of accepting a stale local branch',async()=>{
 const store={project:{repo:'/source',target:'main'}} as any;
 const run=async(_p:string,args:string[])=>args[0]==='remote'?'https://example.test/repo.git':args[0]==='ls-remote'?'a'.repeat(40)+'\trefs/heads/main':'';
 expect((await targetObservation(store,run)).sha).toBe('a'.repeat(40));
 await expect(targetObservation(store,async()=> 'not-a-commit')).rejects.toThrow('exact remote');
});
