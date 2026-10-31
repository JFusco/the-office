import {githubStageLabels} from '../../src/agent-activity';
import { STAGE_LABELS, type Role, type Stage } from '../../src/shared';

const labels:Record<string,string>={
  ...githubStageLabels,
  'deferred-conversation':'Reconciling an earlier message · Backlog deferred',
  'conversation-readback':'Reading back an earlier request',
  'assignment-review':'Checking task ownership and investigating the assignment',
  intake:'Checking the project mailbox',readback:'Checking ticket ownership',
  transition:'Updating ticket status',reconcile:'Verifying previous work',
  'follow-up':'Checking CMS issues and pull requests','vendor-review':'Reviewing CMS vendor updates',
  proposal:'Preparing the CMS update','proposal-review':'Reviewing the CMS update',
  'package-verification':'Verifying the CMS package','maintenance-readback':'Reading back previous maintenance',
  'maintenance-blocker':'Investigating the catalog blocker and routing its repair',
  'closeout-readback':'Verifying completed closeout and rejected attempts',
  'slack-send':'Sending your Slack message','slack-verify':'Verifying Slack delivery',
};
export function workerActivity(role:Role,stage:string,project:string,ticket=''){
  const label=stage==='conversation'
    ?({pm:'Coordinating your request',cto:'Reviewing goals and priorities',developer:'Reviewing your development request',lead:'Reviewing your changes',qa:'Reviewing verification needs',it:'Checking connections and recovery'})[role]
    :labels[stage]||(Object.hasOwn(STAGE_LABELS,stage)?STAGE_LABELS[stage as Stage]:'Working on your request');
  return `${ticket||project} · ${label}`;
}

// Fixed summaries of observed tool calls only. Never surface prompts, raw
// commands, tool output, private paths, or model reasoning in a speech bubble.
export function toolActivity(tool:{name?:string;command?:string},fallback:string):string{
  const name=(tool.name||'').toLowerCase(),command=(tool.command||'').slice(0,8000).toLowerCase(),text=`${name} ${command}`;
  if(/slack/.test(text))return /send_message|postmessage/.test(text)?'Sending the approved Slack update':'Checking Slack details';
  if(/worklog/.test(text))return 'Checking time entries';
  if(/(?:verify[:_-]ci|test:tooling|verify-ci)/.test(command))return /(?:until|tail|grep|taskoutput)/.test(text)?'Waiting for required check results':'Running the required checks';
  if(/taskoutput|write_stdin/.test(name))return 'Waiting for the running command';
  if(/git\s+merge(?:\s|$)/.test(command))return 'Resolving branch conflicts';
  if(/build-graph|wiki.*(?:generate|regenerate)/.test(command))return 'Regenerating the wiki graph';
  if(/(?:gh.*(?:run|actions)|check-runs|pipelines|build.*show)/.test(text))return 'Checking build results';
  if(/(?:gh.*(?:pr|pulls)|pullrequest)/.test(text))return 'Inspecting the pull request';
  if(/(?:jira|workitem|gh.*issues)/.test(text))return 'Reading ticket details';
  if(/(?:projectv2|gh.*project)/.test(text))return 'Checking the project board';
  if(/(?:vitest|playwright|pytest|pnpm.*(?:test|check|build)|npm.*(?:test|check|build))/.test(text))return 'Running the required checks';
  if(/(?:git.*diff|git.*show)/.test(text))return 'Reviewing the changes';
  if(/(?:git.*(?:status|rev-parse|worktree|branch))/.test(text))return 'Checking branch and ownership';
  if(/(?:write|edit|apply_patch)/.test(name))return 'Updating the scoped files';
  if(/(?:read|glob|grep|rg |cat |sed )/.test(text))return 'Inspecting project files';
  if(/(?:web_search|search_query|browse|fetch)/.test(name))return 'Checking source documentation';
  return fallback;
}
