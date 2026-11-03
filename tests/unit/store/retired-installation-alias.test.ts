import {afterEach,expect,test} from 'vitest';
import {lstatSync,mkdtempSync,mkdirSync,readlinkSync,realpathSync,renameSync,rmSync,symlinkSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {retiredInstallationAlias} from '../../../server/store/retired-installation-alias';
import {assertHistoricalArtifactPath,historicalArtifactPath} from '../../../server/store/historical-artifact-path';
import {artifact} from '../../../server/store/readback-evidence';

const roots:string[]=[];
afterEach(()=>roots.splice(0).forEach(root=>rmSync(root,{recursive:true,force:true})));
function fixture(){
 const root=realpathSync(mkdtempSync(resolve(tmpdir(),'retired-installation-')));roots.push(root);
 const installation=resolve(root,'the-office'),alias=resolve(root,'dev-team'),dataRoot=resolve(installation,'.local/projects/brain');
 mkdirSync(resolve(dataRoot,'ticket-work/job'),{recursive:true});symlinkSync('the-office',alias);
 const identity=(path:string)=>{const stat=lstatSync(path);return {path,dev:stat.dev,ino:stat.ino};};
 const saved={version:1,alias:{...identity(alias),target:readlinkSync(alias)},installation:identity(installation)};
 const receipt=resolve(installation,'.local/installation-rename.json');
 const write=()=>writeFileSync(receipt,JSON.stringify(saved),{mode:0o600});write();rmSync(alias);
 const path=resolve(dataRoot,'ticket-work/job/check.log');writeFileSync(path,'Retained evidence');
 return {root,installation,alias,dataRoot,saved,receipt,write,path,historical:path.replace(installation,alias),store:{dataRoot,project:{id:'brain'}} as any};
}
test('retired sibling receipt locates the original job evidence without recreating the alias',()=>{
 const a=fixture(),provenance=historicalArtifactPath(a.store,'job',a.historical)!;
 expect(retiredInstallationAlias(a.installation)).toMatchObject({alias:a.saved.alias,installation:a.saved.installation});
 expect(provenance.canonicalPath).toBe(a.path);
 expect(artifact(a.store,provenance.canonicalPath)).toEqual(artifact(a.store,a.path));
 expect(provenance).toHaveProperty('renameReceipt.sha256');
 expect(()=>assertHistoricalArtifactPath(a.store,'job',provenance)).not.toThrow();
});
test.each(['missing-receipt','receipt-symlink','private-root-symlink','wrong-version','wrong-alias','wrong-target','wrong-installation','wrong-inode','recreated-alias'])('rejects %s',scenario=>{
 const a=fixture();
 if(scenario==='missing-receipt')rmSync(a.receipt);
 if(scenario==='receipt-symlink'){renameSync(a.receipt,a.receipt+'-original');symlinkSync(a.receipt+'-original',a.receipt);}
 if(scenario==='private-root-symlink'){const local=resolve(a.installation,'.local');renameSync(local,local+'-original');symlinkSync(local+'-original',local);}
 if(scenario==='wrong-version'){a.saved.version=2;a.write();}
 if(scenario==='wrong-alias'){a.saved.alias.path=resolve(a.root,'other');a.write();}
 if(scenario==='wrong-target'){a.saved.alias.target='other';a.write();}
 if(scenario==='wrong-installation'){a.saved.installation.path=resolve(a.root,'other');a.write();}
 if(scenario==='wrong-inode'){a.saved.installation.ino++;a.write();}
 if(scenario==='recreated-alias')symlinkSync('the-office',a.alias);
 expect(()=>retiredInstallationAlias(a.installation)).toThrow();
});
test.each(['changed-receipt','replaced-installation','recreated-alias','descendant-symlink'])('final evidence handoff rejects %s',scenario=>{
 const a=fixture(),provenance=historicalArtifactPath(a.store,'job',a.historical)!;
 if(scenario==='changed-receipt')writeFileSync(a.receipt,JSON.stringify(a.saved)+'\n');
 if(scenario==='replaced-installation'){renameSync(a.installation,a.installation+'-original');mkdirSync(a.dataRoot,{recursive:true});}
 if(scenario==='recreated-alias')symlinkSync('the-office',a.alias);
 if(scenario==='descendant-symlink'){renameSync(a.path,a.path+'-original');symlinkSync(a.path+'-original',a.path);expect(()=>artifact(a.store,provenance.canonicalPath)).toThrow('symbolic links');return;}
 expect(()=>assertHistoricalArtifactPath(a.store,'job',provenance)).toThrow();
});
