import { expect,test } from 'vitest';
import { pendingRounds,roundAuthor } from '../../../../server/features/questions/pending-round';
import { fixture } from '../test-store';
test('legacy authors, current review identities and resolved harness notes remain separate',()=>{
 const f=fixture();try{
 const product={id:'product',revision:1,createdAt:'',answers:{},questions:[{id:'q',question:'What?',recommendation:'',choices:[]}]};
 f.feature.rounds.push(product,{...product,id:'recovery',author:'harness',notes:[{id:'note',text:'context',at:''}]},{...product,id:'old-review',reviewRun:'old',reviewRevision:1});
 expect(roundAuthor(f.feature.rounds[2])).toBe('review');
 expect(pendingRounds(f.feature).map(r=>r.id)).toEqual(['product','recovery']);
 f.feature.rounds[1].resolvedAt='now'; expect(pendingRounds(f.feature).map(r=>r.id)).toEqual(['product']);
 }finally{f.close();}
});
