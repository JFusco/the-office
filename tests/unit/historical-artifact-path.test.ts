import {afterEach,expect,test} from 'vitest';
import {mkdtempSync,mkdirSync,readFileSync,realpathSync,renameSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {historicalArtifactPath,assertHistoricalArtifactPath} from '../../server/historical-artifact-path';
import {artifact} from '../../server/readback-evidence';

const roots:string[]=[];
afterEach(()=>roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true})));
function fixture(){
 const root=realpathSync(mkdtempSync(resolve(tmpdir(),'historical-artifact-')));roots.push(root);
 const installation=resolve(root,'the-office'),alias=resolve(root,'dev-team'),dataRoot=resolve(installation,'.local/projects/cms-field-vocabulary'),jobRoot=resolve(dataRoot,'ticket-work/job');
 mkdirSync(jobRoot,{recursive:true});symlinkSync('the-office',alias);
 const path=resolve(jobRoot,'checks.log'),historical=resolve(alias,'.local/projects/cms-field-vocabulary/ticket-work/job/checks.log');writeFileSync(path,'Original implementation evidence');
 const store={dataRoot,project:{id:'cms-field-vocabulary'}}as any;
 return {root,installation,alias,dataRoot,jobRoot,path,historical,store};
}

test('only the physically verified sibling installation rename returns the same owned job suffix',()=>{
 const a=fixture(),qualified=historicalArtifactPath(a.store,'job',a.historical)!;
 expect(qualified).toMatchObject({historicalPath:a.historical,canonicalPath:a.path,alias:{path:a.alias,target:'the-office'},installation:{path:a.installation}});
 expect(qualified.privateRootOwnership.at(-1)?.path).toBe(a.dataRoot);
 expect(artifact(a.store,qualified.canonicalPath)).toEqual(artifact(a.store,a.path));
 expect(readFileSync(a.historical,'utf8')).toBe(readFileSync(a.path,'utf8'));
 expect(()=>assertHistoricalArtifactPath(a.store,'job',qualified)).not.toThrow();
});
test.each(['arbitrary-alias','other-project','other-job','outside-private-root','non-normalized','canonical-path','unrelated-installation'])('does not classify %s',scenario=>{
 const a=fixture();let path=a.historical;
 if(scenario==='arbitrary-alias'){symlinkSync(a.installation,resolve(a.root,'alias'));path=path.replace('/dev-team/','/alias/');}
 if(scenario==='other-project')path=path.replace('/cms-field-vocabulary/','/brain/');
 if(scenario==='other-job')path=path.replace('/ticket-work/job/','/ticket-work/other/');
 if(scenario==='outside-private-root')path=resolve(a.alias,'evidence.log');
 if(scenario==='non-normalized')path=path.replace('/checks.log','/../job/checks.log');
 if(scenario==='canonical-path')path=a.path;
 if(scenario==='unrelated-installation')a.store.dataRoot=resolve(a.root,'another-office/.local/projects/cms-field-vocabulary');
 expect(historicalArtifactPath(a.store,'job',path)).toBeUndefined();
});
test.each(['removed','retargeted','replaced','ordinary-directory','canonical-installation-replaced','private-root-symlink'])('alias provenance rejects %s before handoff',scenario=>{
 const a=fixture(),qualified=historicalArtifactPath(a.store,'job',a.historical)!;
 if(['removed','retargeted','replaced','ordinary-directory'].includes(scenario))renameSync(a.alias,a.alias+'-original');
 if(scenario==='retargeted'){mkdirSync(resolve(a.root,'elsewhere'));symlinkSync('elsewhere',a.alias);}
 if(scenario==='replaced')symlinkSync('the-office',a.alias);
 if(scenario==='ordinary-directory')mkdirSync(a.alias);
 if(scenario==='canonical-installation-replaced'){renameSync(a.installation,a.installation+'-original');mkdirSync(a.jobRoot,{recursive:true});writeFileSync(a.path,'Original implementation evidence');}
 if(scenario==='private-root-symlink'){renameSync(a.dataRoot,a.dataRoot+'-original');symlinkSync(a.dataRoot+'-original',a.dataRoot);}
 expect(()=>assertHistoricalArtifactPath(a.store,'job',qualified)).toThrow();
});
test.each(['alias-chain','wrong-target','canonical-installation-symlink'])('a new %s cannot establish rename provenance',scenario=>{
 const a=fixture();rmSync(a.alias);
 if(scenario==='alias-chain'){symlinkSync('the-office',resolve(a.root,'intermediate'));symlinkSync('intermediate',a.alias);}
 if(scenario==='wrong-target'){mkdirSync(resolve(a.root,'elsewhere'));symlinkSync('elsewhere',a.alias);}
 if(scenario==='canonical-installation-symlink'){renameSync(a.installation,a.installation+'-original');symlinkSync(a.installation+'-original',a.installation);symlinkSync('the-office',a.alias);}
 expect(()=>historicalArtifactPath(a.store,'job',a.historical)).toThrow();
});
test('canonical file containment still rejects a descendant symlink',()=>{
 const a=fixture(),qualified=historicalArtifactPath(a.store,'job',a.historical)!;
 renameSync(a.path,a.path+'-original');symlinkSync(a.path+'-original',a.path);
 expect(()=>artifact(a.store,qualified.canonicalPath)).toThrow('symbolic links');
});
