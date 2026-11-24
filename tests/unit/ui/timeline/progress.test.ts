import { expect, it } from 'vitest';
import { createFixtureState } from '../../../browser/fixtures/office-data';
import { jiraQueueProgress } from '../../../../server/cec/queue-progress';
import { pmQueueItems, waitingOnlyOnPrerequisites } from '../../../../src/work/pm-queue';
import { ticketProgress } from '../../../../src/work/timeline/ticket-progress';
import { transitionKey } from '../../../../src/work/timeline/use-transitions';
import { ticketHistory } from '../../../../src/work/timeline/ticket-history';
import type { DeliveryRequest, StageResult, TicketJob } from '../../../../src/shared';

const now = new Date('2026-11-24T18:00:00Z');

it('projects the actual Jira route into another project without carrying the ticket history', () => {
    const {cec,brain} = createFixtureState().snapshots;
    const ticket = cec.tickets[1];
    Object.assign(ticket, {stage:'repair',activity:'working',approach:{plan:'none',review:'none',validation:'browser'}});
    const summaries = jiraQueueProgress(cec.project!, cec, now);
    cec.jiraQueueProgress = brain.jiraQueueProgress = summaries;
    const row = pmQueueItems(brain).find(r => r.key === ticket.key)!;
    const progress = ticketProgress(brain, 'cec', row.key, row);
    expect(progress).toMatchObject({owner:'Alex',next:'Retesting the fix',state:'working'});
    expect(ticketProgress(cec,'cec',ticket.key)).toEqual(progress);
    expect(summaries[0]).not.toHaveProperty('results');
    ticket.production = {doneAt:'2026-11-24T18:00:00Z'};
    brain.jiraQueueProgress = jiraQueueProgress(cec.project!, cec, now);
    expect(pmQueueItems(brain).some(r => r.key === ticket.key)).toBe(false);
});

it('retires prior intake when a staging-complete ticket no longer qualifies for production follow', () => {
    const {cec,brain} = createFixtureState(now.getTime()).snapshots;
    const ticket = cec.tickets[1];
    Object.assign(ticket,{stage:'complete',pilot:true});
    const review = {id:'old-intake',key:ticket.key,summary:ticket.summary,url:ticket.url,
        queuedAt:ticket.observedAt,startedAt:'',endedAt:'',status:'queued',workRequested:'manual',detail:'Old assignment',owner:'Morgan'} as const;
    brain.pmQueue = [{project:'cec',projectName:'CEC',review}];
    expect(pmQueueItems(brain).some(row => row.key === ticket.key)).toBe(true);
    const rows = () => {
        cec.jiraQueueProgress = brain.jiraQueueProgress = jiraQueueProgress(cec.project!,cec,now);
        return pmQueueItems(brain).filter(row => row.key === ticket.key);
    };
    expect(rows()).toEqual([]);
    ticket.results['staging-qa'] = ticket.results.implement;
    const commit = ticket.commit;
    ticket.commit = 'invalid';
    expect(rows()).toEqual([]);
    ticket.commit = commit;
    expect(rows()).toMatchObject([{group:'waiting',phase:'Verified on staging'}]);
    ticket.production = {since:'2026-11-20T18:00:00Z'};
    expect(rows()).toMatchObject([{group:'waiting'}]);
    for (const since of ['2026-10-25T18:00:00Z','2026-10-24T18:00:00Z']) {
        ticket.production.since = since;
        expect(rows()).toEqual([]);
        expect(ticketProgress(cec,'cec',ticket.key)).toMatchObject({state:'waiting',phase:'Verified on staging',next:''});
    }
});

it('projects live read-back for an outstanding Jira resume until the ticket advances', () => {
    const {cec,brain} = createFixtureState().snapshots;
    const ticket = cec.tickets[1];
    Object.assign(ticket,{stage:'qa',activity:'blocked',pilot:true,blocker:'Candidate needs fresh credentials'});
    const request: DeliveryRequest = {id:'resume',key:ticket.key,action:'resume-ticket',requestedAt:now.toISOString(),status:'queued',error:''};
    cec.deliveryQueue = [request];
    const read = () => {
        cec.jiraQueueProgress = brain.jiraQueueProgress = jiraQueueProgress(cec.project!,cec,now);
        const row = pmQueueItems(brain).find(r => r.project === 'cec' && r.key === ticket.key)!;
        const progress = ticketProgress(brain,'cec',ticket.key,row);
        expect(ticketProgress(cec,'cec',ticket.key)).toEqual(progress);
        return {row,progress};
    };
    expect(read()).toMatchObject({row:{group:'queued'},progress:{phase:'Resume queued · Verifying the change',
        owner:'Morgan',next:'Read back the current ticket and candidate before resuming'}});
    request.status = 'working';
    expect(read().progress.phase).toBe('Resume in progress · Verifying the change');
    ticket.activity = 'working';
    expect(read().progress.phase).toBe('Verifying the change');
    request.status = 'completed';
    ticket.activity = 'blocked';
    expect(read()).toMatchObject({row:{group:'stopped'},progress:{phase:'Blocked · Verifying the change',next:ticket.blocker}});
});

it('keeps the newest delivery in each project and distinguishes approvals, checks, and interruptions', () => {
    const {brain} = createFixtureState().snapshots;
    const job: TicketJob = {id:'new',key:'GH-17',stage:'lead-pr',status:'watching',pr:42,prUrl:'https://example.org/pull/42',
        head:'fixture',worktree:'',branch:'',steps:[],detail:'Checks running',requestedAt:'2026-11-10',
        stop:{kind:'provider-checks',at:now.toISOString()}};
    brain.teamQueue = [
        {project:'other',projectName:'Other',job:{...job,status:'completed'}},
        {project:'brain',projectName:'Brain',job:{...job,id:'old',status:'completed',requestedAt:'2026-10-20'}},
        {project:'brain',projectName:'Brain',job},
    ];
    const eligibility = {state:'waiting',reason:'Work is watching',owner:'Morgan',nextCheckAt:null} as const;
    brain.progression = [{work:{kind:'delivery',projectId:'brain',id:job.id},stage:job.stage,rank:1,enqueuedAt:job.requestedAt,eligibility}];
    const rows = () => pmQueueItems(brain).filter(r => r.project === 'brain' && r.key === job.key);
    const read = () => ticketProgress(brain,'brain',job.key,rows()[0]);
    expect(rows()).toMatchObject([{group:'waiting',prUrl:job.prUrl}]);
    expect(waitingOnlyOnPrerequisites(rows())).toBe(false);
    expect(read()).toMatchObject({phase:'Waiting for GitHub checks',state:'waiting'});
    job.prerequisites = [{target:{kind:'delivery',projectId:'brain',id:'upstream'},condition:'job-completed',evidence:'',observedAt:''}];
    brain.progression[0].eligibility = {...eligibility,reason:'Waiting for verified completion of upstream',nextCheckAt:now.toISOString()};
    expect(waitingOnlyOnPrerequisites(rows())).toBe(true);
    expect(read().next).toContain('Waiting for verified completion of upstream');
    job.prerequisites = [];
    brain.progression[0].eligibility = eligibility;
    job.mergeApprovalRequired = true;
    expect(read()).toMatchObject({phase:'Needs your approval',owner:'You',next:'Review PR #42'});
    job.mergeApprovalRequired = false;
    job.status = 'interrupted';
    brain.progression = [];
    expect(read().state).toBe('blocked');
    expect(ticketProgress(brain,'other',job.key).state).toBe('passed');
    job.status = 'completed';
    expect(rows()).toEqual([]);
    expect(read().phase).toBe('Delivery complete');
});

it('hands GitHub repair work to the worker for each visit and follows the ordinary recorded route', () => {
    const {cec,brain} = createFixtureState().snapshots;
    const job: TicketJob = {id:'repair',key:'GH-17',stage:'update-base',status:'working',requestedAt:now.toISOString(),
        detail:'',head:'fixture',worktree:'',branch:'',pr:0,prUrl:'',
        repairReason:'source',repairCycle:{owner:'developer',findingAttempts:{},attempts:1,pendingFindingIds:['F-1'],
            sourceStage:'validate',sourceHead:'previous',phase:'repair'},steps:[]};
    brain.teamQueue = cec.teamQueue = [{project:'brain',projectName:'Brain',job}];
    const read = (snapshot = brain) => ticketProgress(snapshot,'brain',job.key,pmQueueItems(snapshot).find(r => r.key === job.key));
    expect(read()).toMatchObject({owner:'Alex',next:'Independent review and verification of the repaired head follow.'});
    job.stage = 'review';
    job.repairCycle!.phase = 'review';
    expect(read().owner).toBe('Sam');
    job.stage = 'validate';
    job.repairCycle!.phase = 'verify';
    expect(read().owner).toBe('Riley');
    job.stage = 'implement';
    job.repairReason = undefined;
    job.repairCycle = undefined;
    job.approach = {plan:'none',review:'none',validation:'developer-checks',checks:[],reason:'Small change'};
    expect(read(cec)).toEqual(read(brain));
    expect(read().next).toBe('Prepare the draft PR');
    expect(job.skippedStages).toBeUndefined();
});

it('retains repeated visits, skipped stages and undated results without creating heartbeat transitions', () => {
    const {cec} = createFixtureState().snapshots;
    const ticket = cec.tickets[1];
    cec.events = ['stage-started','fix-requested','stage-started'].map((kind,i) => ({kind,id:i,ticket:ticket.key,at:new Date(i*1000).toISOString(),message:'QA visit'}));
    const rows = ticketHistory(cec,ticket);
    expect(rows.filter(r => /^event:[012]$/.test(r.id)).map(r => [r.id,r.mark])).toEqual([
        ['event:0','start'],['event:1','repair'],['event:2','start'],
    ]);
    expect(rows.some(r => r.mark === 'skipped' && !r.at)).toBe(true);
    const signature = transitionKey(ticketProgress(cec,'cec',ticket.key));
    cec.serverTime = new Date().toISOString();
    ticket.observedAt = cec.serverTime;
    expect(transitionKey(ticketProgress(cec,'cec',ticket.key))).toBe(signature);
});

it('uses Jira evidence and decisions to date history and keeps a recent QA failure visible', () => {
    const {cec} = createFixtureState(now.getTime()).snapshots;
    const ticket = cec.tickets[1];
    const at = (seconds: number) => new Date(now.getTime() + seconds*1000).toISOString();
    cec.events = Array.from({length:5},(_,i) => ({kind:'stage-started',id:i,ticket:ticket.key,at:at(i+1),message:'Stage visit ' + i}));
    ticket.results.qa = {...ticket.results.implement!, outcome:'failed',summary:'Focus check failed',
        evidence:[{...ticket.evidence[0],observedAt:at(6)},{...ticket.evidence[0],observedAt:at(2)}]};
    ticket.decisions = [{role:'pm',stage:'understand',at:at(3),approach:{plan:'none',review:'none',validation:'browser',checks:[],reason:'Fixture'}}];
    const rows = ticketHistory(cec,ticket);
    const previous = rows.findIndex(row => row.id === 'event:4');
    const failure = rows.findIndex(row => row.detail === 'Focus check failed');
    expect(failure).toBeGreaterThan(previous);
    expect(rows.slice(-5)).toContainEqual(expect.objectContaining({at:at(6),mark:'blocked',detail:'Focus check failed'}));
    expect(rows.find(r => r.mark === 'skipped')?.at).toBe(at(3));
    expect(rows.slice(-2).map(r => r.at)).toEqual([undefined,undefined]);
});

it('keeps both validation visits and records the GitHub repair handoff and gate refusal', () => {
    const {brain,cec} = createFixtureState(now.getTime()).snapshots;
    const result: StageResult = {...cec.tickets[1].results.implement!,summary:'Validation worker passed'};
    const ticket = brain.tickets[0];
    const at = (seconds: number) => new Date(now.getTime() + seconds*1000).toISOString();
    const job: TicketJob = {id:'deliver',key:ticket.key,stage:'validate',status:'working',requestedAt:at(0),
        detail:'',head:'fixture',worktree:'',branch:'',pr:0,prUrl:'',
        qaGateRefusal:{step:0,at:at(1),inputSha256:'fixture'},
        steps:[{stage:'validate',result},{stage:'validate',result,workerId:'retest'}]};
    brain.events = [{id:11,kind:'delivery-repair-requested',at:at(2),role:'developer',ticket:ticket.key,message:'Repair queued for Alex'}];
    brain.workLog = [{...brain.workLog![0],id:'retest',ticket:ticket.key,endedAt:at(3)}];
    expect(ticketHistory(brain,ticket,job)).toMatchObject([
        {id:'deliver:0',label:'Validation · QA evidence gate refused',detail:result.summary,mark:'blocked',at:at(1)},
        {id:'event:11',mark:'repair',at:at(2)},
        {id:'deliver:1',label:'validate · passed',detail:result.summary,mark:'passed',at:at(3)},
    ]);
});

it('keeps the recorded Jira start request and verified closeout after their events age out', () => {
    const {cec} = createFixtureState(now.getTime()).snapshots;
    const ticket = cec.tickets[1];
    const requestAt = '2026-11-20T18:00:00Z', doneAt = now.toISOString();
    cec.deliveryQueue = [
        {id:'start',key:ticket.key,action:'start-pilot',requestedAt:requestAt,status:'completed',error:'',operator:true},
        {id:'other',key:'CEC-999',action:'start-pilot',requestedAt:requestAt,status:'completed',error:''},
    ];
    ticket.production = {doneAt};
    cec.events = [];
    const milestones = () => ticketHistory(cec,ticket).filter(row => row.id.startsWith('request:') || row.id === 'production-done' || row.id.startsWith('event:'));
    const expected = [
        {id:'request:start',at:requestAt,label:'Delivery requested',mark:'start'},
        {id:'production-done',at:doneAt,label:'Verified Jira closeout',mark:'passed'},
    ];
    expect(milestones()).toEqual(expected);
    cec.events = [
        {id:12,kind:'delivery-queued',at:'2026-11-20T18:00:01Z',ticket:ticket.key,message:ticket.key + ' queued for implementation.'},
        {id:13,kind:'production-done',at:doneAt,ticket:ticket.key,message:ticket.key + ' and its sub-tasks are Done in Jira: it is in production.'},
    ];
    expect(milestones()).toEqual(expected);
});
