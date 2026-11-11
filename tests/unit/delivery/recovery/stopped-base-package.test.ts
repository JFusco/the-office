import { afterEach, expect, test } from 'vitest';
import { fakeGitHub, cleanupFakes } from '../support/fake-github';
import { stoppedBasePackageInstruction } from '../../../../server/delivery/recovery/stopped-base-package';
afterEach(cleanupFakes);
function fixture() {
    const f=fakeGitHub(),job=f.candidate({stage:'validate'});job.stoppedBaseUpdate={preservedCandidate:{repairCycle:{pendingFindingIds:['F1']}}} as any;
    const files: Record<string,string>={
        'package.json':JSON.stringify({engines:{node:'>=24.14.0'},packageManager:'pnpm@11.28.10',scripts:{'test:packed':'node scripts/verify-packed-consumer.mjs'}}),
        '.github/workflows/release.yml':'node-version: "24.14.0"\nrun: npm pack --dry-run --ignore-scripts',
        '.releaserc.cjs':"'./scripts/semantic-release-analyzer.cjs'",'scripts/semantic-release-analyzer.cjs':'commits: filterReleaseCommits(context.commits)',
        'scripts/release-commits.cjs':"commits.filter(commit => !String(commit.message || '').includes('[skip release]'))",
    };
    const execute=f.delivery.execute;f.delivery.execute=(async(program: string,args: string[],opts?: any)=>program==='git'&&args[0]==='show'?files[args[1].slice(41)] :program==='git'&&args[0]==='log'?'chore(deps): update [skip release]':execute(program,args,opts)) as any;
    return {...f,job,files,run:()=>stoppedBasePackageInstruction(f.delivery,job)};
}
test('reads committed CMS policy and requests the real isolated packed checks before execution',async()=>{
    const f=fixture();expect(await f.run()).toContain('env -u NPM_CONFIG_WORKSPACE_DIR pnpm run test:packed');
    expect(f.state.calls.every(call=>!call.startsWith('pnpm '))).toBe(true);
});
test.each(['node','packed','suppression','workflow'])('a missing %s policy blocks before QA',async change=>{
    const f=fixture();
    if(change==='node')f.files['package.json']=f.files['package.json'].replace('24.14.0','24.13.0');
    if(change==='packed')f.files['package.json']=f.files['package.json'].replace('test:packed','test:other');
    if(change==='suppression')f.files['scripts/release-commits.cjs']='return commits';
    if(change==='workflow')f.files['.github/workflows/release.yml']='node-version: 20';
    await expect(f.run()).rejects.toThrow('policy');
});
