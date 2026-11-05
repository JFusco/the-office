import {expect,test} from 'vitest';
import {itDiagnostics} from '../../../src/health/it-diagnostics';
import {itAgent} from '../../../src/health/it-agent';
const now=Date.parse('2026-11-05T14:00:00Z');
const current:any={projectId:'brain',checkedAt:new Date(now-60000).toISOString(),status:'retrying',followUps:[],reports:[{summary:'Historical GH-310 blocker',followUps:[{id:'old',owner:'IT',detail:'old'}]}]};
test('current follow-ups supersede historical reports in both diagnostics and Ellis avatar',()=>{
 expect(itDiagnostics(current,'brain',now)).toMatchObject({fresh:true,followUps:[],status:'monitoring'});
 const agent=itAgent({project:{id:'brain'},agents:[],it:current} as any,now);expect(agent.activity).toBe('idle');expect(agent.task).toBe('No current IT follow-up.');
});
for(const stamp of ['', 'malformed',new Date(now-150000).toISOString(),new Date(now+15001).toISOString()])test(`unverified IT timestamp ${stamp} cannot claim current diagnostics`,()=>{expect(itDiagnostics({...current,checkedAt:stamp},'brain',now)).toMatchObject({fresh:false,status:'unknown',followUps:[]});});
test('the panel clock tolerates an incoming check before its next fifteen-second tick',()=>{expect(itDiagnostics({...current,checkedAt:new Date(now+1000).toISOString()},'brain',now).fresh).toBe(true);});
test('diagnostics from another project never become current',()=>{expect(itDiagnostics(current,'cec',now).fresh).toBe(false);});
test('fresh historical-only payload remains compatible while the backend upgrades',()=>{const {followUps,...old}=current;expect(itDiagnostics(old,'brain',now).followUps).toHaveLength(1);});
