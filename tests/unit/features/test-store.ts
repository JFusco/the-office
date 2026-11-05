import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { createFeature } from '../../../server/features/commands';
export function fixture(project = 'brain') {
 const root = mkdtempSync(resolve(tmpdir(), 'feature-boundary-'));
 const store = new Store(':memory:', projectById(project), root);
 store.state.coordination = {enabled:false,activatedAt:'',lastTickAt:'',nextDueAt:'',checkpoints:[],jobs:[],listener:{lastCheckedAt:'',nextCheckAt:'',error:'',assigned:[],reviews:[]}};
 const feature = createFeature(store, {action:'create',requestId:'create',title:'Feature',intent:'Test the boundary'});
 return {root,store,feature,close(){store.close();rmSync(root,{recursive:true,force:true});}};
}
