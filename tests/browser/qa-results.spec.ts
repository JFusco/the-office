import type { OfficeSnapshot, StageResult, TicketJob } from '../../src/shared';
import { test, expect } from './fixture-test';
import { evidence, setPreferences } from './support';
const head='a'.repeat(40);
const result={outcome:'blocked',summary:'Synthetic fixture: needs editor sign-in',commit:head,evidence:[],findings:[],receipts:[],previewUrl:'',worktree:'',branch:'',prId:0,qaRunDir:'/synthetic/office-qa/retest-1',paidRuns:0,blocker:'Sign in',qa:{version:1,ticket:'CEC-900',commit:head,stage:'retest',validation:'browser',setup:{status:'blocked',summary:'Visible browser ready; sign-in needed',owner:'Joe',nextAction:'Sign in to the visible Chrome for Testing window',url:'http://localhost:3000',actor:'',resources:['Synthetic fixture only']},cases:[{id:'AC1',kind:'acceptance',check:'Revise selected feedback',status:'not-tested',expected:'Saved revision',observed:'Access unavailable',evidenceIds:[]}],nextOwner:'Joe',nextAction:'Sign in'}};
function ticket(r:any){return {key:'CEC-900',summary:'Synthetic QA Results ticket',url:'https://example.com/CEC-900',type:'Task',status:'QA',statusId:'1',assignee:'fixture',subtask:false,boardMember:true,stage:'retest',activity:'blocked',blocker:'Sign in to the visible browser',commit:head,results:{retest:r},findings:[],evidence:[],runId:'fixture-qa',attempt:1,pilot:true,branch:'',worktree:'',prId:0,previewUrl:'',observedAt:new Date().toISOString()};}
for(const switchProject of [false,true]) test(`QA results open the originating ticket ${switchProject?'after switching projects':'in the same project'}`,async({page,request})=>{
    await setPreferences(request,{quality:'low',reducedMotion:true});
    await request.post('/__fixture/snapshot',{data:{tickets:[ticket({...result,qa:null,outcome:'passed',summary:'Synthetic previous report'})]}});
    await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
    await request.post('/__fixture/snapshot',{data:{tickets:[ticket(result)]}});
    if(switchProject){await page.getByLabel('Office project').selectOption('brain');await expect(page.getByLabel('Office project')).toHaveValue('brain');}
    await page.getByRole('button',{name:'View results',exact:true}).click();
    await expect(page.getByLabel('Office project')).toHaveValue('cec');
    const card=page.locator('[data-qa-results]');await expect(card).toBeVisible();
    await expect(card.getByText('Setup needed',{exact:true})).toBeVisible();
    await expect(card.getByText(/Sign in to the visible Chrome/)).toBeVisible();
    await expect(card.getByText(/Not tested/)).toBeVisible();
    await expect(card.getByText(`Build tested: ${head}`)).toBeVisible();
    await expect(card.getByRole('link',{name:'View full report'})).toHaveAttribute('href',/api\/artifact\?path=/);
    await card.screenshot({path:evidence(`office-single-qa-results-${switchProject?'cross-project':'same-project'}.png`)});
    expect(await request.get('/__fixture/writes').then(r=>r.json())).toEqual([]);
});

test('a queued GitHub ticket opens Evidence directly from a QA notification', async ({page,request}) => {
    await setPreferences(request,{quality:'low',reducedMotion:true});
    const snapshot: OfficeSnapshot = await (await request.get('/api/office?project=brain')).json();
    const original = snapshot.tickets[0];
    const artifact = '/fixture/brain/queued-qa/report.json';
    const proof: StageResult = {outcome:'passed',summary:'Synthetic queued result',commit:head,
        evidence:[{id:'queued-proof',kind:'checks',summary:'Queued QA artifact',path:artifact,url:'',commit:head,environment:'fixture',observedAt:snapshot.serverTime}],
        findings:[],receipts:[],previewUrl:'',worktree:'',branch:'',prId:42,qaRunDir:'',paidRuns:null,blocker:''};
    const job: TicketJob = {id:'queued-qa',key:original.key,stage:'validate',status:'working',pr:42,prUrl:'',
        requestedAt:snapshot.serverTime,head,worktree:'',branch:'',detail:'Fixture validation',steps:[]};
    const publish = async (tickets: OfficeSnapshot['tickets']) => {
        const update = await request.post('/__fixture/snapshot?project=brain',{data:{
            tickets,teamQueue:[{project:'brain',projectName:'Brain',job}],coordination:{...snapshot.coordination,jobs:[job]},
        }});
        expect(update.ok()).toBe(true);
    };
    await publish([original]);
    await page.goto('/');
    await page.getByLabel('Office project').selectOption('brain');
    await page.getByRole('button',{name:/^Open PM mailbox,/}).click();
    const active = page.locator('[data-inspector-scroll]');
    const row = active.getByRole('button',{name:new RegExp('^' + original.key + ' ·')});
    await expect(row).toBeVisible();
    job.steps = [{stage:'validate',result:proof}];
    await publish([original]);
    const toast = page.getByRole('button',{name:'View results',exact:true});
    await expect(toast).toBeVisible();
    await publish([]);
    await expect(row).toHaveCount(0);
    await toast.click();
    await expect(active.getByRole('link',{name:'Queued QA artifact'})).toHaveAttribute('href','/api/artifact?path=' + encodeURIComponent(artifact) + '&project=brain');
    await page.getByRole('button',{name:'Back to ' + original.key,exact:true}).click();
    await expect(active.getByRole('heading',{name:'PR #42 delivery',exact:true})).toBeVisible();
    const rowAfterBack = active.getByRole('button',{name:'Evidence',exact:true});
    await expect(rowAfterBack).toBeFocused();
    const steps = job.steps;
    job.steps = []; await publish([]);
    await expect(rowAfterBack).toHaveCount(0);
    job.steps = steps; await publish([]);
    await expect(rowAfterBack).toBeVisible();
    await expect(active.getByRole('heading',{name:'PR #42 delivery'})).toBeVisible();
});
