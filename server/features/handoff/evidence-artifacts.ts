import { mkdirSync, lstatSync, existsSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import type { Store } from '../../store/store';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';
import type { FeatureEvidenceRef } from '../../../src/contracts/features';
import { EVIDENCE_LIMITS, type ProviderEvidence } from './evidence-contract';
import { evidenceDigest } from './evidence-digest';
export function evidenceDirectory(store:Store,key:string):string {
 if(!/^[\w-]{1,100}$/.test(store.project.id)||! /^(?:GH|CEC)-[1-9]\d*$/.test(key))throw new Error('Invalid evidence owner');
 const root=realpathSync(store.dataRoot);let dir=root;
 for(const part of ['assessments',store.project.id,key]){
  dir=resolve(dir,part);if(!existsSync(dir))mkdirSync(dir,{mode:0o700});
  const stat=lstatSync(dir);if(stat.isSymbolicLink()||!stat.isDirectory()||process.getuid&&stat.uid!==process.getuid()||!realpathSync(dir).startsWith(root+sep))throw new Error('Evidence directory is not owned');
 }
 return dir;
}
export function storeEvidence(store:Store,evidence:ProviderEvidence):FeatureEvidenceRef {
 const capturedAt=store.clock.now().toISOString(),envelope={capturedAt,evidence};const bytes=Buffer.from(JSON.stringify(envelope));
 if(bytes.length>EVIDENCE_LIMITS.structuredBytes)throw new Error('Evidence envelope exceeds retained byte limit');
 const sha256=createHash('sha256').update(bytes).digest('hex'),artifact=resolve(evidenceDirectory(store,evidence.key),sha256+'.json');
 if(!existsSync(artifact))writeFileSync(artifact,bytes,{flag:'wx',mode:0o600});
 const read=readBoundedNoFollowSync(artifact,EVIDENCE_LIMITS.structuredBytes);if(!('sha256' in read)||read.sha256!==sha256)throw new Error('Evidence artifact identity changed');
 const states=Object.values(evidence.coverage).map(c=>c.state).concat(evidence.attachments.map(a=>a.coverage.state));
 const coverage=states.includes('permission-denied')?'permission-denied':states.includes('unreadable')?'unreadable':states.includes('truncated')?'truncated':'complete';
 return {artifact,sha256,evidenceDigest:evidenceDigest(evidence),capturedAt,coverage};
}
export function readEvidence(store:Store,key:string,reference:FeatureEvidenceRef):ProviderEvidence {
 if(!/^[a-f0-9]{64}$/.test(reference.sha256)||resolve(reference.artifact)!==resolve(evidenceDirectory(store,key),reference.sha256+'.json'))throw new Error('Evidence reference is not owned');
 const read=readBoundedNoFollowSync(reference.artifact,EVIDENCE_LIMITS.structuredBytes);
 if(!('text' in read)||read.sha256!==reference.sha256)throw new Error('Evidence artifact failed read-back');
 const envelope=JSON.parse(read.text),evidence=envelope.evidence as ProviderEvidence;
 if(evidence.projectId!==store.project.id||evidence.key!==key||evidenceDigest(evidence)!==reference.evidenceDigest)throw new Error('Evidence belongs to another input generation');
 return evidence;
}
