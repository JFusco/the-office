import { command } from '../workers/process';
import type { Store } from '../store/store';
import type { GitHubBoard, GitHubPR, GitHubState, Ticket } from '../../src/shared';

export class GitHubMonitor {
  polling=false;
  constructor(public store:Store,private execute:typeof command=command){}
  async api(path:string,paginate=false):Promise<any>{
    const args=['api',`repos/${this.store.project.repository}/${path}`];
    if(paginate)args.push('--paginate','--slurp');
    const data=JSON.parse(await this.execute('gh',args,{cwd:this.store.project.repo,timeout:60000,readOnly:true}));
    return paginate?data.flat():data;
  }
  async board():Promise<GitHubBoard|undefined>{
    const config=this.store.project.githubProject;if(!config)return;
    const saved=this.store.state.github?.board,previous=saved?.url===config.url?saved:undefined;
    try{
      let after:string|null=null,board:GitHubBoard|undefined;
      do{
        const query=`query($owner:String!,$number:Int!,$after:String){user(login:$owner){projectV2(number:$number){title url shortDescription readme fields(first:100){nodes{... on ProjectV2SingleSelectField{name options{name}}} pageInfo{hasNextPage}} items(first:100,after:$after){nodes{id fieldValues(first:100){nodes{... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2SingleSelectField{name}}}} pageInfo{hasNextPage}} content{... on Issue{number title url state repository{nameWithOwner}}}} pageInfo{hasNextPage endCursor}}}}}`;
        const args=['api','graphql','-f',`query=${query}`,'-f',`owner=${config.owner}`,'-F',`number=${config.number}`];
        if(after)args.push('-f',`after=${after}`);
        const response=JSON.parse(await this.execute('gh',args,{cwd:this.store.project.repo,timeout:60000,readOnly:true}));
        if(response.errors?.length)throw new Error(response.errors.map((e:any)=>e.message).join('; '));
        const p=response.data?.user?.projectV2;if(!p)throw new Error(`${this.store.project.name} project is unavailable`);
        if(p.fields.pageInfo.hasNextPage)throw new Error('Project field pagination is incomplete');
        const status=p.fields.nodes.find((f:any)=>f?.name==='Status');
        if(!status?.options?.length)throw new Error('Project Status lanes are unavailable');
        board??={title:p.title,url:p.url,description:p.shortDescription||'',readme:p.readme||'',observedAt:new Date().toISOString(),error:'',lanes:status.options.map((o:any)=>o.name),items:[]};
        for(const item of p.items.nodes){
          if(item.fieldValues.pageInfo.hasNextPage)throw new Error('Project item fields are incomplete');
          const issue=item.content;if(!issue?.repository)continue;
          board.items.push({id:item.id,number:issue.number,title:issue.title,url:issue.url,repository:issue.repository.nameWithOwner,state:issue.state,status:item.fieldValues.nodes.find((v:any)=>v.field?.name==='Status')?.name||'No status'});
        }
        const next=p.items.pageInfo;
        if(next.hasNextPage&&(!next.endCursor||next.endCursor===after))throw new Error('Project item pagination did not advance');
        after=next.hasNextPage?next.endCursor:null;
      }while(after);
      return board;
    }catch(e){return {...previous,title:previous?.title||this.store.project.name,url:config.url,description:previous?.description||'',readme:previous?.readme||'',observedAt:previous?.observedAt||'',lanes:previous?.lanes||[],items:previous?.items||[],error:`GitHub Project read failed: ${String(e)}. ${/permission|forbidden|scope|403/i.test(String(e))?'Run gh auth refresh -h github.com -s project in your terminal, then recheck Projects access in the Office account.':'Retry the read-only project refresh; the last verified board is retained.'}`};}
  }
  async poll(){
    if(this.polling)return;this.polling=true;
    const prior=this.store.state.github??={status:'idle',observedAt:'',error:'',issues:[],prs:[],runs:[]};
    prior.status='working';this.store.save();
    try{
      const results=await Promise.allSettled([
        this.api('issues?state=open&per_page=100',true),this.api('pulls?state=open&per_page=100',true),this.api('actions/runs?per_page=100'),
      ]);
      for(const r of results)if(r.status==='rejected')throw r.reason;
      const [issues,pulls,runs]=results.map(r=>(r as PromiseFulfilledResult<any>).value);
      const watched=new Set(pulls.map((p:any)=>p.number));
      for(const old of prior.prs)if(!watched.has(old.number)&&old.state==='open')pulls.push(await this.api(`pulls/${old.number}`));
      // Read every current PR's detail/reviews/checks on its actual head. A
      // missing/failed page blocks the observation instead of replacing it.
      const prs:GitHubPR[]=[];
      for(const raw of pulls){
        const p=await this.api(`pulls/${raw.number}`);
        const [reviews,checkPages,statusPages]=await Promise.all([
          this.api(`pulls/${p.number}/reviews?per_page=100`,true),
          this.api(`commits/${p.head.sha}/check-runs?per_page=100`,true),
          this.api(`commits/${p.head.sha}/statuses?per_page=100`,true),
        ]);
        const latestStatuses=new Map<string,any>();for(const s of statusPages)if(!latestStatuses.has(s.context))latestStatuses.set(s.context,s);
        prs.push({linkedIssues:[...String(p.body||'').matchAll(/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)\b/gi)].map(m=>Number(m[1])),number:p.number,title:p.title,state:p.state,draft:p.draft,author:p.user.login,head:p.head.sha,base:p.base.ref,url:p.html_url,mergedAt:p.merged_at||'',mergeable:p.mergeable,
          reviews:reviews.map((r:any)=>({author:r.user.login,state:r.state,commit:r.commit_id})),
          checks:[...checkPages.flatMap((page:any)=>page.check_runs).map((c:any)=>({name:c.name,status:c.status,conclusion:c.conclusion||'',url:c.html_url,sha:c.head_sha})),...Array.from(latestStatuses.values()).map((s:any)=>({name:s.context,status:s.state==='pending'?'pending':'completed',conclusion:s.state,url:s.target_url||'',sha:p.head.sha}))]});
      }
      const observedAt=new Date().toISOString();
      const allIssues=issues.filter((i:any)=>!i.pull_request);
      for(const old of prior.issues)if(old.state==='open'&&!allIssues.some((i:any)=>i.number===old.number))allIssues.push(await this.api(`issues/${old.number}`));
      const board=await this.board();
      const state:GitHubState={status:'idle',observedAt,error:'',prs,board,issues:allIssues.map((i:any)=>({number:i.number,key:`GH-${i.number}`,title:i.title,state:i.state,url:i.html_url,updatedAt:i.updated_at})),
        runs:runs.workflow_runs.map((r:any)=>({id:r.id,name:r.name||r.display_title,status:r.status,conclusion:r.conclusion||'',head:r.head_sha,branch:r.head_branch,event:r.event,attempt:r.run_attempt,url:r.html_url,createdAt:r.created_at,updatedAt:r.updated_at,startedAt:r.run_started_at||''}))};
      this.store.state.github=state;
      for(const issue of state.issues){
        const existing=this.store.state.tickets.find(t=>t.key===issue.key);
        if(existing){Object.assign(existing,{summary:issue.title,status:issue.state,updated:issue.updatedAt,observedAt});continue;}
        if(issue.state!=='open')continue;
        this.store.state.tickets.push({key:issue.key,summary:issue.title,type:'GitHub issue',status:issue.state,statusId:'',assignee:'',subtask:false,boardMember:true,url:issue.url,updated:issue.updatedAt,stage:'mailbox',activity:'waiting',blocker:'',runId:'',attempt:0,commit:'',branch:'',worktree:'',previewUrl:'',prId:0,results:{},findings:[],evidence:[],pilot:false,observedAt} satisfies Ticket);
      }
      this.store.emit('github-observed',`GitHub: ${state.issues.filter(i=>i.state==='open').length} open issues, ${prs.filter(p=>p.state==='open').length} open PRs; Actions tied to observed commits.`,'pm');
    }catch(e){prior.status='blocked';prior.error=String(e);this.store.state.github=prior;this.store.emit('github-blocked',prior.error,'pm');}
    finally{this.polling=false;this.store.save();}
  }
}
