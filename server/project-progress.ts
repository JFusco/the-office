import {command} from './process';
import type {Store} from './store';
import type {TicketJob,BoardUpdate} from '../src/shared';
export class ProjectProgress {
 constructor(private store:Store,private execute:typeof command=command){}
 private async graphql(query:string,variables:Record<string,string|number>,readOnly=true){
  const result=JSON.parse(await this.execute('gh',['api','graphql','--input','-'],{input:JSON.stringify({query,variables}),cwd:this.store.project.repo,timeout:60000,readOnly}));
  if(result.errors?.length)throw new Error(result.errors.map((e:any)=>e.message).join('; '));return result.data;
 }
 private async value(item:string,field:string){
  const data=await this.graphql(`query($item:ID!){node(id:$item){... on ProjectV2Item{id fieldValues(first:100){nodes{... on ProjectV2ItemFieldSingleSelectValue{optionId field{... on ProjectV2SingleSelectField{id}}}} pageInfo{hasNextPage}}}}}`,{item});
  if(data.node?.id!==item||data.node.fieldValues.pageInfo.hasNextPage)throw new Error('Board status read-back coverage is incomplete');
  return data.node.fieldValues.nodes.find((n:any)=>n.field?.id===field)?.optionId;
 }
 async reconcile(job:TicketJob){
  for(const update of job.boardUpdates||[])if(update.status!=='verified'){
   if(await this.value(update.item,update.field)!==update.option)throw new Error('Previous board transition remains uncertain; read back the saved attempt before another write');
   update.status='verified';update.detail='Original board transition verified by read-back; no mutation repeated.';this.store.save();
  }
 }
 async reviewStarted(job:TicketJob){
  const config=this.store.project.githubProject;if(!config)return;
  if(job.status!=='working'||!['review','lead-pr'].includes(job.stage))throw new Error('A claimed active review is required before moving its board card');
  await this.reconcile(job);
  const data=await this.graphql(`query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){id fields(first:100){nodes{... on ProjectV2SingleSelectField{id name options{id name}}} pageInfo{hasNextPage}}}}}`,{owner:config.owner,number:config.number});
  const project=data.user?.projectV2,fields=project?.fields.nodes.filter((f:any)=>f?.name==='Status');
  if(!project?.id||project.fields.pageInfo.hasNextPage||fields?.length!==1)throw new Error('Project Status metadata is incomplete');
  const field=fields[0],options=field.options.filter((o:any)=>o.name.toLowerCase()==='in review');
  if(options.length!==1)throw new Error('Exactly one In review lane is required; no substitute lane was chosen');
  let after='',item:any;const seen=new Set<string>();
  do{
   const page=(await this.graphql(`query($project:ID!,$after:String){node(id:$project){... on ProjectV2{items(first:100,after:$after){nodes{id content{... on Issue{number repository{nameWithOwner}}}} pageInfo{hasNextPage endCursor}}}}}`,{project:project.id,...(after?{after}:{})})).node?.items;
   if(!page?.nodes)throw new Error('Project items are unavailable');
   item=page.nodes.find((i:any)=>i.content?.number===Number(job.key.slice(3))&&i.content.repository?.nameWithOwner===this.store.project.repository);
   if(item)break;
   if(page.pageInfo.hasNextPage&&(!page.pageInfo.endCursor||seen.has(page.pageInfo.endCursor)))throw new Error('Project item pagination did not advance');
   after=page.pageInfo.hasNextPage?page.pageInfo.endCursor:'';seen.add(after);
  }while(after);
  if(!item)throw new Error('Issue has no existing card on its configured board; no card was created');
  const update:BoardUpdate={stage:job.stage,head:job.head,project:project.id,item:item.id,field:field.id,option:options[0].id,target:options[0].name,at:new Date().toISOString(),status:'verified',detail:'In review lane already verified.'};
  const current=await this.value(item.id,field.id),currentLane=field.options.find((o:any)=>o.id===current)?.name?.toLowerCase();
  if(!['ready','in progress','in review'].includes(currentLane||''))throw new Error('Current board lane is deferred, done or unclassified; preserve the human lane before review');
  if(current!==update.option){
   update.status='pending';update.detail='Board review transition started; outcome requires read-back.';(job.boardUpdates??=[]).push(update);this.store.save();
   try{
    await this.graphql(`mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{singleSelectOptionId:$option}}){projectV2Item{id}}}`,{project:project.id,item:item.id,field:field.id,option:update.option},false);
    if(await this.value(item.id,field.id)!==update.option)throw new Error('Review lane could not be verified');
    update.status='verified';update.detail='In review lane verified after the Office claimed this review.';
   }catch(error){update.status='uncertain';update.detail=String(error);this.store.save();throw new Error(`Board transition needs read-back: ${String(error)}`);}
  }else(job.boardUpdates??=[]).push(update);
  const board=this.store.state.github?.board,card=board?.items.find(i=>i.number===Number(job.key.slice(3))&&i.repository===this.store.project.repository);if(card)card.status=update.target;
  this.store.emit('review-board-status',`${job.key}: ${update.target} verified; Sam has claimed ${job.pr?`PR #${job.pr}`:'the candidate'} for review.`,'lead',job.key);
 }
}
