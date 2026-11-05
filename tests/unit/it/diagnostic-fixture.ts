import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Store} from '../../../server/store/store';
import {projectById} from '../../../server/office/projects';
import {coordination} from '../../../server/scheduling/coordination';
export function diagnosticFixture(){
 const root=mkdtempSync(join(tmpdir(),'it-diagnostics-')),store=new Store(':memory:',projectById('brain'),root);
 store.state.coordination=coordination();
 const job:any={id:'retired',key:'GH-310',stage:'prepare-pr',status:'cancelled',steps:[{stage:'source-lifecycle-readback',result:{outcome:'passed',receipts:[{id:'source-lifecycle:retired',action:'source-lifecycle-readback',target:'https://github.com/JFusco/brain/issues/310',verified:true,uncertain:false}]}}]};
 store.state.coordination.jobs=[job];
 const id='native-delivery:retired';store.state.it={checkedAt:'2026-11-05T14:00:00Z',nextCheckAt:'',status:'retrying',services:[],recoveries:{[id]:{status:'needs-human',attempts:3,nextAt:'old',detail:'Original read failed',requestId:'recovery'}},reports:[{id:'original',at:'2026-11-03T20:00:00Z',status:'retrying',summary:'Historical follow-up',actions:[],followUps:[{id,owner:'IT',detail:'GH-310 waits for original source'}],notified:[],fingerprint:''}]};
 return {store,job,id,close(){store.close();rmSync(root,{recursive:true,force:true});}};
}
