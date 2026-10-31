import {createHash} from 'node:crypto';
import {lstatSync,readFileSync,readlinkSync,readdirSync,realpathSync} from 'node:fs';
import {dirname,isAbsolute,relative,resolve,sep} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {continuationWorktree} from './continuation-evidence';
import {ownedPath,artifact,digest,terminationObservation} from './readback-evidence';
import {HOLDS} from './config';
import {deliveryHumanInputs} from './github-context';
import type {Store} from './store';
import type {TicketJob} from '../src/shared';
import type {command} from './process';

type Execute=typeof command;
/** A dangling link is still a remaining path; cleanup absence must never follow it. */
export function localPathPresent(path:string){try{lstatSync(path);return true;}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return false;throw error;}}
function requireProof(ok:unknown,message:string):asserts ok{if(!ok)throw new Error(`Partial local cleanup: ${message}`);}
const blob=(bytes:Buffer)=>createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
const statIdentity=(path:string)=>{const s=lstatSync(path);return{dev:s.dev,ino:s.ino,mode:s.mode};};
/** Read only. Missing tracked files are expected after interrupted removal; changed or additional content is not. */
export async function inspectPartialWorktree(input:{repo:string;worktree:string;head:string;branch:string;original:ReturnType<typeof continuationWorktree>},execute:Execute){
 const {repo,worktree,head,branch,original}=input,read={cwd:repo,timeout:60000,readOnly:true};
 requireProof(/^[a-f0-9]{40}$/.test(head)&&branch&&!branch.startsWith('-')&&worktree===resolve(worktree),'exact candidate identity required');
 const owned=continuationWorktree(worktree);
 requireProof(owned.path===worktree&&isDeepStrictEqual(owned,original)&&typeof owned.gitdir==='string','original linked worktree identity required');
 const pointer=/^gitdir: (.+)\n?$/.exec(owned.gitdir);
 requireProof(pointer,'exact linked Git directory required');
 const common=(await execute('git',['rev-parse','--path-format=absolute','--git-common-dir'],read)).trim();
 requireProof(isAbsolute(common)&&realpathSync(common)===common,'canonical Git common directory required');
 const gitdir=resolve(worktree,pointer[1]);
 requireProof(dirname(gitdir)===resolve(common,'worktrees')&&realpathSync(gitdir)===gitdir,'owned linked Git directory required');
 const gitOwnership=ownedPath({dataRoot:common},gitdir),gitStat=lstatSync(gitdir);
 requireProof(gitStat.isDirectory()&&!gitStat.isSymbolicLink(),'linked Git directory changed');
 const readOwned=(name:string)=>{const path=resolve(gitdir,name),ownership=ownedPath({dataRoot:common},path),stat=lstatSync(path);requireProof(stat.isFile(),'ordinary Git identity file required');return{path,ownership,text:readFileSync(path,'utf8')};};
 const gitFiles=['HEAD','commondir','gitdir'].map(readOwned);
 requireProof(gitFiles[0].text===`ref: refs/heads/${branch}\n`&&resolve(gitdir,gitFiles[1].text.trim())===common&&gitFiles[2].text.trim()===resolve(worktree,'.git'),'Git backpointer, branch or common directory changed');
 const listing=await execute('git',['worktree','list','--porcelain','-z'],read);
 const rows=listing.split('\0\0').filter(Boolean).map(block=>Object.fromEntries(block.split('\0').filter(Boolean).map(line=>{const i=line.indexOf(' ');return i<0?[line,true]:[line.slice(0,i),line.slice(i+1)];})));
 const matches=rows.filter(r=>r.worktree===worktree||r.branch===`refs/heads/${branch}`);
 requireProof(matches.length===1&&matches[0].worktree===worktree&&matches[0].HEAD===head&&matches[0].branch===`refs/heads/${branch}`&&!matches[0].locked&&!matches[0].prunable,'unique unlocked original registration required');
 const ref=(await execute('git',['for-each-ref','--format=%(refname)%09%(objectname)',`refs/heads/${branch}`],read)).trim();
 requireProof(ref===`refs/heads/${branch}\t${head}`,'original local branch tip required');
 const tree=await execute('git',['ls-tree','-rz','--full-tree',head],read);
 const entries=tree.split('\0').filter(Boolean).map(record=>{const match=/^(100644|100755|120000) blob ([a-f0-9]{40})\t([\s\S]+)$/.exec(record);requireProof(match,'unsupported or malformed tracked entry');const path=match[3];requireProof(path!=='.git'&&!path.startsWith('.git/')&&!isAbsolute(path)&&resolve(worktree,path).startsWith(worktree+sep)&&!path.split('/').some(p=>p==='.'||p==='..'||!p),'unsafe tracked path');return{mode:match[1],blob:match[2],path};});
 requireProof(entries.length>0&&new Set(entries.map(e=>e.path)).size===entries.length,'nonempty unique original tree required');
 const tracked=new Map(entries.map(e=>[e.path,e])),parents=new Set<string>();
 for(const e of entries){let p=dirname(e.path);while(p!=='.'){parents.add(p);p=dirname(p);}}
 const present:{path:string;blob:string;mode:string;dev:number;ino:number}[]=[],missing:string[]=[],ignored:{path:string;dev:number;ino:number;mode:number;source:string;line:string;pattern:string}[]=[];
 const verify=(path:string,entry:typeof entries[number])=>{let parent=worktree;for(const part of path.split('/').slice(0,-1)){parent=resolve(parent,part);const directory=lstatSync(parent);requireProof(directory.isDirectory()&&!directory.isSymbolicLink(),'tracked ancestor replaced: '+path);}const abs=resolve(worktree,path),s=lstatSync(abs),mode=s.isSymbolicLink()?'120000':s.isFile()?(s.mode&0o100?'100755':'100644'):'';requireProof(mode===entry.mode,'tracked mode changed: '+path);const bytes=s.isSymbolicLink()?Buffer.from(readlinkSync(abs)):readFileSync(abs);requireProof(blob(bytes)===entry.blob,'tracked blob changed: '+path);return{path,blob:entry.blob,mode,dev:s.dev,ino:s.ino};};
 // Git may consult several ignore sources. Only the selected, still-present original tracked .gitignore is authority.
 const trustedIgnore=new Set<string>();
 for(const entry of entries.filter(e=>e.path==='.gitignore'||e.path.endsWith('/.gitignore'))){try{verify(entry.path,entry);trustedIgnore.add(entry.path);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}}
 const walk=async(dir:string)=>{for(const name of readdirSync(resolve(worktree,dir)).sort()){
  const path=dir?dir+'/'+name:name,abs=resolve(worktree,path);if(path==='.git')continue;
  const entry=tracked.get(path);if(entry){present.push(verify(path,entry));continue;}
  const s=lstatSync(abs);
  if(parents.has(path)){requireProof(s.isDirectory()&&!s.isSymbolicLink(),'tracked ancestor replaced: '+path);await walk(path);continue;}
  requireProof(name!=='.gitignore','unknown ignore file: '+path);
  let output:string;try{output=await execute('git',['-c','core.excludesFile=/dev/null','check-ignore','--no-index','--non-matching','-v','-z','--stdin'],{...read,cwd:worktree,input:path+(s.isDirectory()?'/':'')+'\0'});}catch{throw new Error('Partial local cleanup: additional nonignored content: '+path);}
  const fields=output.split('\0');requireProof(fields.length===5&&fields[4]===''&&fields[0]&&fields[1]&&fields[2]&&!fields[2].startsWith('!')&&fields[3]===path+(s.isDirectory()?'/':''),'positive exact ignore rule required: '+path);
  const source=relative(worktree,resolve(worktree,fields[0]));requireProof(trustedIgnore.has(source),'untrusted ignore source: '+fields[0]);
  verify(source,tracked.get(source)!);
  ignored.push({path,...statIdentity(abs),source,line:fields[1],pattern:fields[2]}); // Deliberately prune ignored directories; never follow links.
 }};
 await walk('');
 const seen=new Set(present.map(e=>e.path));for(const entry of entries)if(!seen.has(entry.path))missing.push(entry.path);
 requireProof(missing.length>0,'positive partial tracked removal required');
 requireProof(isDeepStrictEqual(continuationWorktree(worktree),owned)&&isDeepStrictEqual(ownedPath({dataRoot:common},gitdir),gitOwnership)&&isDeepStrictEqual(gitFiles,['HEAD','commondir','gitdir'].map(readOwned)),'ownership changed during qualification');
 return{version:1 as const,repo,worktree,head,branch,owned,gitdir,gitOwnership,gitFiles,present:present.sort((a,b)=>a.path.localeCompare(b.path)),missing:missing.sort(),ignored:ignored.sort((a,b)=>a.path.localeCompare(b.path))};
}

/** Stable original-bound key, including when controls or a reservation prevent current admission. */
export function partialLocalCleanupKey(job:TicketJob){
 const r=job.closeoutRecovery;if(r?.status!=='cleanup-pending')return;
 const id=`closeout-cleanup:${job.id}:${r.originalWorkId}:${r.proofSha256}:worktree`;
 return `partial-local-cleanup:${job.id}:${digest({id,requestId:r.cleanupRequestId,proof:r.proofSha256,target:job.worktree})}`;
}

/** Cheap admission only. The scheduler-owned handler must repeat full Git/inventory/provider/claim proof. */
export function partialLocalCleanupCandidate(store:Store,job:TicketJob){
 try{
  const r=job.closeoutRecovery;
  if(store.project.provider!=='github'||store.project.id==='brain'||store.state.paused||store.state.draining||HOLDS[job.key]||job.stage!=='closeout'||!['blocked','interrupted'].includes(job.status)||!r||r.status!=='cleanup-pending'||!job.head||!job.worktree||!job.branch||r.operations.worktree?.localResumption||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)))return;
  const cleanup=store.state.coordination?.requests?.find(q=>q.id===r.cleanupRequestId);
  if(!cleanup||cleanup.action!=='cleanup-merged-candidate'||cleanup.key!==job.key||cleanup.head!==r.originalWorkId||!['blocked','interrupted'].includes(cleanup.status))return;
  const id=`closeout-cleanup:${job.id}:${r.originalWorkId}:${r.proofSha256}:worktree`,remoteId=id.slice(0,-'worktree'.length)+'remote',op=r.operations.worktree,remote=r.operations.remote;
  if(!op||op.effectId!==id||!op.processId||!remote||remote.effectId!==remoteId||!remote.processId)return;
  const effect=store.getEffect(id),remoteEffect=store.getEffect(remoteId);
  if(!effect||effect.status!=='uncertain'||!effect.dispatchedAt||!effect.error||effect.work.projectId!==store.project.id||effect.work.kind!=='delivery'||effect.work.id!==job.id||effect.attemptId!==cleanup.id||effect.operation!=='merged-candidate-cleanup-worktree'||effect.target!==job.worktree||effect.authorization!==r.proofSha256||!isDeepStrictEqual(effect.payload,{name:'worktree',head:job.head,mergeCommit:job.mergeCommit,worktree:job.worktree,branch:job.branch})||!isDeepStrictEqual(effect.expectedState,{originalDelete:'not-currently-applied',head:job.head})||remoteEffect?.status!=='verified'||remoteEffect.operation!=='merged-candidate-cleanup-remote'||remoteEffect.target!==`refs/heads/${job.branch}`||remoteEffect.authorization!==r.proofSha256||remoteEffect.attemptId!==cleanup.id)return;
  const file=artifact(store,r.proofPath);if(file.sha256!==r.proofSha256)return;
  const proof=JSON.parse(readFileSync(file.path,'utf8'));
  const identity={id:job.id,key:job.key,head:job.head,pr:job.pr,prUrl:job.prUrl,branch:job.branch,worktree:job.worktree,mergeCommit:job.mergeCommit,mergeIntentId:job.mergeIntentId};
  if(proof.originalWorkId!==r.originalWorkId||proof.originalSessionId!==r.originalSessionId||proof.cleanupRequestId!==cleanup.id||proof.intentId!==r.intentId||proof.checkpointSha256!==r.checkpointSha256||proof.assessment?.outcome!=='passed'||proof.assessment.originalDeletionNotCurrentlyApplied!==true||proof.assessment.completeNativeExecution!==true||proof.assessment.noOtherUncertainEffects!==true||proof.assessment.coreCloseoutVerified!==true||proof.assessment.sourceGatesPreserved!==true||proof.assessment.noHumanHold!==true||proof.providerObservations?.length!==2||!proof.providerObservations.every((p:any)=>p.branchHead===job.head)||!isDeepStrictEqual(proof.project,store.project)||digest(identity)!==digest(proof.jobIdentity)||!isDeepStrictEqual(job.steps,proof.steps)||!isDeepStrictEqual(deliveryHumanInputs(store,job.key),proof.humanInputs)||!isDeepStrictEqual(continuationWorktree(job.worktree),proof.worktree))return;
  if(!isDeepStrictEqual(store.state.workLog?.find(w=>w.id===proof.original.work.id),proof.original.work)||!isDeepStrictEqual(store.state.workLog?.find(w=>w.id===proof.reader.id),proof.reader)||!store.state.coordination?.requests?.some(q=>q.id===r.intentId&&q.action==='reconcile-closeout'&&q.head===r.originalWorkId&&q.status==='completed'))return;
  for(const work of [proof.original.work,proof.reader,{id,processId:op.processId},{id:remoteId,processId:remote.processId}])terminationObservation(store,work as any);
  const key=partialLocalCleanupKey(job);if(!key)return;
  const pendingId=store.state.it?.recoveries[key]?.requestId;
  if(store.state.coordination?.requests?.some(q=>q.action==='reconcile-closeout'&&q.key===job.key&&q.head===r.originalWorkId&&['queued','working'].includes(q.status)&&q.id!==pendingId))return;
  return{key,originalWorkId:r.originalWorkId,cleanupRequestId:cleanup.id,effectId:id};
 }catch{return;}
}
