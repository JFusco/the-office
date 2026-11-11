import { afterEach, expect, test, vi } from 'vitest';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fakeGitHub, cleanupFakes, BASE } from '../support/fake-github';
import { stoppedBaseCheckout } from '../../../../server/delivery/recovery/stopped-base-checkout';

const facts=vi.hoisted(()=>({head:'b'.repeat(40),remoteHead:'',version:'provider',reads:0,
    driftAt:'',kind:'discussion',localClear:true,localDrift:false}));
vi.mock('../../../../server/delivery/recovery/stopped-base-review-context',()=>({
    stoppedBaseReviewContext:async()=>({provider:{pr:{head:facts.head,branch:'bot/repair'},version:'provider'},
        assertCurrent:()=>{if(!facts.localClear)throw new Error('Local ownership changed');}}),
}));
vi.mock('../../../../server/delivery/recovery/stopped-base-provider',()=>({
    readStoppedBaseProviderContext:async()=>{
        facts.reads++;
        if(facts.driftAt==='before-clone'&&facts.reads===2)facts.version='changed-discussion';
        if(facts.localDrift)facts.localClear=false;
        return {pr:{head:facts.remoteHead},version:facts.version};
    },
}));
vi.mock('../../../../server/delivery/recovery/stopped-base-disposition',async original=>({
    ...await original<typeof import('../../../../server/delivery/recovery/stopped-base-disposition')>(),
    stoppedBaseUpdateResolved:()=>true,
}));
afterEach(()=>{vi.restoreAllMocks();cleanupFakes();});

function fixture(partial=false){
    const f=fakeGitHub(),job=f.candidate({stage:'lead-pr',status:'blocked',
        repairCycle:{owner:'developer',attempts:6,findingAttempts:{F1:2},pendingFindingIds:['F1'],phase:'review',sourceStage:'lead-pr',sourceHead:'a'.repeat(40)}});
    Object.assign(facts,{remoteHead:facts.head,version:'provider',reads:0,driftAt:'',kind:'discussion',localClear:true,localDrift:false});
    const old=job.worktree,oldHead=job.head,budget=structuredClone(job.repairCycle);
    job.stoppedBaseUpdate={originalWorkId:'original',phase:'checkout',providerVersion:'provider',
        handoff:{head:facts.head,providerVersion:'provider',workerId:'handoff',resultSha256:'receipt'},
        preservedCandidate:{head:oldHead,branch:job.branch,worktree:old}} as any;
    job.worktree='';
    const hooks=resolve(f.repo,'.git','hooks');mkdirSync(hooks,{recursive:true});
    const mutations:string[]=[];
    let hooksConfigured=false;
    const drift=()=>{if(facts.kind==='head')facts.remoteHead='c'.repeat(40);else facts.version='changed-discussion';};
    const execute=vi.fn(async(program:string,args:string[],options:any={})=>{
        const argv=args[0]==='--no-optional-locks'?args.slice(1):args;
        const path=options.cwd,repair=job.stoppedBaseUpdate!.checkout;
        if(program==='git'&&argv[0]==='rev-parse'&&argv.includes('--absolute-git-dir'))
            return [resolve(path,'.git'),path,resolve(path,'.git/index')].join('\n');
        if(program==='git'&&argv[0]==='rev-parse'&&argv.includes('--git-path'))
            return path===f.repo?hooks:repair!.hooksPath!;
        if(program==='git'&&argv[0]==='remote')return 'https://github.com/'+f.store.project.repository+'.git';
        if(program==='git'&&argv[0]==='clone'){
            mutations.push('clone');
            const clone=args.at(-1)!;mkdirSync(resolve(clone,'.git'),{recursive:true});
            if(partial)throw new Error('Partial clone retained');
            writeFileSync(resolve(clone,'.git/HEAD'),'ref: refs/heads/main\n');
            writeFileSync(resolve(clone,'.git/config'),'[core]\n bare = false\n');
            if(facts.driftAt==='clone')drift();
            return '';
        }
        if(program==='git'&&argv[0]==='config'&&argv[1]==='--local')
            return 'core.bare\nfalse\0'+(hooksConfigured?'core.hookspath\n'+repair!.hooksPath+'\0':'');
        if(program==='git'&&argv[0]==='config'){
            mutations.push('config');hooksConfigured=true;
            if(facts.driftAt==='config')drift();
            return '';
        }
        if(program==='git'&&argv[0]==='checkout'){
            mutations.push('checkout');Object.assign(f.state.local,{head:argv[3],branch:argv[2],dirty:false});
            writeFileSync(resolve(path,'package.json'),'{}');
            return '';
        }
        if(program==='git'&&argv[0]==='for-each-ref')
            return ['refs/heads/main\0'+BASE+'\0','refs/remotes/origin/HEAD\0'+BASE+'\0refs/remotes/origin/main','refs/remotes/origin/main\0'+BASE+'\0'].join('\n');
        return f.execute(program,args,options);
    });
    f.delivery.execute=execute;
    return {...f,job,old,oldHead,budget,mutations,execute,run:()=>stoppedBaseCheckout(f.delivery,job)};
}

test('a partial clone is retained without replaying clone or replacing the original budget',async()=>{
    const f=fixture(true);
    await expect(f.run()).rejects.toThrow('Partial clone retained');
    const path=f.job.stoppedBaseUpdate!.checkout!.worktree!;
    await expect(f.run()).rejects.toThrow();
    expect(f.mutations).toEqual(['clone']);expect(existsSync(path)).toBe(true);expect(existsSync(f.old)).toBe(true);
    expect(f.job.head).toBe(f.oldHead);expect(f.job.worktree).toBe('');expect(f.job.repairCycle).toEqual(f.budget);
});

test('a changed prospective head blocks before clone reservation or dispatch',async()=>{
    const f=fixture();f.job.stoppedBaseUpdate!.handoff!.head='c'.repeat(40);
    await expect(f.run()).rejects.toThrow('Passed exact-head');
    expect(f.mutations).toEqual([]);expect(f.job.stoppedBaseUpdate!.checkout).toBeUndefined();
});

test('provider drift at the clone boundary prevents dispatch and cannot recreate the reserved checkout',async()=>{
    const f=fixture();facts.driftAt='before-clone';
    await expect(f.run()).rejects.toThrow('provider context changed');
    await expect(f.run()).rejects.toThrow();
    expect(f.mutations).toEqual([]);expect(existsSync(f.old)).toBe(true);
    expect(f.job.stoppedBaseUpdate!.candidateBinding).toBeUndefined();
});

test.each(['head','discussion'])('provider %s drift after clone stops config and checkout and retains both clones',async kind=>{
    const f=fixture();facts.driftAt='clone';facts.kind=kind;
    await expect(f.run()).rejects.toThrow('provider context changed');
    const path=f.job.stoppedBaseUpdate!.checkout!.worktree!;
    await expect(f.run()).rejects.toThrow('provider context changed');
    expect(f.mutations).toEqual(['clone']);expect(existsSync(path)).toBe(true);expect(existsSync(f.old)).toBe(true);
    expect(f.job.head).toBe(f.oldHead);expect(f.job.worktree).toBe('');expect(f.job.repairCycle).toEqual(f.budget);
    expect(f.job.stoppedBaseUpdate!.candidateBinding).toBeUndefined();
});

test('discussion drift after config stops checkout at its own mutation boundary',async()=>{
    const f=fixture();facts.driftAt='config';
    await expect(f.run()).rejects.toThrow('provider context changed');
    expect(f.mutations).toEqual(['clone','config']);expect(f.job.head).toBe(f.oldHead);
});

test('local ownership is checked again after the awaited provider read',async()=>{
    const f=fixture();facts.localDrift=true;
    await expect(f.run()).rejects.toThrow('Local ownership changed');
    expect(f.mutations).toEqual([]);expect(f.job.stoppedBaseUpdate!.candidateBinding).toBeUndefined();
});

test('unchanged fences bind a distinct exact-head candidate using the real setup and verification helpers',async()=>{
    const f=fixture();await f.run();
    expect(f.mutations).toEqual(['clone','config','checkout']);
    expect(f.job.head).toBe(facts.head);expect(f.job.worktree).not.toBe(f.old);expect(existsSync(f.old)).toBe(true);
    expect(f.job.stage).toBe('review');expect(f.job.status).toBe('queued');expect(f.job.repairCycle).toMatchObject(f.budget!);
    expect(f.job.stoppedBaseUpdate!.candidateBinding).toBeDefined();
});
