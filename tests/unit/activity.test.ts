import {expect,test} from 'vitest';
import {toolActivity,workerActivity} from '../../server/activity';
test('activity bubbles summarize actual tools without raw commands, paths, secrets or model reasoning',()=>{
 expect(toolActivity({name:'command_execution',command:'gh pr view 99 --repo private/company'},'Working')).toBe('Inspecting the pull request');
 expect(toolActivity({name:'Read',command:'/private/secret.env'},'Working')).toBe('Inspecting project files');
 expect(toolActivity({name:'Bash',command:'pnpm test -- --token secret'},'Working')).toBe('Running the required checks');
 expect(toolActivity({name:'mcp__slack__search'},'Working')).toBe('Checking Slack details');
 expect(toolActivity({name:'unknown'},'Checking task ownership')).toBe('Checking task ownership');
 expect(toolActivity({name:'Bash',command:"until grep -q '^verify=' /private/tmp/verify-ci.txt; do sleep 2; done"},'Working')).toBe('Waiting for required check results');
 expect(toolActivity({name:'Bash',command:'pnpm run verify:ci'},'Working')).toBe('Running the required checks');
 expect(toolActivity({name:'Bash',command:'git merge --no-ff origin/main'},'Working')).toBe('Resolving branch conflicts');
 expect(toolActivity({name:'TaskOutput'},'Working')).toBe('Waiting for the running command');
});

test('Backlog conversation readback cannot masquerade as active ticket coordination',()=>{
 expect(workerActivity('pm','deferred-conversation','Brain','GH-70')).toBe('GH-70 · Reconciling an earlier message · Backlog deferred');
 expect(workerActivity('pm','conversation-readback','Brain')).toBe('Brain · Reading back an earlier request');
});
