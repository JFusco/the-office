import {expect,test} from 'vitest';
import {recommendedReply} from '../../../src/recommended-reply';
import {initialSnapshot} from '../../../server/store/store';
import {coordination} from '../../../server/scheduling/coordination';
test('recommendations preserve Backlog deferral and do not imply approval',()=>{
 const s=initialSnapshot();s.coordination=coordination();s.coordination.listener.assigned=[{key:'GH-70',pickupStatus:'Backlog'} as any];
 expect(recommendedReply(s,'GH-70','message:old','pm')).toContain('Do not start development');
 expect(recommendedReply(s,'GH-70','message:old','pm')).toContain('verified');
});
test('uncertain requests suggest read-back and regular ticket chats ask for current linked evidence',()=>{
 const s=initialSnapshot();expect(recommendedReply(s,'GH-255','maintenance:old','pm')).toContain('without repeating writes');
 expect(recommendedReply(s,'GH-265','','pm')).toContain('exact-head checks');
 expect(recommendedReply(s,'GH-265','','lead')).toContain('latest evidence for your role');
 expect(recommendedReply(s,'','','pm')).toBe('');
});
