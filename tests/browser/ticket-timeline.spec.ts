import { expect, test } from './fixture-test';
import { fixtureMode } from './support';
import { jiraQueueProgress } from '../../server/cec/queue-progress';
import type { OfficeSnapshot, ProgressionItem, Stage, StageResult, TeamMessage, TicketJob } from '../../src/shared';

for (const mode of ['animated desktop','system reduced mobile','Office reduced desktop']) {
    test('ticket timeline follows live QA handoffs · ' + mode, async ({page,context,request}) => {
        test.skip(!fixtureMode, 'Uses the synthetic fixture stream');
        const reduced = mode !== 'animated desktop';
        await page.emulateMedia({reducedMotion: mode === 'system reduced mobile' ? 'reduce' : 'no-preference'});
        if (mode.includes('mobile')) await page.setViewportSize({width:390,height:844});
        await request.post('/__fixture/preferences',{data:{reducedMotion:mode === 'Office reduced desktop'}});
        const state: OfficeSnapshot = await (await request.get('/api/office')).json();
        const ticket = state.tickets[1];
        state.tickets.push(...Array.from({length:6},(_,i) => ({...ticket,key:'CEC-' + (901+i),
            summary:'Fixture stopped delivery ' + (i+1),activity:'blocked' as const,blocker:'Waiting for access'})));
        const post = async (withSummary = true) => {
            const summaries = jiraQueueProgress(state.project!,state,new Date());
            const jiraQueueProgressRows = withSummary ? summaries : summaries.filter(row => row.key !== ticket.key);
            const response = await request.post('/__fixture/snapshot',{data:{
                tickets:state.tickets,events:state.events,lastHandoff:state.lastHandoff,jiraQueueProgress:jiraQueueProgressRows,
            }});
            expect(response.ok()).toBe(true);
        };
        async function push(stage: Stage, label: string) {
            Object.assign(ticket,{stage,activity:'working',pilot:true});
            if (stage === 'complete') ticket.production = {doneAt:new Date().toISOString()};
            else state.events.unshift({id:state.events.length+10,at:new Date().toISOString(),kind:'stage-started',ticket:ticket.key,message:label});
            await post();
        }
        Object.assign(ticket,{stage:'mailbox',pilot:true});
        await post();
        await page.goto('/');
        const queue = page.getByRole('button',{name:/^PM queue \d+:/});
        await queue.click();
        await page.getByRole('button',{name:/^Queued next/}).click();
        const queued = page.getByRole('region',{name:'Queued next'});
        const openTicket = page.locator('[data-card]').filter({hasText:ticket.key}).getByRole('button',{name:'Open CEC ticket'});
        await expect(queued.getByRole('button',{name:'Open CEC ticket'})).toHaveCount(1);
        await openTicket.focus();
        await expect(openTicket).toBeFocused();
        const scroll = page.locator('[data-inspector-scroll]');
        await scroll.evaluate(el => {el.scrollTop = 16;});
        const initialScroll = await scroll.evaluate(el => el.scrollTop);
        await push('qa','QA received the change');
        const card = queued.locator('[data-card]').filter({hasText:ticket.key});
        await expect(card).toContainText('Riley');
        await expect(queued.getByRole('heading',{name:'Queued next 0',exact:true})).toBeVisible();
        const overviewRow = page.locator('[data-drawer-page="root"] [data-drawer-row]').filter({hasText:'Queued next'});
        await expect(overviewRow.getByText('0',{exact:true})).toHaveText('0');
        await expect(openTicket).toBeFocused();
        expect(await scroll.evaluate(el => el.scrollTop)).toBe(initialScroll);
        await openTicket.click();
        const timeline = page.getByRole('region',{name:'Ticket timeline'});
        const current = timeline.locator('[aria-current="step"]');
        await expect(current).toContainText('Riley');
        await expect(page.getByText('Jira status · In Progress',{exact:true})).toBeVisible();
        await expect(current).not.toHaveAttribute('data-transition',/.+/);
        state.lastHandoff = {from:'lead',to:'qa',ticket:ticket.key,at:new Date().toISOString()};
        await post(false);
        const handoff = timeline.getByText('Sam handed off to Riley',{exact:true});
        await expect(handoff).toBeVisible();
        await context.setOffline(true);
        const lastConfirmed = timeline.getByText(/^Last confirmed · /);
        await expect(lastConfirmed).toBeVisible();
        const confirmedAt = await lastConfirmed.locator('time').getAttribute('datetime');
        expect(confirmedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        await expect(handoff).toBeVisible();
        await expect(timeline.getByRole('status')).toContainText('Verifying the change');
        await expect(timeline.getByRole('status')).not.toContainText('Interrupted');
        await queue.click();
        const queueDrawer = page.getByRole('complementary',{name:'PM queue',exact:true});
        await expect(queueDrawer.getByText(/^Last confirmed · /).locator('time')).toHaveAttribute('datetime',confirmedAt!);
        const mailbox = page.getByRole('button',{name:/^Open PM mailbox,/});
        const mailboxDrawer = page.getByRole('complementary',{name:'PM mailbox',exact:true});
        await mailbox.click();
        await page.getByRole('button',{name:/^Already with the team/}).click();
        await mailboxDrawer.getByRole('button',{name:ticket.key + ' Verifying the change',exact:true}).click();
        await expect(timeline.getByText(/^Last confirmed · /).locator('time')).toHaveAttribute('datetime',confirmedAt!);
        await context.setOffline(false);
        await expect(timeline.getByText('Live',{exact:true})).toBeVisible();
        await expect(current).not.toHaveAttribute('data-transition',/.+/);

        const close = page.getByRole('button',{name:'Close details',exact:true});
        await close.focus();
        await scroll.evaluate(el => {el.scrollTop = 16;});
        const scrollTop = await scroll.evaluate(el => el.scrollTop);
        const title = ticket.summary;
        for (const [stage, label] of [['repair','Alex picked up the repair'],['retest','QA received the repair'],['complete','Verified Jira closeout']] as const) {
            await push(stage,label);
            await expect(current).toContainText({repair:'Alex',retest:'Riley',complete:'Delivery complete'}[stage]);
            await expect(timeline.getByText(label,{exact:true})).toHaveCount(1);
            if (reduced) await expect(current).not.toHaveAttribute('data-transition',/.+/);
            else await expect(current).toHaveAttribute('data-transition',/.+/);
            await expect(close).toBeFocused();
            expect(await scroll.evaluate(el => el.scrollTop)).toBe(scrollTop);
            const marker = await current.locator(':scope > span').elementHandle();
            ticket.summary = title + ' · observation ' + stage;
            await post();
            await expect(page.getByRole('heading',{name:ticket.summary,exact:true})).toBeVisible();
            expect(await current.evaluate((li, prior) => li.firstElementChild === prior, marker!)).toBe(true);
        }
        await context.setOffline(true);
        await expect(timeline).toContainText('Last confirmed');
        await context.setOffline(false);
        await expect(timeline.getByText('Live',{exact:true})).toBeVisible();
        await expect(current).not.toHaveAttribute('data-transition',/.+/);
        await close.click();
        await mailbox.click();
        await page.getByRole('button',{name:/^Already with the team/}).click();
        await mailboxDrawer.getByRole('button',{name:ticket.key + ' Verified on staging',exact:true}).click();
        await expect(current).toContainText('Delivery complete');
        await expect(current).not.toHaveAttribute('data-transition',/.+/);
    });
}

test('the PM queue opens the matching project and keeps the approval beside its timeline', async ({page,request}) => {
    test.skip(!fixtureMode, 'Uses synthetic cross-project snapshots');
    await request.post('/__fixture/preferences',{data:{deliveryToasts:true}});
    const brain: OfficeSnapshot = await (await request.get('/api/office?project=brain')).json();
    const ticket = brain.tickets[0];
    const tickets = brain.tickets.filter(t => t.key !== ticket.key);
    const pr = 42;
    const requestedAt = '2026-11-24T10:00:00Z', artifact = '/fixture/brain/runs/qa/report.json';
    const proof: StageResult = {outcome:'passed',summary:'Recorded validation result',commit:'fixture',
        evidence:[{id:'proof',kind:'checks',summary:'Saved validation artifact',path:artifact,commit:'fixture',environment:'fixture',url:'',observedAt:requestedAt}],
        findings:[],receipts:[],previewUrl:'',worktree:'',branch:'',prId:pr,qaRunDir:'',paidRuns:null,blocker:''};
    const worker = {...brain.workLog![0],id:'timeline-validation',ticket:ticket.key,task:'Recorded validation worker session',stage:'validate'};
    const job: TicketJob = {id:'timeline-review',key:ticket.key,stage:'lead-pr',status:'watching',pr,prUrl:'https://example.org/pull/42',
        requestedAt,head:'fixture',worktree:'',branch:'',detail:'Waiting for the reviewed head',
        steps:[{stage:'validate',result:proof,workerId:worker.id}],mergeApprovalRequired:true};
    const teamQueue = [{project:'brain',projectName:'Brain',job},
        {project:'cms-field-vocabulary',projectName:'CMS field vocabulary',job:{...job,mergeApprovalRequired:false,status:'interrupted' as const}}];
    const progression: ProgressionItem[] = [{work:{projectId:'brain',kind:'delivery',id:job.id},stage:job.stage,rank:1,enqueuedAt:requestedAt,
        eligibility:{state:'waiting',reason:'Work is watching',owner:'Morgan',nextCheckAt:null}}];
    const messages: TeamMessage[] = [{id:'recorded-discussion',requestId:'recorded-discussion',from:'human',to:'pm',ticket:ticket.key,
        body:'Recorded discussion for the Brain delivery',createdAt:requestedAt,status:'answered',
        actionId:'',sessionId:'',error:'',recheck:false,recipients:[],receipts:[]}];
    const post = async () => {
        const response = await request.post('/__fixture/snapshot?project=brain',{data:{
            teamQueue,progression,tickets,messages,workLog:[...brain.workLog!,worker],coordination:{...brain.coordination,jobs:[job]},
        }});
        expect(response.ok()).toBe(true);
    };
    await request.post('/__fixture/snapshot?project=cec',{data:{teamQueue,progression}});
    await post();
    await page.goto('/');
    const queue = page.getByRole('button',{name:/^PM queue \d+:/});
    await queue.click();
    await page.getByRole('button',{name:/^Waiting for the next step/}).click();
    const row = page.locator('[data-card]').filter({hasText:'Brain · ' + ticket.key});
    await expect(row).toContainText('Needs your approval');
    await expect(row).toContainText('You · Review PR #42');
    await row.getByRole('button',{name:'Open Brain ticket'}).click();
    const timeline = page.getByRole('region',{name:'Ticket timeline'});
    await expect(page.getByLabel('Office project')).toHaveValue('brain');
    await expect(timeline.getByRole('status')).toContainText('Needs your approval');
    await expect(timeline.getByRole('button',{name:'Approve merge of PR #42'})).toBeVisible();
    job.mergeApprovalRequired = false;
    job.stop = {kind:'provider-checks',at:requestedAt};
    job.detail = 'Current-head checks are still running.';
    await post();
    await expect(timeline.getByRole('status')).toContainText('Waiting for GitHub checks');
    await expect(timeline.getByRole('link',{name:'View PR #42'})).toHaveAttribute('href',job.prUrl);
    await expect(timeline.getByRole('button',{name:'Approve merge of PR #42'})).toHaveCount(0);
    await expect(queue).not.toHaveAttribute('aria-label',/waiting on prerequisites/);
    await queue.click();
    await page.getByRole('button',{name:/^Waiting for the next step/}).click();
    const waiting = page.getByRole('region',{name:'Waiting for the next step'});
    await expect(waiting.locator('[data-card]').filter({hasText:'Brain · ' + ticket.key})).toContainText('Waiting for GitHub checks');
    await expect(waiting.getByRole('link',{name:'PR #42 ↗'})).toHaveAttribute('href',job.prUrl);
    await row.getByRole('button',{name:'Open Brain ticket'}).click();
    const drawer = page.getByRole('complementary',{name:'Ticket',exact:true});
    await expect(drawer.getByRole('link',{name:'PR #42',exact:true})).toHaveAttribute('href',job.prUrl);
    await page.getByRole('button',{name:/^Evidence/}).click();
    await expect(drawer.getByRole('link',{name:'Saved validation artifact'}))
        .toHaveAttribute('href','/api/artifact?path=' + encodeURIComponent(artifact) + '&project=brain');
    await page.getByRole('button',{name:/^Back to /}).click();await page.getByRole('button',{name:/^Time/}).click();
    const timeBook = drawer.getByRole('region',{name:'Time reported to Morgan'});
    await timeBook.getByText(/^Worker sessions/).click();
    await expect(timeBook.getByText(worker.task,{exact:true})).toBeVisible();
    await page.getByRole('button',{name:/^Back to /}).click();
    const openTimeline = await timeline.elementHandle();
    job.status = 'completed';
    job.stage = 'closeout';
    job.stop = undefined;
    await post();
    await expect(timeline.getByRole('status')).toHaveText('Delivery complete');
    expect(await timeline.evaluate((el,original) => el === original,openTimeline!)).toBe(true);
    await expect(timeline.getByText(proof.summary,{exact:true})).toBeVisible();
    await expect(page.getByText(ticket.key + ' · PR #42: Delivery complete; issue and board closeout verified.',{exact:true})).toBeVisible();
    await expect(page.getByRole('status').filter({hasText:'Delivery complete'})).toHaveCount(1);
    await drawer.getByRole('button',{name:'Discuss ' + ticket.key + ' with Morgan'}).click();
    await expect(page.getByRole('log',{name:'Team conversation'})).toContainText(messages[0].body);
    await queue.click();
    await expect(page.getByRole('heading',{name:'PM queue',exact:true})).toBeVisible();
    await page.getByRole('button',{name:/^Stopped/}).click();
    await expect(row).toHaveCount(0);
    await expect(page.locator('[data-card]').filter({hasText:'CMS field vocabulary · ' + ticket.key})).toHaveCount(1);
});
