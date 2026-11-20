import {expect,test} from 'vitest';
import {recommendedReply} from '../../../src/conversations/recommended-reply';
import {initialSnapshot} from '../../../server/store/store';
import {coordination} from '../../../server/scheduling/coordination';
test('recommendations preserve Backlog deferral and do not imply approval',()=>{
 const s=initialSnapshot();s.coordination=coordination();s.coordination.listener.assigned=[{key:'GH-70',pickupStatus:'Backlog'} as any];
 expect(recommendedReply(s,'GH-70','message:old','pm')).toContain('Do not start development');
 expect(recommendedReply(s,'GH-70','message:old','pm')).toContain('verified');
});
test('uncertain requests suggest read-back and regular ticket chats ask for current linked evidence',()=>{
 const s=initialSnapshot();expect(recommendedReply(s,'GH-255','maintenance:old','pm')).toContain('without repeating any write');
 expect(recommendedReply(s,'GH-265','','pm')).toContain('exact-head checks');
 expect(recommendedReply(s,'GH-265','','lead')).toContain('latest evidence for your role');
 expect(recommendedReply(s,'','','pm')).toBe('');
});
const action=(id:string,title:string,detail:string,ticket='')=>({id,title,detail,role:'pm' as const,ticket,url:'',status:'open' as const,createdAt:'',updatedAt:''});
test('a Slack read-back names the recipient and the message, and asks for nothing to be sent',()=>{
 const s=initialSnapshot();s.slackDeliveries=[{requestId:'r1',status:'uncertain',targetName:'Joe Fusco',permalink:'https://example.slack.com/archives/D1/p1'} as any];
 s.outbox=[action('message:r1','Read back a Slack delivery','Message to Joe Fusco could not be confirmed.','GH-415')];
 const reply=recommendedReply(s,'GH-415','message:r1','pm');
 expect(reply).toContain('Slack message to Joe Fusco about GH-415');expect(reply).toContain('https://example.slack.com/archives/D1/p1');expect(reply).toContain('Do not send anything');
});
test('an interrupted conversation and a maintenance read-back quote what stopped them',()=>{
 const s=initialSnapshot();s.outbox=[action('message:m1','Follow up on an interrupted conversation','Error: Worker exited with surviving subprocesses; effects require reconciliation\nmore','GH-9')];
 expect(recommendedReply(s,'GH-9','message:m1','pm')).toContain('stopped with “Worker exited with surviving subprocesses; effects require reconciliation”');
 s.maintenance={runs:[{id:'run-1',requestedAt:'2026-11-19T22:00:34.475Z',status:'blocked',error:'Complete original output for command session 6124 remains unavailable.'} as any]} as any;
 const reply=recommendedReply(s,'','maintenance:run-1','pm');
 expect(reply).toContain('from 2026-11-19');expect(reply).toContain('“Complete original output for command session 6124 remains unavailable.”');
});
test('a blocked ticket, a stopped job, a question and an unsent notice each name their own blocker',()=>{
 const s=initialSnapshot();s.coordination=coordination();
 s.tickets=[{key:'CEC-154',stage:'staging-qa',activity:'blocked',blocker:'QA acceptance not verified: Real browser evidence is required'} as any];
 expect(recommendedReply(s,'CEC-154','ticket:CEC-154:staging-qa','qa')).toContain('CEC-154 is blocked at staging-qa: “QA acceptance not verified: Real browser evidence is required”');
 s.coordination.jobs=[{key:'GH-12',status:'blocked',stage:'lead-pr',detail:'PR is a draft; the readiness review runs once it is marked ready'} as any];
 expect(recommendedReply(s,'GH-12','ticket-job:j1','pm')).toContain('GH-12 is stopped at lead-pr: “PR is a draft; the readiness review runs once it is marked ready”');
 s.messages=[{id:'q1',question:'Which locale should own the fallback copy?'} as any];
 expect(recommendedReply(s,'GH-12','question:q1','pm')).toContain('“Which locale should own the fallback copy?”');
 s.outbox=[action('merge-notice:n1','Resolve GH-12 Slack notice','Error: Recipient lookup found two people named Alex','GH-12')];
 const notice=recommendedReply(s,'GH-12','merge-notice:n1','pm');
 expect(notice).toContain('“Recipient lookup found two people named Alex”');expect(notice).toContain('Do not send it twice');
});
test('an item the Office is already retrying has no suggested reply, and a long blocker is cut at a word',()=>{
 const s=initialSnapshot();s.outbox=[action('candidate-cleanup:j1','Clean up GH-183 worktree and branches','Error: git-remote-branch-delete is unverified','GH-183')];
 expect(recommendedReply(s,'GH-183','candidate-cleanup:j1','pm')).toBe('');
 s.outbox=[action('github','Restore the GitHub connection',`Error: ${'word '.repeat(80)}`)];
 const reply=recommendedReply(s,'','github','pm');
 expect(reply).toContain('Restore the GitHub connection. It says: “word word');expect(reply).toContain('word…”');expect(reply.length).toBeLessThan(420);
});
