import {lstatSync,readlinkSync,realpathSync} from 'node:fs';
import {basename,dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {ownedPath} from './readback-evidence';
import type {Store} from './store';

const within=(root:string,path:string)=>{const suffix=relative(root,path);return path===resolve(path)&&!!suffix&&suffix!=='..'&&!suffix.startsWith('..'+sep)&&!isAbsolute(suffix);};
type Owner=Pick<Store,'dataRoot'|'project'>;

/** Only the dev-team -> the-office installation rename may locate this job's old private files. */
export function historicalArtifactPath(store:Owner,jobId:string,path:string){
 if(!/^[a-zA-Z0-9_-]+$/.test(store.project.id)||!/^[a-zA-Z0-9_-]+$/.test(jobId)||store.dataRoot!==resolve(store.dataRoot))return;
 const parts=store.project.id==='cec'?['.local']:['.local','projects',store.project.id];
 let installation=store.dataRoot;for(const _ of parts)installation=dirname(installation);
 if(basename(installation)!=='the-office'||resolve(installation,...parts)!==store.dataRoot)return;
 const alias=resolve(dirname(installation),'dev-team'),oldJob=resolve(alias,...parts,'ticket-work',jobId);
 if(!within(oldJob,path))return;
 const link=lstatSync(alias),target=readlinkSync(alias),canonical=lstatSync(installation);
 if(!link.isSymbolicLink()||resolve(dirname(alias),target)!==installation||canonical.isSymbolicLink()||!canonical.isDirectory()||realpathSync(installation)!==installation||realpathSync(alias)!==installation)throw Error('Historical installation alias is not the verified sibling rename');
 return {historicalPath:path,canonicalPath:resolve(store.dataRoot,'ticket-work',jobId,relative(oldJob,path)),
  alias:{path:alias,target,dev:link.dev,ino:link.ino},installation:{path:installation,dev:canonical.dev,ino:canonical.ino},
  privateRootOwnership:ownedPath({dataRoot:installation},store.dataRoot)};
}

export type HistoricalArtifactPath=NonNullable<ReturnType<typeof historicalArtifactPath>>;
/** The historical locator is context; its alias identity must still hold at the final handoff. */
export function assertHistoricalArtifactPath(store:Owner,jobId:string,saved:HistoricalArtifactPath){
 if(!isDeepStrictEqual(historicalArtifactPath(store,jobId,saved.historicalPath),saved))throw Error('Historical installation alias changed before handoff');
}
