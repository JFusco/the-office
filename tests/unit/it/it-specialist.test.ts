import { GitHubDelivery } from '../../../server/delivery/pipeline/github-delivery';
import { expect, test, vi } from 'vitest';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { initialSnapshot } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';
import { syncOutbox } from '../../../server/conversations/outbox';
function setup() {
    const state = initialSnapshot();
    state.project = projectById('brain');
    state.coordination = coordination();
    const store = { state, project: state.project, clock: { now: () => new Date() }, save: vi.fn(), emit: vi.fn() };
    const coordinator = { poll: vi.fn(async () => { }), retryCheckpoint: vi.fn() }, engine = { observe: vi.fn(async () => { }) };
    const offices = { entries: new Map([['brain', { store, engine, coordinator }]]) };
    const health = { report: vi.fn(async () => ({ checkedAt: '', context: '', services: [{ id: 'github', name: 'GitHub', status: 'connected', detail: 'Verified', checkedAt: '' }] })) };
    return { state, store, coordinator, engine, health, it: new ITSpecialist(offices as any, health as any) };
}
test('IT enqueues durable read recovery and does not execute it outside the scheduler', async () => {
    const a = setup(), now = new Date('2026-10-28T21:00:00Z');
    a.state.coordination!.listener.error = 'connection reset';
    await a.it.tick(now);
    expect(a.coordinator.poll).not.toHaveBeenCalled();
    expect(a.state.coordination!.requests).toHaveLength(1);
    expect(a.state.it!.status).toBe('retrying');
    await a.it.tick(new Date(now.getTime() + 60000), true);
    expect(a.state.coordination!.requests).toHaveLength(1);
    expect(a.state.it!.recoveries['assignment-listener'].attempts).toBe(1);
    a.state.coordination!.requests![0].status = 'completed';
    a.state.coordination!.listener.error = '';
    await a.it.tick(new Date(now.getTime() + 120000), true);
    expect(a.state.it!.recoveries['assignment-listener'].status).toBe('resolved');
});
test('failed queued reads retain bounded retry ownership with Morgan', async () => {
    const a = setup();
    a.state.github = { status: 'blocked', error: 'HTTP 503', observedAt: '', issues: [], prs: [], runs: [] };
    for (const ms of [0, 60000, 180000, 600000]) {
        for (const request of a.state.coordination!.requests || [])
            request.status = 'blocked';
        await a.it.tick(new Date(1793221200000 + ms), true);
    }
    expect(a.engine.observe).not.toHaveBeenCalled();
    expect(a.state.coordination!.requests).toHaveLength(3);
    expect(a.state.it!.recoveries['project-progress'].status).toBe('needs-human');
    expect(a.state.it!.reports.at(-1)!.followUps[0]).toMatchObject({ owner: 'Morgan' });
});
test('unknown provider checks never request a login after retries, while confirmed authentication failures do', async () => {
    const a = setup();
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'anthropic', name: 'Claude', status: 'unknown', detail: 'Status check timed out', checkedAt: '', nextStep: 'Run /login' }] } as any);
    for (const ms of [0, 60000, 180000, 600000])
        await a.it.tick(new Date(1793221200000 + ms), true);
    expect(a.state.it!.reports.at(-1)!.followUps).toEqual([expect.objectContaining({ owner: 'Morgan' })]);
    syncOutbox(a.state);
    expect(a.state.outbox.filter(o => o.status === 'open')).toEqual([]);
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'anthropic', name: 'Claude', status: 'disconnected', detail: 'Not logged in', checkedAt: '', nextStep: 'Run /login' }] } as any);
    await a.it.tick(new Date(1793222000000), true);
    syncOutbox(a.state);
    expect(a.state.outbox.find(o => o.status === 'open')?.detail).toContain('Run /login');
});
test('a listener recovery owned by IT resolves its duplicate human outbox item', async () => {
    const a = setup();
    a.state.coordination!.listener.error = 'gh read timed out';
    syncOutbox(a.state);
    expect(a.state.outbox.some(o => o.status === 'open')).toBe(true);
    await a.it.tick();
    syncOutbox(a.state);
    expect(a.state.outbox.filter(o => o.status === 'open')).toEqual([]);
    expect(a.state.it!.reports.at(-1)!.followUps[0].owner).toBe('IT');
});
test('IT never retries auth or ambiguous writes and respects paused project work', async () => {
    const a = setup();
    a.state.coordination!.listener.error = 'Permission denied; previous write uncertain';
    a.health.report.mockResolvedValue({ checkedAt: '', context: '', services: [{ id: 'github', name: 'GitHub', status: 'disconnected', detail: 'Login unavailable', checkedAt: '', nextStep: 'Run gh auth status in the Office service account.' }] } as any);
    await a.it.tick();
    expect(a.coordinator.poll).not.toHaveBeenCalled();
    expect(a.engine.observe).not.toHaveBeenCalled();
    expect(a.state.it!.reports.at(-1)!.followUps.some(f => f.detail.includes('gh auth status'))).toBe(true);
    a.state.paused = true;
    a.state.coordination!.listener.error = 'connection reset';
    await a.it.tick(new Date(Date.now() + 60000), true);
    expect(a.coordinator.poll).not.toHaveBeenCalled();
});
test('IT restores only eligible Ready ownership reads, with a three-attempt cap and no Backlog pickup', async () => {
    const a = setup();
    const inventory = { complete: true, fresh: true };
    (a.it as any).offices.sessions = { forProject: () => inventory, refresh: vi.fn() };
    a.state.coordination!.pickup = { enabled: true, status: 'Ready' };
    a.state.coordination!.listener.assigned = [{ key: 'GH-91', pickupStatus: 'Ready' }, { key: 'GH-70', pickupStatus: 'Backlog' }] as any;
    const review = (key: string) => ({ id: key, key, status: 'blocked', detail: 'Office must restore complete session visibility; inventory unavailable', queuedAt: '' });
    a.state.coordination!.listener.reviews = [review('GH-91'), review('GH-70')] as any;
    const r = a.state.coordination!.listener.reviews[0];
    for (let i = 0; i < 4; i++) {
        r.status = 'blocked';
        r.detail = 'Office must restore complete session visibility; inventory unavailable';
        await a.it.tick(new Date(1793221200000 + i * 60000), true);
    }
    expect(r.itRecoveryAttempts).toBe(3);
    expect(r.status).toBe('blocked');
    expect(a.state.coordination!.listener.reviews[1].status).toBe('blocked');
    expect(a.state.it!.reports.at(-1)!.followUps.some(f => f.owner === 'Morgan')).toBe(true);
});
test('IT queues read-only closeout reconciliation only after the shared worker is free', async () => {
    const a = setup(), job: any = { id: 'done', key: 'GH-255', stage: 'closeout', status: 'blocked', detail: 'Effect needs read-back', steps: [{ stage: 'closeout', result: { outcome: 'passed' } }] };
    a.state.coordination!.jobs = [job];
    Object.assign(a.engine, { busy: false, agents: { active: new Map([['pm', {}]]) } });
    const readback = vi.spyOn(GitHubDelivery.prototype, 'reconcileCloseout').mockImplementation(async () => { expect((a.engine as any).busy).toBe(true); job.status = 'completed'; });
    try {
        await a.it.tick(new Date('2026-10-29T01:00Z'), true);
        expect(readback).not.toHaveBeenCalled();
        (a.engine as any).agents.active.clear();
        await a.it.tick(new Date('2026-10-29T01:01Z'), true);
        expect(readback).not.toHaveBeenCalled();
        expect(a.state.coordination!.requests?.[0]).toMatchObject({ action: 'reconcile-closeout', key: 'GH-255', status: 'queued' });
        expect(job.status).toBe('blocked');
        expect((a.engine as any).busy).toBe(false);
        expect(a.state.it!.reports.at(-1)!.actions[0]).toContain('queued');
    }
    finally {
        readback.mockRestore();
    }
});

test('ordinary operational recovery stays in IT history without daytime CTO or leadership reports',async()=>{
 const a=setup(),existing={id:'existing-goal-report',requestId:'human-goal-request',summary:'Previously accepted goal update',ticket:'',createdAt:'2026-10-29T21:00:00Z'};
 a.state.leadershipReports=[existing];a.state.coordination!.listener.error='connection reset';
 await a.it.tick(new Date('2026-10-30T14:00:00Z'),true);
 expect(a.state.it!.reports).toHaveLength(1);expect(a.state.it!.reports[0].actions).not.toHaveLength(0);
 expect(a.state.it!.reports[0].notified).toEqual(['pm','developer','lead','qa']);expect(a.state.leadershipReports).toEqual([existing]);
 expect(a.state.it!.services).toEqual([expect.objectContaining({id:'github',status:'connected'})]);
 expect(a.store.emit).toHaveBeenCalledWith('it-report',expect.stringContaining('Morgan, Alex, Sam and Riley'),'pm');
});

// Qualification retains its own native/source guards. These fixtures exercise IT's
// real durable intent lifecycle when that qualification temporarily disappears.
function activationFixture(source=false) {
 const a=setup(),job:any={id:'original-job',key:'GH-67',stage:'scope-repair',status:'blocked',detail:'Original readback unresolved',head:'a'.repeat(40),steps:[],implementationContinuation:{phase:source?'repair':'activation'}};
 const original:any={id:'original-worker',requestId:job.id,ticket:job.key,lane:'delivery',claimId:'original-claim',role:'developer',stage:'github-scope-repair',status:'failed'};
 if(source)job.implementationContinuation.sourceConfig={attempts:1,maxAttempts:2,attemptOpen:true,reservation:{claimId:original.claimId,head:job.head,phase:'repair'}};
 a.state.coordination!.jobs=[job];a.state.workLog=[original];Object.assign(a.engine,{busy:false,agents:{active:new Map()}});
 const key=`${source?'source-config':'activation'}-readback:${job.id}:${original.id}`;
 const request=(id:string,status='blocked',extra={})=>({id,action:'reconcile-activation',key:job.key,head:original.id,lane:'delivery',status,detail:'Original saved readback',createdAt:'2026-10-30T23:00:00Z',...extra} as any);
 return {...a,job,original,key,request};
}
import * as activationRecovery from '../../../server/delivery/recovery/implementation/activation-recovery';
test('IT keeps a resolved activation readback resolved when a newer activation worker replaces its original',async()=>{
 const a=activationFixture(),recovery={attempts:1,status:'resolved' as const,requestId:'completed',nextAt:'',detail:'Original readback completed'};
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:structuredClone(recovery)}};
 a.state.coordination!.requests=[a.request('completed','completed')];
 a.state.workLog!.push({...a.original,id:'newer-worker',claimId:'newer-claim',status:'running'});
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue(undefined);
 try{
  const requests=structuredClone(a.state.coordination!.requests);await a.it.tick(new Date('2026-10-30T23:35Z'),true);
  expect(a.state.it.recoveries[a.key]).toEqual(recovery);expect(a.state.coordination!.requests).toEqual(requests);
  expect(a.state.it.reports.at(-1)!.followUps.some(f=>f.id===a.key)).toBe(false);
 }finally{activation.mockRestore();}
});
test.each([false,true])('IT retains the exact original %s readback budget while its reader runs, then increments without refund',async source=>{
 const a=activationFixture(source);let eligible=true;
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockImplementation(()=>!source&&eligible?{}as any:undefined),config=vi.spyOn(activationRecovery,'sourceConfigurationRecoveryTarget').mockImplementation(()=>source&&eligible?a.original.id:undefined);
 try {
  await a.it.tick(new Date('2026-10-30T23:00Z'),true);
  const first=a.state.coordination!.requests![0];expect(first).toMatchObject({action:'reconcile-activation',head:a.original.id,status:'queued'});
  first.status='working';eligible=false;
  await a.it.tick(new Date('2026-10-30T23:01Z'),true);
  expect(a.state.it!.recoveries[a.key]).toMatchObject({attempts:1,status:'retrying',requestId:first.id});
  expect(a.state.it!.reports.at(-1)!.actions.join(' ')).not.toContain('failure cleared');
  first.status='blocked';eligible=true;await a.it.tick(new Date('2026-10-30T23:02Z'),true);
  expect(a.state.coordination!.requests).toHaveLength(2);expect(a.state.it!.recoveries[a.key]).toMatchObject({attempts:2,status:'retrying'});
  expect(a.engine.observe).not.toHaveBeenCalled();
 }finally{activation.mockRestore();config.mockRestore();}
});
test.each([false,true].flatMap(source=>['paused','draining','ineligible'].map(control=>({source,control}))))('IT repairs historical original-readback undercounts without dispatch while %j',async({source,control})=>{
 const a=activationFixture(source);a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'third',nextAt:'',detail:'Raw historical diagnostic'}}};
 a.state.coordination!.requests=[a.request('first'),a.request('second'),a.request('third','queued')];
 if(control==='paused')a.state.paused=true;if(control==='draining')a.state.draining=true;
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue(undefined),config=vi.spyOn(activationRecovery,'sourceConfigurationRecoveryTarget').mockReturnValue(undefined);
 try {
  const before=structuredClone(a.state.coordination!.requests);await a.it.tick(new Date('2026-10-30T23:35Z'),true);
  expect(a.state.coordination!.requests).toEqual(before);
  expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'retrying',requestId:'third',detail:'Raw historical diagnostic'});
  expect(a.state.it.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({id:a.key,owner:'IT'}));
  a.state.coordination!.requests![2].status='blocked';await a.it.tick(new Date('2026-10-30T23:36Z'),true);
  expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'needs-human',requestId:'third'});
  expect(a.state.it.reports.at(-1)!.status).toBe('needs-attention');
  expect(a.state.it.reports.at(-1)!.followUps).toContainEqual(expect.objectContaining({id:a.key,owner:'Morgan'}));
  expect(a.state.coordination!.requests).toHaveLength(3);
 }finally{activation.mockRestore();config.mockRestore();}
});
test.each([false,true])('IT keeps exhausted %s readback budgets through repeated ticks and resolves only actual progress',async source=>{
 const a=activationFixture(source);a.state.coordination!.requests=[a.request('first'),a.request('second'),a.request('third')];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'third',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockImplementation(()=>!source?{}as any:undefined),config=vi.spyOn(activationRecovery,'sourceConfigurationRecoveryTarget').mockReturnValue(source?a.original.id:undefined);
 try {
  for(const minute of [35,36])await a.it.tick(new Date(`2026-10-30T23:${minute}Z`),true);
  expect(a.state.coordination!.requests).toHaveLength(3);expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'needs-human',requestId:'third'});
  a.job.status='completed';activation.mockReturnValue(undefined);config.mockReturnValue(undefined);
  await a.it.tick(new Date('2026-10-30T23:37Z'),true);
  expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:3,status:'resolved',requestId:'third'});
 }finally{activation.mockRestore();config.mockRestore();}
});
test.each([{key:'GH-foreign'},{head:'foreign-worker'},{action:'reconcile-implementation'}])('foreign intent identity %j cannot consume or dedupe the original budget',async extra=>{
 const a=activationFixture();a.state.coordination!.requests=[a.request('foreign','queued',extra)];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'old',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue({}as any);
 try{await a.it.tick(new Date('2026-10-30T23:35Z'),true);expect(a.state.it.recoveries[a.key].attempts).toBe(2);expect(a.state.coordination!.requests).toHaveLength(2);expect(a.state.coordination!.requests![1]).toMatchObject({head:a.original.id,key:a.job.key,action:'reconcile-activation',lane:'delivery'});}finally{activation.mockRestore();}
});
test('foreign owning project and original worker cannot reconstruct an original Brain recovery count',async()=>{
 const a=activationFixture();a.state.paused=true;a.store.project={...a.store.project,id:'other'};a.state.project=a.store.project;
 a.state.coordination!.requests=[a.request('first'),a.request('second')];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'needs-human',requestId:'old',nextAt:'',detail:'Original error'}}};
 await a.it.tick(new Date('2026-10-30T23:35Z'),true);expect(a.state.it.recoveries[a.key].attempts).toBe(1);
});

test('a matching non-delivery intent is neither adopted nor duplicated',async()=>{
 const a=activationFixture();a.state.coordination!.requests=[a.request('foreign','queued',{lane:'operations'})];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'old',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue({}as any);
 try{await a.it.tick(new Date('2026-10-30T23:35Z'),true);expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:1,status:'needs-human',requestId:'old'});expect(a.state.coordination!.requests).toHaveLength(1);}finally{activation.mockRestore();}
});

test('an already completed exact readback is not refunded or counted again while original qualification remains',async()=>{
 const a=activationFixture();a.state.coordination!.requests=[a.request('completed','completed')];
 a.state.it={checkedAt:'',nextCheckAt:'',status:'monitoring',reports:[],services:[],recoveries:{[a.key]:{attempts:1,status:'resolved',requestId:'completed',nextAt:'',detail:'Original error'}}};
 const activation=vi.spyOn(activationRecovery,'savedActivationFailure').mockReturnValue({}as any);
 try{for(const minute of [35,36])await a.it.tick(new Date(`2026-10-30T23:${minute}Z`),true);expect(a.state.it.recoveries[a.key]).toMatchObject({attempts:1,status:'needs-human',requestId:'completed'});expect(a.state.coordination!.requests).toHaveLength(1);}finally{activation.mockRestore();}
});
