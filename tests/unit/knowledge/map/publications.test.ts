import { expect,it } from 'vitest';
import { intakeFixture } from '../slack-intake/fixture';
import { publicationConnections } from '../../../../server/knowledge/map/publications';
import { digest } from '../../../../server/knowledge/slack-intake/config';
import { evidenceIdentity } from '../../../../server/knowledge/sources/evidence-record';
import type { Proposal,SourceUnit } from '../../../../server/knowledge/slack-intake/contracts';
import type { BrainCaptureReceipt,BrainReader } from '../../../../server/knowledge/brain/reader';

it('requires original capture identity and committed incorporation bytes, with no writes or inferred lineage',async()=>{
    const f=intakeFixture();try{
        const requestId=crypto.randomUUID(),body='Accepted private proposal',unitId='CSEED:1',version='v1',unitKey=`${unitId}:${version}`,note='Published accepted guidance',commit='a'.repeat(40),path='knowledge/tooling/published.md';
        const proposal:Proposal={id:requestId,task:'task',domain:'tooling',body,hash:digest(body),units:[unitKey],sourceVersions:[version],status:'captured',configHash:'legacy',sourceId:f.source.id,sourceDigest:f.source.sourceDigest,receipt:{found:true,requestId,id:'candidate',inputSha256:digest(body),domain:'tooling'}};
        f.ledger.put('proposal',requestId,proposal);f.ledger.put('unit',unitKey,{id:unitId,version} as SourceUnit);
        const evidenceId=evidenceIdentity(f.source.id,unitId,version);f.ledger.put('admission',unitKey,{state:'admitted'});f.ledger.put('evidence',evidenceId,{id:evidenceId,sourceId:f.source.id,unitId,version,text:'Private source evidence',contentSha256:digest('Private source evidence'),url:'',readerVersion:'fixture',limitations:[]});
        const receipt:BrainCaptureReceipt={version:1,requestId,found:true,id:'candidate',inputSha256:proposal.hash,domain:'tooling',currentStatus:'pending',disposition:{as:'accepted',at:'2026-11-09T23:00:00Z',pr:372,mergeCommit:commit},lineage:'mapped',publications:[{path,commit,contentSha256:digest(note)}],requestIds:[requestId,crypto.randomUUID()],nextCursor:null};
        let reads=0;const brain:BrainReader={snapshot:async()=>commit,search:async()=>[],captureReceipt:async id=>{expect(id).toBe(requestId);return receipt;},read:async(revision,notePath)=>{reads++;expect(revision).toBe(commit);expect(notePath).toBe(path);return {text:note,contentSha256:digest(note)};}};
        const context={registry:f.registry,stores:new Map([['brain',f.store]]),brain},before=f.ledger.revision();
        const mapped=await publicationConnections(context,'brain');expect(mapped.nodes).toHaveLength(1);expect(mapped.edges).toEqual([{source:evidenceId,target:`publication:${commit}:${path}`,kind:'publication',relation:'incorporated into published note'}]);expect(f.ledger.revision()).toBe(before);expect(f.store.db.prepare('SELECT id FROM effects').all()).toHaveLength(0);
        receipt.lineage='unknown';expect((await publicationConnections(context,'brain')).edges).toHaveLength(0);expect(reads).toBe(1);
        receipt.lineage='mapped';receipt.inputSha256='b'.repeat(64);expect((await publicationConnections(context,'brain')).nodes).toHaveLength(0);expect(reads).toBe(1);
        receipt.inputSha256=proposal.hash;brain.read=async()=>({text:'Different bytes',contentSha256:digest(note)});expect((await publicationConnections(context,'brain')).edges).toHaveLength(0);
        brain.read=async()=>{f.registry.subscribe(f.source.id,'brain',false);return {text:note,contentSha256:digest(note)};};expect((await publicationConnections(context,'brain')).edges).toHaveLength(0);expect(f.ledger.revision()).toBe(before);
    }finally{f.close();}
});
