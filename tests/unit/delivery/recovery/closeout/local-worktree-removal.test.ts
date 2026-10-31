import {afterEach,expect,test} from 'vitest';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync,readFileSync,symlinkSync,chmodSync,renameSync,lstatSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {continuationWorktree} from '../../../../../server/delivery/recovery/implementation/continuation-evidence';
import {inspectPartialWorktree} from '../../../../../server/delivery/recovery/closeout/local-worktree-removal';
import type {command} from '../../../../../server/workers/process';
const roots:string[]=[];
afterEach(()=>roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true})));
const env={...process.env,GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null'};
function fixture(executable=false){
 const root=realpathSync(mkdtempSync(resolve(tmpdir(),'office-partial-removal-test-')));roots.push(root);
 const repo=resolve(root,'repo'),worktree=resolve(root,'owned'),outside=resolve(root,'outside');mkdirSync(repo);mkdirSync(outside);writeFileSync(resolve(outside,'keep'),'human content');
 const git=(args:string[],cwd=repo)=>execFileSync('git',args,{cwd,env,encoding:'utf8'});
 git(['init','-q']);git(['config','user.name','Fixture']);git(['config','user.email','fixture@example.invalid']);
 writeFileSync(resolve(repo,'.gitignore'),'node_modules/\nignored-file\n');writeFileSync(resolve(repo,'keep.txt'),'exact original\n');writeFileSync(resolve(repo,'remove.txt'),'removed by original cleanup\n');mkdirSync(resolve(repo,'nested'));writeFileSync(resolve(repo,'nested/.gitignore'),'cache/\n');writeFileSync(resolve(repo,'nested/keep'),'exact nested');symlinkSync('keep.txt',resolve(repo,'tracked-link'));if(executable)chmodSync(resolve(repo,'keep.txt'),0o755);git(['add','.']);git(['commit','-qm','Fixture']);
 const head=git(['rev-parse','HEAD']).trim(),branch='codex/fixture';git(['worktree','add','-qb',branch,worktree]);
 const original=continuationWorktree(worktree);rmSync(resolve(worktree,'remove.txt'));
 mkdirSync(resolve(worktree,'node_modules'));writeFileSync(resolve(worktree,'node_modules/untracked'),'package bytes');symlinkSync(outside,resolve(worktree,'node_modules/outside-link'));
 const execute:typeof command=async(program,args,options={})=>execFileSync(program,args,{cwd:options.cwd,input:options.input,env,encoding:'utf8',stdio:['pipe','pipe','pipe']});
 const inspect=()=>inspectPartialWorktree({repo,worktree,head,branch,original},execute);
 return{root,repo,worktree,outside,head,branch,original,git,execute,inspect};
}
test('qualifies only original surviving blobs and modes, pruning authorized ignored trees without following links',async()=>{
 const a=fixture(),proof=await a.inspect();expect(proof.missing).toEqual(['remove.txt']);expect(proof.present.map(p=>p.path)).toContain('tracked-link');expect(proof.ignored).toHaveLength(1);expect(proof.ignored[0]).toMatchObject({path:'node_modules',source:'.gitignore',line:'1',pattern:'node_modules/'});expect(readFileSync(resolve(a.outside,'keep'),'utf8')).toBe('human content');expect(proof.gitdir).toBe(resolve(a.repo,'.git/worktrees/owned'));
 expect(await a.inspect()).toEqual(proof);
});
test.each(['blob','mode','group-exec','symlink','directory','root','git-pointer','git-backpointer','head','locked','new-file','new-directory','unknown-ignore','modified-ignore','global-ignore','info-ignore','missing-ignore','no-partial'])('rejects unsafe partial removal: %s',async scenario=>{
 const a=fixture(scenario==='group-exec'),path=(p:string)=>resolve(a.worktree,p);
 if(scenario==='blob')writeFileSync(path('keep.txt'),'human changes');
 if(scenario==='mode')chmodSync(path('keep.txt'),0o755);
 if(scenario==='group-exec'){expect(a.git(['ls-tree',a.head,'keep.txt'])).toMatch(/^100755 blob /);chmodSync(path('keep.txt'),0o654);}
 if(scenario==='symlink'){rmSync(path('tracked-link'));symlinkSync(a.outside,path('tracked-link'));}
 if(scenario==='directory'){writeFileSync(resolve(a.outside,'.gitignore'),'cache/\n');rmSync(path('nested'),{recursive:true});symlinkSync(a.outside,path('nested'));}
 if(scenario==='root'){renameSync(a.worktree,a.worktree+'-old');roots.push(a.worktree+'-old');mkdirSync(a.worktree);writeFileSync(path('.git'),a.original.gitdir!);}
 if(scenario==='git-pointer'){renameSync(path('.git'),path('.git-old'));writeFileSync(path('.git'),a.original.gitdir!);}
 if(scenario==='git-backpointer')writeFileSync(resolve(a.repo,'.git/worktrees/owned/gitdir'),'/foreign/.git\n');
 if(scenario==='head')a.git(['symbolic-ref','HEAD','refs/heads/foreign'],a.worktree);
 if(scenario==='locked')a.git(['worktree','lock',a.worktree]);
 if(scenario==='new-file')writeFileSync(path('human-new.txt'),'new');
 if(scenario==='new-directory'){mkdirSync(path('human'));writeFileSync(path('human/new.txt'),'new');}
 if(scenario==='unknown-ignore'){writeFileSync(path('.ignore-global'),'secret\n');a.git(['config','core.excludesFile',path('.ignore-global')]);writeFileSync(path('secret'),'human');}
 if(scenario==='modified-ignore')writeFileSync(path('.gitignore'),'node_modules/\nhuman-new.txt\n');
 if(scenario==='global-ignore'){const exclude=resolve(a.root,'global-ignore');writeFileSync(exclude,'secret\n');a.git(['config','core.excludesFile',exclude]);writeFileSync(path('secret'),'human');}
 if(scenario==='info-ignore'){writeFileSync(resolve(a.repo,'.git/info/exclude'),'secret\n');writeFileSync(path('secret'),'human');}
 if(scenario==='missing-ignore')rmSync(path('.gitignore'));
 if(scenario==='no-partial')writeFileSync(path('remove.txt'),'removed by original cleanup\n');
 await expect(a.inspect()).rejects.toThrow(scenario==='directory'?'tracked ancestor replaced':['mode','group-exec'].includes(scenario)?'tracked mode changed':undefined);expect(readFileSync(resolve(a.outside,'keep'),'utf8')).toBe('human content');
});
test('rejects an untracked nested ignore source even when Git would select its rule',async()=>{
 const a=fixture();writeFileSync(resolve(a.worktree,'nested/.gitignore'),'cache/\nnew-cache/\n');mkdirSync(resolve(a.worktree,'nested/new-cache'));await expect(a.inspect()).rejects.toThrow('tracked blob changed');
});
test('a tracked nested ignore is independently authorized at its original blob',async()=>{
 const a=fixture();mkdirSync(resolve(a.worktree,'nested/cache'));writeFileSync(resolve(a.worktree,'nested/cache/keep'),'ignored');const proof=await a.inspect();expect(proof.ignored.find(p=>p.path==='nested/cache')).toMatchObject({source:'nested/.gitignore',pattern:'cache/'});
});
test.each(['absolute','relative'])('a tracked nested ignore cannot authorize root content through core.excludesFile: %s',async mode=>{
 const a=fixture();a.git(['config','core.excludesFile',mode==='absolute'?resolve(a.worktree,'nested/.gitignore'):'nested/.gitignore']);
 mkdirSync(resolve(a.worktree,'nested/cache'));writeFileSync(resolve(a.worktree,'nested/cache/keep'),'ignored');
 const proof=await a.inspect();expect(proof.ignored.find(p=>p.path==='nested/cache')).toMatchObject({source:'nested/.gitignore',pattern:'cache/'});
 mkdirSync(resolve(a.worktree,'cache'));writeFileSync(resolve(a.worktree,'cache/human.txt'),'human content');expect(a.git(['check-ignore','cache/'],a.worktree)).toBe('cache/\n');
 await expect(a.inspect()).rejects.toThrow('additional nonignored content: cache');expect(readFileSync(resolve(a.worktree,'cache/human.txt'),'utf8')).toBe('human content');
});
test('qualification itself never removes a file, changes a ref or mutates the worktree registry',async()=>{
 const a=fixture(),before=a.git(['worktree','list','--porcelain']),ino=lstatSync(a.worktree).ino;await a.inspect();expect(a.git(['worktree','list','--porcelain'])).toBe(before);expect(lstatSync(a.worktree).ino).toBe(ino);expect(a.git(['rev-parse',`refs/heads/${a.branch}`]).trim()).toBe(a.head);
});
