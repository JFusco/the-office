import { expect,it } from 'vitest';
import { assertProposalScope } from '../../../../server/knowledge/slack-intake/proposal-scope';
import type { SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
it('keeps registered domains, observed IDs, reported outcomes and UTF-8 proposal bounds authoritative before filtering',()=>{
 const config={domains:['tooling']},returned=new Map([['one',{} as SourceUnit]]),reported=new Map([['one',{outcome:'proposed'}]]),proposal={domain:'tooling',body:'a'.repeat(16384),units:['one']};
 expect(()=>assertProposalScope(config,proposal,returned,reported)).not.toThrow();
 for(const invalid of [{...proposal,domain:'unregistered'},{...proposal,body:'🌱'.repeat(4097)},{...proposal,units:['missing']},{...proposal,units:['one','one']}])expect(()=>assertProposalScope(config,invalid,returned,reported)).toThrow();
 expect(()=>assertProposalScope(config,proposal,returned,new Map([['one',{outcome:'deferred'}]]))).toThrow('unobserved');
});
