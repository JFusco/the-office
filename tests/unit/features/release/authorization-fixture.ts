import { fixture } from '../test-store';
import { document, digest } from '../../../../server/features/documents';
export function authorizationFixture() {
 const f=fixture(), feature=f.feature;
 feature.phase='approval';feature.status='waiting';
 feature.baseline={path:f.root,repository:f.store.project.repository,sha:'base',ref:'main',scope:['src/a.ts'],files:{}};
 feature.briefs.push(document(f.store,feature,'Confirmed brief'));feature.confirmedBrief=feature.briefs[0].digest;
 feature.manifest={provider:'github',destination:f.store.project.repository,items:[{id:'one',title:'First',key:'',action:'create',predecessor:'',criteria:['Exact criterion'],operations:[{id:'create',kind:'create',payload:{},expected:{}}]}]};
 feature.plans.push(document(f.store,feature,'Complete plan\n```feature-manifest\n'+JSON.stringify(feature.manifest)+'\n```'));
 feature.review={run:'run',revision:3,fingerprint:'fingerprint',helperCommit:'helper'} as any;
 return {...f,input:{action:'approve' as const,requestId:'approve',expectedRevision:1,planDigest:feature.plans[0].digest,manifestDigest:digest(feature.manifest)},
 inspect:async()=>({status:'complete',researchDigest:'research',revision:3,fingerprint:'fingerprint',run:'run',plan:feature.plans[0].markdown}) as any,
 compare:async()=>({observedSha:'observed',comparisonDigest:'same-relevant-content'})};
}
