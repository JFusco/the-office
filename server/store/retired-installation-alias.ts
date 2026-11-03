import {lstatSync,readFileSync,realpathSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {rootArtifact} from './readback-evidence';

/** Read the rename identity captured while the original sibling alias still existed. */
export function retiredInstallationAlias(installation:string){
 const alias=resolve(dirname(installation),'dev-team'),path=resolve(installation,'.local/installation-rename.json');
 const receipt=rootArtifact(installation,path);
 const saved=JSON.parse(readFileSync(path,'utf8')),canonical=lstatSync(installation);
 if(canonical.isSymbolicLink()||!canonical.isDirectory()||realpathSync(installation)!==installation||
  saved.version!==1||saved.alias?.path!==alias||typeof saved.alias.target!=='string'||
  resolve(dirname(alias),saved.alias.target)!==installation||
  !Number.isSafeInteger(saved.alias.dev)||!Number.isSafeInteger(saved.alias.ino)||
  saved.installation?.path!==installation||saved.installation.dev!==canonical.dev||saved.installation.ino!==canonical.ino)
  throw Error('Retired installation rename identity does not match this installation');
 try{lstatSync(alias);throw Error('Retired installation alias must remain absent');}
 catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
 return {alias:{path:alias,target:saved.alias.target as string,dev:saved.alias.dev as number,ino:saved.alias.ino as number},
  installation:{path:installation,dev:canonical.dev,ino:canonical.ino},renameReceipt:receipt};
}
